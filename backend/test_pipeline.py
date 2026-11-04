"""Skrip pengujian otomatis (unit & integration test) untuk FastAPI DDC Pipeline."""

import time
from fastapi.testclient import TestClient
from main import app

def test_fastapi_pipeline():
    print("==================================================")
    print("MEMULAI PENGUJIAN OTOMATIS FASTAPI DDC PIPELINE...")
    print("==================================================")

    # Menggunakan context manager TestClient agar event lifespan berjalan
    with TestClient(app) as client:
        # 1. Uji Health Check
        print("\n[1] Pengujian Endpoint Health Check (GET /api/health)...")
        res_health = client.get("/api/health")
        assert res_health.status_code == 200, f"Health check failed: {res_health.text}"
        data_health = res_health.json()
        print("  Respon Health:", data_health)
        assert data_health["status"] == "healthy"
        assert data_health["model_ready"] is True
        assert data_health["classes_count"] == 116
        print("  [PASSED] Health check berhasil dan 116 kelas seksi siap.")

        # 2. Uji Daftar Seksi
        print("\n[2] Pengujian Endpoint Daftar Seksi (GET /api/seksi)...")
        res_seksi = client.get("/api/seksi")
        assert res_seksi.status_code == 200
        data_seksi = res_seksi.json()
        print(f"  Total seksi yang didaftarkan: {data_seksi['total_seksi']}")
        assert data_seksi["total_seksi"] == 116
        print("  [PASSED] Daftar seksi terverifikasi 116 kelas.")

        # 3. Uji Validasi Masukan (< 3 karakter harus ditolak 422)
        print("\n[3] Pengujian Validasi Masukan (Judul < 3 karakter)...")
        res_invalid = client.post("/api/classify", json={"judul": "ab", "pengarang": "Anonim"})
        assert res_invalid.status_code == 422, f"Harusnya 422 tapi dapat: {res_invalid.status_code}"
        print(f"  Pesan Validasi: {res_invalid.json().get('detail')}")
        print("  [PASSED] Validasi masukan berhasil mencegah eksekusi judul terlalu pendek.")

        # 4. Pengujian Kasus 1: Buku Akuntansi
        print("\n[4] Pengujian Inferensi Kasus 1: Buku Akuntansi...")
        payload_akuntansi = {
            "judul": "Pengantar Akuntansi",
            "pengarang": "Warren Reeve Fess",
            "top_k": 5
        }
        res_1 = client.post("/api/classify", json=payload_akuntansi)
        assert res_1.status_code == 200, f"Error: {res_1.text}"
        data_1 = res_1.json()
        print(f"  Judul: {data_1['judul']} | Pengarang: {data_1['pengarang']}")
        print(f"  Durasi Inferensi: {data_1['inference_time_ms']} ms")
        print(f"  Prediksi Utama: {data_1['prediksi_utama']['kode_ddc']} ({data_1['prediksi_utama']['label_seksi']}) - {data_1['prediksi_utama']['confidence_pct']}%")
        assert len(data_1["recommendations"]) == 5
        assert data_1["prediksi_utama"]["kode_ddc"] == "657"
        assert data_1["inference_time_ms"] < 1500.0, "Inferensi melebihi batas 1.5 detik!"
        print("  [PASSED] Kasus Akuntansi akurat diprediksi DDC 657.")

        # 5. Pengujian Kasus 2: Buku Agama Islam
        print("\n[5] Pengujian Inferensi Kasus 2: Fiqih Sunnah (Agama Islam)...")
        payload_islam = {
            "judul": "Fiqih Sunnah",
            "pengarang": "Sayyid Sabiq",
            "top_k": 5
        }
        res_2 = client.post("/api/classify", json=payload_islam)
        assert res_2.status_code == 200, f"Error: {res_2.text}"
        data_2 = res_2.json()
        print(f"  Prediksi Utama: {data_2['prediksi_utama']['kode_ddc']} ({data_2['prediksi_utama']['label_seksi']}) - {data_2['prediksi_utama']['confidence_pct']}%")
        assert data_2["prediksi_utama"]["seksi"] == "297"
        print("  [PASSED] Kasus Fiqih Sunnah akurat diprediksi Seksi 297.")

        # 6. Pengujian Kasus 3: Novel Sastra
        print("\n[6] Pengujian Inferensi Kasus 3: Novel Sastra Populer...")
        payload_novel = {
            "judul": "Laskar Pelangi",
            "pengarang": "Andrea Hirata",
            "top_k": 5
        }
        res_3 = client.post("/api/classify", json=payload_novel)
        assert res_3.status_code == 200, f"Error: {res_3.text}"
        data_3 = res_3.json()
        print(f"  Prediksi Utama: {data_3['prediksi_utama']['kode_ddc']} ({data_3['prediksi_utama']['label_seksi']}) - {data_3['prediksi_utama']['confidence_pct']}%")
        assert data_3["prediksi_utama"]["kode_ddc"] == "082.3"
        print("  [PASSED] Kasus Novel Laskar Pelangi akurat diprediksi DDC 082.3.")

        # 7. Pengujian OCR & Normalisasi Karakter
        print("\n[7] Pengujian Normalisasi Karakter & Validasi ISBN...")
        from model_ai.ocr_service import normalisasi_karakter_ocr, cari_isbn_dari_teks, validasi_isbn13
        contoh_terdistorsi = "Katalog Dalam Terbitan\nISBN: 978-6O2-O65228-3\nCetakan Pertama"
        isbn_terdeteksi = cari_isbn_dari_teks(contoh_terdistorsi)
        assert isbn_terdeteksi == "9786020652283", f"Gagal deteksi: {isbn_terdeteksi}"
        assert validasi_isbn13(isbn_terdeteksi) is True
        print(f"  Input Teks Terdistorsi ('O' -> '0'): {repr(contoh_terdistorsi)}")
        print(f"  Hasil Ekstraksi & Modulo-10: {isbn_terdeteksi} [VALID]")
        print("  [PASSED] Normalisasi huruf confusable OCR dan validasi Modulo-10 sukses.")

        # 8. Pengujian Endpoint OCR Berkas Riil (In-Memory)
        print("\n[8] Pengujian Endpoint OCR POST /api/ocr (buku_1.jpg)...")
        from pathlib import Path
        img_file = Path(__file__).resolve().parent.parent / "dataset_foto" / "buku_1.jpg"
        with open(img_file, "rb") as f_img:
            file_bytes = f_img.read()
        res_ocr = client.post(
            "/api/ocr",
            files={"file": ("buku_1.jpg", file_bytes, "image/jpeg")}
        )
        assert res_ocr.status_code == 200, f"OCR Failed: {res_ocr.text}"
        data_ocr = res_ocr.json()
        print("  Respon OCR:", data_ocr)
        assert data_ocr["success"] is True
        assert data_ocr["isbn"] == "9786020652283"
        assert data_ocr["is_valid_checksum"] is True
        print(f"  [PASSED] Ekstraksi ISBN endpoint OCR sukses ({data_ocr['isbn']}).")

        print("\n==================================================")
        print("SEMUA PENGUJIAN FASTAPI DDC PIPELINE BERHASIL 100%!")
        print("==================================================")

if __name__ == "__main__":
    test_fastapi_pipeline()

