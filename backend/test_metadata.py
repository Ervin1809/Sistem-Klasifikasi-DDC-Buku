"""Pengujian endpoint dan layanan Google Books API / Metadata Service."""

from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app
from schemas.ddc_schema import MetadataBook

def test_metadata_service():
    print("==================================================")
    print("PENGUJIAN INTEGRASI GOOGLE BOOKS & METADATA API...")
    print("==================================================")

    client = TestClient(app)

    # 1. Uji Validasi Format ISBN Pendek
    print("\n[1] Uji Validasi ISBN Panjang Tidak Sesuai (ISBN < 10 digit)...")
    res_short = client.get("/api/metadata/12345")
    assert res_short.status_code == 400
    print("  Respon:", res_short.json().get("detail"))
    print("  [PASSED] ISBN tidak valid berhasil ditolak dengan HTTP 400.")

    # 2. Uji Validasi Checksum Modulo-10 Tidak Valid
    print("\n[2] Uji Validasi Modulo-10 Checksum Salah...")
    # 9789793062791 digit terakhir salah (aslinya 2)
    res_checksum = client.get("/api/metadata/9789793062791")
    assert res_checksum.status_code == 400
    print("  Respon:", res_checksum.json().get("detail"))
    print("  [PASSED] Checksum salah berhasil ditolak dengan HTTP 400.")

    # 3. Uji Pengambilan Metadata Sukses (Mocked Response)
    print("\n[3] Uji Pengambilan Metadata Berhasil (Mock Google Books API)...")
    mock_meta = MetadataBook(
        isbn="9789793062792",
        judul="Kota Yang Bernama dan Tak Bernama",
        pengarang="Ahmadun Yosi Herfanda",
        penerbit="Bentang Budaya",
        tahun="2003",
        deskripsi="Kumpulan cerpen pilihan.",
        cover_url="https://covers.openlibrary.org/b/id/4250542-M.jpg",
        found=True,
        source="google_books"
    )

    with patch("routers.metadata.cari_metadata_google_books", return_value=mock_meta):
        res_success = client.get("/api/metadata/9789793062792")
        assert res_success.status_code == 200
        data = res_success.json()
        print(f"  Judul: {data['judul']}")
        print(f"  Pengarang: {data['pengarang']}")
        print(f"  Penerbit: {data['penerbit']} ({data['tahun']})")
        print(f"  Cover URL: {data['cover_url']}")
        print(f"  Sumber: {data['source']}")
        assert data["isbn"] == "9789793062792"
        assert data["found"] is True
        print("  [PASSED] Endpoint mengembalikan objek metadata buku secara lengkap.")

    # 4. Uji Kasus Buku Tidak Ditemukan (404)
    print("\n[4] Uji Kasus Buku Tidak Ditemukan di Basis Data...")
    with patch("routers.metadata.cari_metadata_google_books", return_value=None):
        # ISBN dengan checksum valid tapi tidak tercatat
        # 9786020000008 adalah valid ISBN-13
        res_not_found = client.get("/api/metadata/9786020000008")
        assert res_not_found.status_code == 404
        print("  Respon:", res_not_found.json().get("detail"))
        print("  [PASSED] Buku tidak ditemukan mengembalikan HTTP 404 dengan pesan informatif.")

    # 5. Uji Integrasi Endpoint OCR dengan Metadata Service
    print("\n[5] Uji Alur OCR -> Google Books Metadata...")
    # Simulasi OCR mengembalikan ISBN 9789793062792
    with patch("routers.ocr.ekstrak_isbn_dari_gambar", return_value="9789793062792"), \
         patch("routers.ocr.cari_metadata_google_books", return_value=mock_meta):
        
        # Kirim dummy image file
        files = {"file": ("kdt_test.jpg", b"\xFF\xD8\xFF\xE0" + b"\x00" * 100, "image/jpeg")}
        res_ocr = client.post("/api/ocr", files=files)
        assert res_ocr.status_code == 200
        ocr_data = res_ocr.json()
        print("  Status OCR:", ocr_data["success"])
        print("  ISBN Terdeteksi:", ocr_data["isbn"])
        print("  Metadata Terkait:", ocr_data["metadata"]["judul"])
        assert ocr_data["success"] is True
        assert ocr_data["metadata"]["judul"] == "Kota Yang Bernama dan Tak Bernama"
        print("  [PASSED] Alur OCR berhasil menyambung ke metadata Google Books.")

    print("\n==================================================")
    print("SEMUA PENGUJIAN METADATA GOOGLE BOOKS SELESAI 100%!")
    print("==================================================")

if __name__ == "__main__":
    test_metadata_service()

