import io
import logging
import os
import re
import shutil
import cv2
import numpy as np
from PIL import Image, ImageOps
import pytesseract

logger = logging.getLogger(__name__)

# Discovery lokasi binary tesseract lintas platform (macOS Homebrew, Linux, Docker)
if not shutil.which("tesseract"):
    for cand in [
        "/opt/homebrew/bin/tesseract",
        "/usr/local/bin/tesseract",
        "/usr/bin/tesseract",
    ]:
        if os.path.exists(cand):
            pytesseract.pytesseract.tesseract_cmd = cand
            break


def normalisasi_karakter_ocr(teks: str) -> str:
    """Mengubah karakter yang sering tertukar OCR menjadi padanan angka:
    O/o -> 0, I/l/| -> 1, B -> 8, S/s -> 5.
    
    Hanya diaplikasikan pada kandidat deretan angka ISBN, bukan pada prefix teks.
    """
    substitusi = {
        "O": "0", "o": "0",
        "I": "1", "l": "1", "|": "1",
        "B": "8",
        "S": "5", "s": "5",
    }
    return "".join(substitusi.get(c, c) for c in teks)


def validasi_isbn13(isbn: str) -> bool:
    """Memvalidasi digit kontrol ke-13 secara matematis (ISO standard Modulo-10)."""
    if len(isbn) != 13 or not isbn.isdigit():
        return False

    # Bobot selang-seling 1 dan 3 untuk 12 digit pertama
    total = sum(
        int(d) * (1 if i % 2 == 0 else 3) for i, d in enumerate(isbn[:12])
    )
    sisa = (10 - (total % 10)) % 10
    return sisa == int(isbn[-1])


def validasi_isbn10(isbn: str) -> bool:
    """Memvalidasi nomor ISBN-10 lama secara matematis (Modulo-11)."""
    if len(isbn) != 10:
        return False
    total = 0
    for i in range(9):
        if not isbn[i].isdigit():
            return False
        total += int(isbn[i]) * (10 - i)
    check = isbn[9]
    if check in ["X", "x"]:
        total += 10
    elif check.isdigit():
        total += int(check)
    else:
        return False
    return total % 11 == 0


def konversi_isbn10_ke_13(isbn10: str) -> str:
    """Mengonversi nomor ISBN-10 menjadi format ISBN-13 standar (berawalan 978)."""
    core = "978" + isbn10[:9]
    total = sum(int(d) * (1 if i % 2 == 0 else 3) for i, d in enumerate(core))
    check = (10 - (total % 10)) % 10
    return core + str(check)


def cari_isbn_dari_teks(teks_dokumen: str) -> str | None:
    """Mencari dan memvalidasi nomor ISBN dari teks hasil OCR.
    
    Menerapkan pembersihan karakter serupa dan verifikasi Modulo-10.
    """
    if not teks_dokumen:
        return None

    # 1. Pola Utama: Awalan kata ISBN / 1SBN / lSBN diikuti deretan karakter
    pola_prefix = r"(?i)(?:ISBN|1SBN|lSBN)\s*[:.-]?\s*([0-9A-Za-z\s|\-]{10,35})"
    for match in re.finditer(pola_prefix, teks_dokumen):
        raw_val = match.group(1).strip()
        norm_val = normalisasi_karakter_ocr(raw_val)
        digits = re.sub(r"[^0-9]", "", norm_val)
        for i in range(len(digits) - 12):
            sub = digits[i:i + 13]
            if (sub.startswith("978") or sub.startswith("979")) and validasi_isbn13(sub):
                return sub

    # 2. Pola Kedua: Angka berawalan 978 atau 979 dengan pemisah atau huruf tertukar
    pola_978 = r"(?i)\b(?:978|979)[0-9A-Za-z\s|\-]{9,25}\b"
    for match in re.finditer(pola_978, teks_dokumen):
        raw_val = match.group(0).strip()
        norm_val = normalisasi_karakter_ocr(raw_val)
        digits = re.sub(r"[^0-9]", "", norm_val)
        for i in range(len(digits) - 12):
            sub = digits[i:i + 13]
            if (sub.startswith("978") or sub.startswith("979")) and validasi_isbn13(sub):
                return sub

    # 3. Pola Ketiga: Deretan 13 digit angka murni
    semua_angka = re.findall(r"\b(?:978|979)[0-9]{10}\b", teks_dokumen)
    for angka in semua_angka:
        if validasi_isbn13(angka):
            return angka

    # 4. Pola Keempat: Dukungan ISBN-10 legacy jika ditemukan
    pola_10 = r"(?i)(?:ISBN\s*[:.-]?\s*)?([0-9]{9}[0-9Xx])\b"
    for match in re.finditer(pola_10, teks_dokumen):
        cand10 = match.group(1).strip()
        if validasi_isbn10(cand10):
            return konversi_isbn10_ke_13(cand10)

    return None


def ekstrak_isbn_dari_gambar(
    file_bytes: bytes = None, path_gambar: str = None
) -> str | None:
    """Mengekstrak dan memvalidasi nomor ISBN-13 dari citra KDT/Barcode buku.

    Fitur & Alur Penanganan:
    1. Orientasi EXIF & In-Memory: Menggunakan PIL.Image & PIL.ImageOps.exif_transpose
       untuk merotasi foto potret ponsel (khususnya iPhone) ke orientasi asli secara in-memory.
    2. Dynamic Rescaling:
       - Jika lebar w > 1800: downscale ke 1800 px (cv2.INTER_AREA) untuk efisiensi RAM & akurasi OCR.
       - Jika lebar w < 1200: upscale ke 1200 px (cv2.INTER_CUBIC) agar teks kecil KDT tetap tajam.
    3. Pra-pemrosesan Kontras & Binarisasi:
       - CLAHE (clipLimit=2.0, tileGridSize=(8, 8)) meratakan pencahayaan & bayangan tangan/ponsel.
       - cv2.adaptiveThreshold (Gaussian C) untuk penanganan bayangan lokal.
       - cv2.threshold (Otsu) untuk pemisahan global teks dari latar belakang.
    4. Multi-PSM Fallback:
       - Mengevaluasi PSM 11 (Sparse text) dan PSM 3 (Fully automatic page segmentation).
    5. Normalisasi Karakter Confusable:
       - Mengoreksi huruf yang sering tertukar OCR (O/o->0, I/l/|->1, B->8, S/s->5)
         sebelum validasi Modulo-10 checksum.
    """
    pil_img = None
    try:
        # 1. Baca raw bytes atau path menggunakan PIL
        if file_bytes is not None:
            pil_img = Image.open(io.BytesIO(file_bytes))
        elif path_gambar is not None:
            pil_img = Image.open(path_gambar)
        else:
            return None

        # Memperbaiki orientasi berdasarkan metadata EXIF bawaan kamera ponsel
        pil_img = ImageOps.exif_transpose(pil_img)

        # Konversi ke mode RGB jika mode gambar RGBA, P (Palette), atau Grayscale
        if pil_img.mode != "RGB":
            pil_img = pil_img.convert("RGB")

        # Konversi objek PIL menjadi array NumPy BGR untuk OpenCV
        img_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    except Exception as e:
        logger.error("Gagal mendekode gambar atau membaca EXIF via PIL: %s", e)
        return None
    finally:
        if pil_img is not None:
            try:
                pil_img.close()
            except Exception:
                pass

    if img_bgr is None or img_bgr.size == 0:
        logger.warning("Citra kosong setelah proses decoding.")
        return None

    # 2. Dynamic Rescaling (Downscaling & Upscaling)
    h, w = img_bgr.shape[:2]
    if w > 1800:
        # Downscale ke lebar 1800 px menggunakan interpolation=cv2.INTER_AREA
        skala = 1800.0 / w
        target_w = 1800
        target_h = int(h * skala)
        img_bgr = cv2.resize(img_bgr, (target_w, target_h), interpolation=cv2.INTER_AREA)
    elif w < 1200 and w > 0:
        # Upscale ke lebar 1200 px menggunakan cv2.INTER_CUBIC
        skala = 1200.0 / w
        target_w = 1200
        target_h = int(h * skala)
        img_bgr = cv2.resize(img_bgr, (target_w, target_h), interpolation=cv2.INTER_CUBIC)

    # 3. Pra-pemrosesan Kontras & Binarisasi
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # Terapkan CLAHE untuk meratakan pencahayaan dan mengatasi bayangan ponsel/tangan
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray_clahe = clahe.apply(gray)

    # Adaptive Threshold (Gaussian C) untuk ketahanan terhadap bayangan lokal
    biner_adaptive = cv2.adaptiveThreshold(
        gray_clahe, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 10
    )

    # Otsu Threshold (binarisasi kontras global)
    _, biner_otsu = cv2.threshold(gray_clahe, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # 4. Pembacaan Teks dengan PSM 11 dan PSM 3 sebagai fallback
    # Variasi kombinasi citra dan konfigurasi OCR untuk akurasi optimal
    variasi_ocr = [
        ("biner_otsu", biner_otsu, "--oem 3 --psm 11 -l ind+eng"),
        ("biner_otsu", biner_otsu, "--oem 3 --psm 3 -l ind+eng"),
        ("biner_adaptive", biner_adaptive, "--oem 3 --psm 11 -l ind+eng"),
        ("biner_adaptive", biner_adaptive, "--oem 3 --psm 3 -l ind+eng"),
        ("gray_clahe", gray_clahe, "--oem 3 --psm 11 -l ind+eng"),
        ("gray_clahe", gray_clahe, "--oem 3 --psm 3 -l ind+eng"),
    ]

    for label_citra, citra_input, konfig in variasi_ocr:
        try:
            teks = pytesseract.image_to_string(citra_input, config=konfig)
            hasil_isbn = cari_isbn_dari_teks(teks)
            if hasil_isbn:
                logger.info(
                    "ISBN berhasil dideteksi via %s (%s): %s",
                    label_citra,
                    konfig,
                    hasil_isbn,
                )
                return hasil_isbn
        except Exception as err:
            logger.debug("Percobaan OCR %s gagal: %s", label_citra, err)
            continue

    return None
