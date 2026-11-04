# Product Requirement Document (PRD)

## Sistem Otomasi Klasifikasi Dewey Decimal Classification (DDC) Berbasis AI

---

## 1. Problem Statement & Tujuan (Goals)

### Problem Statement

* Proses pengatalogan dan penentuan notasi Dewey Decimal Classification (DDC) di perpustakaan konvensional masih mengandalkan pencarian manual di buku bagan klasifikasi fisik atau basis data e-DDC, yang membutuhkan waktu lama dan keahlian spesifik kepustakawanan.
* Transkripsi nomor identitas buku (ISBN) secara manual dari fisik buku rentan terhadap kesalahan ketik (*human error*).
* Perpustakaan kecil, taman bacaan masyarakat, dan pengelola koleksi mandiri sering kali tidak memiliki tenaga pustakawan profesional untuk melakukan penataan koleksi secara standar.

### Tujuan (Goals)

* Menyediakan alat bantu utilitas berbasis web (*public utility tool*) yang dapat diakses secara instan untuk mengotomasi penentuan notasi DDC dari hitungan menit menjadi hitungan detik.
* Mengintegrasikan proses pengenalan visual nomor ISBN dari foto halaman Katalog Dalam Terbitan (KDT) atau *barcode* buku menggunakan Tesseract OCR dan validasi Modulo-10 checksum.
* Menjembatani nomor ISBN ke teks bibliografi (Judul dan Pengarang) secara otomatis melalui Google Books API.
* Memberikan rekomendasi Top-5 notasi DDC bertingkat hingga notasi desimal penuh menggunakan model hierarkis IndoBERT (Level 1) dan kNN TF-IDF *Joint Scoring Beam Search* (Level 2).
* Menyediakan antarmuka konfirmasi dan penyuntingan data teks sebelum inferensi AI dijalankan untuk menjamin validitas masukan model.

---

## 2. Target Pengguna (Target Users)

| Persona Pengguna | Profil & Kebutuhan |
| --- | --- |
| **Pustakawan BI** | Pustakawan di perpustakaan di kantor perwakilan bank indonesia yang membutuhkan asisten otomatis untuk mempercepat proses entri katalog buku baru dalam jumlah harian. |

---

## 3. Alur Utama (User Stories & User Flow)

### User Stories

* **Sebagai pengguna**, saya ingin mengunggah foto halaman KDT atau *barcode* buku agar nomor ISBN diekstraksi secara otomatis tanpa perlu saya ketik.
* **Sebagai pengguna**, saya ingin memeriksa dan menyunting kembali Judul, Pengarang, atau ISBN yang berhasil dideteksi sistem agar data masukan yang diolah model AI benar-benar akurat.
* **Sebagai pengguna**, saya ingin memiliki opsi untuk langsung mengetik Judul dan Pengarang secara manual apabila buku saya tidak memiliki ISBN atau foto buku mengalami kerusakan fisik.
* **Sebagai pengguna**, saya ingin melihat daftar Top-5 rekomendasi notasi DDC beserta persentase skor keyakinan (*confidence score*) secara *real-time* di layar.

### User Flowchart (Alur Kerja Pengguna)

```
[Buka Website]
      │
      ├───────────────────────────────────────────────┐
      ▼ (Jalur 1: Input Visual)                       ▼ (Jalur 2: Input Manual)
[Unggah Foto KDT / Barcode]                    [Pilih Mode Input Manual]
      │                                               │
      ▼                                               │
[OCR & Validasi Modulo-10 ISBN]                       │
      │                                               │
      ▼                                               │
[Fetch Metadata Google Books API]                     │
      │                                               │
      └──────────────────────┬────────────────────────┘
                             ▼
              [Layar Konfirmasi & Edit Teks]
         (Pengguna meninjau/mengedit Judul & Penulis)
                             │
                             ▼ (Klik "Klasifikasikan")
             [FastAPI: Inferensi Hierarkis]
               - Level 1: IndoBERT Top-5 Seksi
               - Level 2: kNN TF-IDF Beam Search
                             │
                             ▼
              [Tampilan Hasil Rekomendasi]
         (Menampilkan Top-5 Notasi DDC Desimal)

```

### Rincian Langkah Interaksi

1. **Halaman Beranda:** Pengguna membuka aplikasi web dan disajikan pilihan area kerja: mengunggah foto atau memasukkan data teks langsung.
2. **Tahap Ekstraksi (Jalur Unggah):**
* Pengguna mengunggah foto halaman KDT atau *barcode*.
* Sistem menjalankan prapemrosesan citra, OCR, pemfilteran regex, dan verifikasi checksum ISBN-13.
* Jika valid, sistem menembak Google Books API dan mengisi form metadata secara otomatis.


3. **Tahap Konfirmasi / Penyesuaian:** Form menampilkan kolom *ISBN*, *Judul Buku*, dan *Pengarang*. Pengguna dapat memeriksa kembali teks tersebut, memperbaiki kata kunci yang salah deteksi, atau mengisi judul dan pengarang secara mandiri jika menggunakan jalur manual.
4. **Tahap Klasifikasi:** Pengguna menekan tombol **"Mulai Klasifikasi"**. Data dikirim ke *backend* AI.
5. **Tahap Penyajian Hasil:** Sistem menampilkan kartu informasi buku beserta daftar peringkat 5 notasi DDC desimal terbaik yang dilengkapi nilai probabilitas keyakinan gabungan.

---

## 4. Fitur Fungsional & Non-Fungsional

### Fitur Fungsional (Do's)

* **Area Unggah Citra Fleksibel:** Mendukung pemilihan berkas (*file picker*) dan *drag-and-drop* dengan pratinjau (*image preview*) instan.
* **Ekstraksi ISBN Otomatis:** Membaca teks visual dari citra dan memvalidasi keabsahan struktur ISBN-13 menggunakan formula Modulo-10.
* **Pengambilan Metadata API:** Mengambil data judul, pengarang, dan penerbit buku secara otomatis dari Google Books API berbasis ISBN hasil OCR.
* **Formulir Konfirmasi Interaktif:** Menyediakan kolom input yang dapat disunting bebas (*editable*) untuk Judul dan Pengarang sebelum dieksekusi oleh model AI.
* **Mode Bypass Input Manual:** Memungkinkan pengguna langsung memasukkan data teks judul dan pengarang tanpa harus mengunggah citra buku.
* **Klasifikasi Bertingkat End-to-End:**
* Menghitung probabilitas Level 1 seksi 3-digit menggunakan model IndoBERT `checkpoint-3444`.
* Menghitung kemiripan kosinus representasi TF-IDF dan mengeksekusi *Joint Scoring Beam Search* Level 2 untuk menentukan notasi desimal.


* **Visualisasi Top-5 Notasi DDC:** Menampilkan 5 kandidat notasi DDC berurutan dengan label notasi, indikator "Prediksi Utama", dan *progress bar* persentase kepercayaan.
* **Tombol Reset Instan:** Mengembalikan antarmuka ke kondisi awal untuk melakukan klasifikasi buku baru.

### Batasan Sistem (Don'ts)

* **Tidak Ada Autentikasi:** Sistem tidak menyediakan fitur *Login*, *Register*, verifikasi email, maupun pengelolaan akun.
* **Tidak Ada Penyimpanan Basis Data (Zero Database Persistence):** Tidak menyimpan gambar yang diunggah, data bibliografi, maupun hasil klasifikasi ke dalam basis data permanen. Seluruh komputasi berjalan di memori (*in-memory/real-time*).
* **Tidak Ada Fitur Ekspor Dokumen:** Tidak menyediakan fungsi unduh hasil ke format PDF, Excel, CSV, atau pembuatan stiker cetak label punggung buku.
* **Tidak Ada Pemrosesan Massal (No Batch Upload):** Sistem hanya melayani klasifikasi satu per satu buku per sesi unggah.

### Fitur Non-Fungsional

* **Performa & Kecepatan:**
* Waktu inferensi model AI (IndoBERT + kNN TF-IDF) $\le$ 1,5 detik pada lingkungan komputasi CPU modern.
* Total siklus alur kerja dari gambar hingga hasil klasifikasi $\le$ 5 detik (bergantung pada kecepatan respons Google Books API dan koneksi internet).


* **Efisiensi Memori Server:** Model IndoBERT dimuat ke dalam RAM satu kali pada saat server FastAPI dinyalakan (*lifecycle startup*) untuk mencegah *re-loading latency* berulang.
* **Responsivitas Tampilan:** Desain antarmuka adaptif untuk layar Desktop, Tablet, maupun *Smartphone*.
* **Keamanan Data & Privasi:** Berkas citra buku yang diunggah pengguna hanya ditampung dalam *buffer* memori sementara untuk diproses OCR dan langsung dibuang dari memori setelah teks diekstrak.

---

## 5. Aturan Main & Validasi (Rules & Validations)

### Hak Akses (User Roles)

* **Single Role (Public User):** Seluruh pengguna memiliki tingkat akses yang setara sebagai pengguna umum (*guest/public utility*) tanpa pembatasan hak akses halaman.

### Aturan Validasi Masukan

| Parameter | Aturan Validasi | Respon Sistem Jika Gagal |
| --- | --- | --- |
| **Berkas Citra** | • Format yang diizinkan: `.jpg`, `.jpeg`, `.png`, `.webp`<br> • Ukuran berkas maksimal: **5 MB** | Menolak unggahan dan memunculkan pesan error: *"Format berkas tidak didukung atau ukuran melebihi 5 MB."* |
| **Deteksi ISBN (OCR)** | • Pola Regex: `97[89][- ]?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9]` <br>• Uji Modulo-10: $S = \sum (d_i \times w_i) \pmod{10} \equiv 0$ | Menampilkan peringatan: *"ISBN tidak terdeteksi atau tidak valid. Silakan masukkan Judul dan Pengarang secara manual."* dan mengarahkan fokus ke form manual. |
| **Kueri Metadata** | • ISBN ditemukan di basis data Google Books | Jika metadata tidak ditemukan di Google Books, sistem mengosongkan form dan meminta pengguna mengetik Judul secara manual. |
| **Form Konfirmasi Teks** | • `Judul Buku`: **Wajib diisi**, minimal 3 karakter. <br>• `Pengarang`: Wajib diisi. | Mencegah tombol submit ditekan dan memberikan pesan validasi: *"Judul buku wajib diisi minimal 3 karakter untuk melakukan klasifikasi."* |
| **Batas Panjang Teks (Model)** | • Teks masukan (`Judul + Pengarang`) diproses maksimal 64 token WordPiece. | Teks yang melebihi batas dipotong (*truncated*) secara otomatis di *backend* tanpa memutus proses inferensi. |

---

## 6. Tech Stack & Arsitektur Sistem

Sistem menggunakan arsitektur *Decoupled Split-Stack* yang memisahkan lapisan penyajian antarmuka dan komputasi inferensi model:

```
┌────────────────────────────────────────────────────────┐
│             FRONTEND & API GATEWAY (React Native)      │
│  - Antarmuka Pengguna (Tailwind CSS, TypeScript)       │
│  - Route Handler (/api/classify) sebagai Reverse Proxy │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP Multipart/JSON (Internal)
                            ▼
┌────────────────────────────────────────────────────────┐
│             BACKEND INFERENCE (FastAPI Python)         │
│  - OCR Service: OpenCV & Tesseract OCR Engine          │
│  - Metadata Service: Google Books API Client           │
│  - DDC Service:                                        │
│      * Level 1: IndoBERT Base P1 (checkpoint-3444)     │
│      * Level 2: kNN TF-IDF + Joint Scoring Beam Search │
└────────────────────────────────────────────────────────┘

```

### Rincian Teknologi

**Frontend Mobile (React Native):**
* **Framework:** React Native (disarankan menggunakan **Expo SDK** untuk kemudahan akses API kamera dan kompilasi lintas platform).
* **Bahasa:** TypeScript.
* **Manajemen Antarmuka:** React Native core components (`View`, `Text`, `TextInput`, `TouchableOpacity`, `ScrollView`, `FlatList`).
* **Styling:** NativeWind (Tailwind CSS untuk React Native) atau `StyleSheet` bawaan.
* **Modul Kamera & Gambar:** `expo-image-picker` atau `expo-camera`.
* **Klien Jaringan:** `Axios` atau `fetch` bawaan.
* **Ikon Visual:** `@expo/vector-icons` (Lucide Icons / Feather).


**Backend AI (FastAPI Python) — Tetap Sama:**
* **Framework:** FastAPI + Uvicorn.
* **Modul OCR:** OpenCV & Tesseract OCR engine (`tesseract-ocr-ind`).
* **Modul Metadata:** Requests ke endpoint Google Books API.
* **Modul Inferensi AI:**
* Level 1: IndoBERT `checkpoint-3444` (PyTorch & Hugging Face).
* Level 2: `tfidf_vectorizer.joblib` + `model_level2_svm_bundle_pk.joblib` (Scikit-learn).


**Artefak Model yang Diintegrasikan:**
1. `backend/model_ai/checkpoint-3444/`: Model klasifikasi urutan IndoBERT (116 kelas seksi PK) beserta `config.json`.
2. `backend/model_ai/tfidf_vectorizer.joblib`: Objek pembobot representasi kata kunci berbasis $n$-gram (1, 2).
3. `backend/model_ai/model_level2_svm_bundle_pk.joblib`: Bundel data latih representasi teks seksi untuk algoritma kNN TF-IDF dan bobot prioritas frekuensi.

---

## 7. Rencana Struktur Folder Aplikasi Mobile (React Native)

```text
mobile-ddc/
├── App.tsx                   # Titik masuk utama aplikasi
├── app.json                  # Konfigurasi Expo & permissions kamera
├── package.json
├── src/
│   ├── api/
│   │   └── ddcApi.ts         # Fungsi Axios (uploadFoto, fetchKlasifikasi)
│   ├── components/
│   │   ├── CameraPicker.tsx  # Komponen tombol kamera & galeri
│   │   ├── MetadataForm.tsx  # Form konfirmasi/edit judul & pengarang
│   │   └── ResultCard.tsx    # Komponen visualisasi kartu Top-5 DDC
│   ├── screens/
│   │   └── HomeScreen.tsx    # Layar utama (pengendali alur tahapan)
│   └── types/
│       └── index.ts          # Definisi interface TypeScript data buku & DDC
└── assets/
    └── icon.png

```