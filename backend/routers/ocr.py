"""Router API untuk ekstraksi ISBN dari foto KDT/Barcode dan fetch metadata Google Books."""

import logging
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from model_ai.ocr_service import ekstrak_isbn_dari_gambar, validasi_isbn13
from schemas.ddc_schema import OCRResponse
from services.metadata_service import cari_metadata_google_books

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["OCR & Ekstraksi ISBN"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB (toleransi foto mentah sebelum kompresi)


@router.post(
    "/ocr",
    response_model=OCRResponse,
    summary="Ekstraksi ISBN dari Foto & Fetch Metadata",
    description=(
        "Menerima unggahan citra halaman KDT atau barcode buku (maks. 10 MB), "
        "mengekstrak nomor ISBN menggunakan OCR cerdas (EXIF transpose, dynamic rescaling, "
        "CLAHE, adaptive Gaussian C & Otsu binarization, PSM 11/3 fallback, dan normalisasi karakter tertukar), "
        "serta memvalidasi Modulo-10 checksum dan mengambil data bibliografi dari Google Books API. "
        "Seluruh komputasi berjalan murni di memori (Zero Persistence)."
    ),
)
async def process_ocr_image(
    file: UploadFile = File(..., description="Berkas citra KDT atau Barcode buku")
) -> OCRResponse:
    # 1. Validasi Ekstensi Berkas
    filename = file.filename or ""
    ext = "." + filename.split(".")[-1].lower() if "." in filename else ""
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Format berkas '{ext}' tidak didukung. Harap unggah format JPG, JPEG, PNG, atau WEBP.",
        )

    # 2. Baca isi buffer memori
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ukuran berkas melebihi batas 10 MB. Harap perkecil atau kompresi foto terlebih dahulu.",
        )

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Berkas gambar kosong.",
        )

    # 3. Jalankan OCR & Validasi Modulo-10 secara in-memory
    isbn = None
    try:
        isbn = ekstrak_isbn_dari_gambar(file_bytes=file_bytes)
    except Exception as e:
        logger.exception("Gagal memproses OCR pada gambar: %s", e)
        isbn = None
    finally:
        # Buang buffer memori segera (Zero Persistence)
        del file_bytes

    if not isbn or not validasi_isbn13(isbn):
        return OCRResponse(
            success=False,
            isbn=None,
            is_valid_checksum=False,
            metadata=None,
            pesan=(
                "Nomor ISBN tidak terdeteksi pada citra. "
                "Pastikan foto memuat area KDT/ISBN dengan pencahayaan cukup dan teks tidak buram, "
                "atau lengkapi Judul dan Pengarang secara manual."
            ),
        )

    # 4. Ambil Metadata dari Google Books API
    metadata = cari_metadata_google_books(isbn)

    if metadata and metadata.found:
        pesan = f"ISBN {isbn} terverifikasi dan metadata buku berhasil dimuat otomatis."
    else:
        pesan = (
            f"ISBN {isbn} terverifikasi, namun metadata belum ditemukan di basis data katalog. "
            "Silakan lengkapi Judul dan Pengarang secara manual."
        )

    return OCRResponse(
        success=True,
        isbn=isbn,
        is_valid_checksum=True,
        metadata=metadata,
        pesan=pesan,
    )
