# Visual Direction & Design System (DESIGN.md)
## Sistem Klasifikasi Notasi DDC Perpustakaan Bank Indonesia

---

## 1. Konteks Produk & Kepribadian Visual
- **Tujuan Aplikasi:** Alat utilitas institusional (*internal library utility*) untuk mempercepat penentuan notasi Dewey Decimal Classification (DDC) dari foto KDT/barcode atau entri manual.
- **Target Pengguna:** Pustakawan Bank Indonesia dan pengelola koleksi buku.
- **Karakter Desain:** Bersih, terpercaya, fungsional, dan tenang (*calm corporate-academic*). Mengadopsi ruang negatif yang lega (airy layout) seperti referensi awal, namun sepenuhnya berorientasi pada kecepatan entri data dan kejelasan notasi.
- **Prinsip Utama:** Setiap piksel memiliki fungsi katalogisasi. Nol ornamen kosmetik tanpa tujuan teknis.

---

## 2. Palet Warna (Color Palette)

### Brand & Aksen
- **Primary (BI Blue):** `#007DE4`
  - Hover: `#0066BE`
  - Active / Focus Ring: `#005096`
  - Surface Tint: `#F0F7FD` (latar container aktif / card terpilih)
- **Accent (BI Gold/Yellow):** `#FBD900`
  - Hover: `#E5C600`
  - Penggunaan: Khusus untuk badge peringkat 1 ("Prediksi Utama"), indikator highlight, atau callout penting. **Jangan gunakan untuk background blok besar atau teks panjang tanpa kontras tinggi.**

### Netral & Permukaan (Surface)
- **Background Utama Layar:** `#F3F6FB` (Soft slate-blue netral, terinspirasi dari gradient lembut referensi)
- **Card / Surface Putih:** `#FFFFFF`
- **Border Lembut:** `#E2E8F0` (`border-slate-200`)
- **Border Interaktif/Input:** `#CBD5E1` (`border-slate-300`)

### Tipografi & Kontras
- **Heading & Label Utama:** `#0F172A` (`text-slate-900`)
- **Body & Nilai Metadata:** `#334155` (`text-slate-700`)
- **Secondary / Helper Text:** `#64748B` (`text-slate-500`)
- **Aksen Teks di atas Kuning (#FBD900):** `#78350F` atau `#0F172A` (Wajib gelap agar memenuhi rasio kontras WCAG AAA)

### Semantic States
- **Success / ISBN Valid:** `#16A34A` (`bg-emerald-50`, `text-emerald-700`)
- **Error / Modulo Gagal:** `#DC2626` (`bg-rose-50`, `text-rose-700`)
- **Warning / Unverified:** `#D97706` (`bg-amber-50`, `text-amber-700`)

---

## 3. Tipografi & Skala Teks

- **Font Sans (Antarmuka):** `Inter`, `Plus Jakarta Sans`, atau System Font Stack.
- **Font Mono (Kode & Angka):** `JetBrains Mono` atau `Fira Code` (Wajib untuk angka ISBN, Notasi DDC, dan persentase probabilitas agar simetris vertikal).

### Skala Hierarki
- **Header Judul Modul:** `text-xl md:text-2xl font-semibold tracking-tight text-slate-900`
- **Sub-label / Keterangan Alur:** `text-sm font-normal text-slate-500`
- **Notasi DDC (Hero Result):** `font-mono text-2xl font-bold tracking-tight text-[#007DE4]`
- **Field Label (Form):** `text-xs font-semibold uppercase tracking-wider text-slate-600`
- **Input Text:** `text-sm font-normal text-slate-900`
- **Metadata Card Subtext:** `text-xs text-slate-500`

---

## 4. Spacing, Bentuk & Elevasi

- **Border Radius:**
  - Card & Area Upload: `rounded-xl` (12px)
  - Input Field & Tombol: `rounded-lg` (8px)
  - Status Badges / Pills: `rounded-md` (6px) atau `rounded-full` khusus tag peringkat
- **Borders over Shadows:**
  - Utamakan border 1px solid (`border-slate-200`) daripada drop shadow tebal.
  - Shadow hanya menggunakan `shadow-sm` tipis saat hover atau pada container utama kartu.
- **Layout Grid (Desktop & Tablet):**
  - Menggunakan layout 2 kolom seimbang:
    - **Kolom Kiri:** Area Input (Tab Upload Citra KDT / Barcode + Pratinjau Citra Buku Terbuka).
    - **Kolom Kanan:** Formulir Konfirmasi Teks Metadata (Judul, Pengarang, ISBN) & Panel Hasil Klasifikasi Top-5 DDC.

---

## 5. Pola Komponen Spesifik (PRD Components)

### A. Upload Zone (Jalur Visual)
- Area dropzone dengan garis putus-putus (`border-2 border-dashed border-slate-300 hover:border-[#007DE4]`).
- Ilustrasi buku terbuka terisolasi (tanpa background) sebagai placeholder visual sebelum file diunggah.
- Preview thumbnail instan dengan tombol ganti gambar ringkas.

### B. Form Konfirmasi Metadata
- Input field ringkas dengan label jelas di atas kolom.
- Background input `#FFFFFF` dengan ring fokus `focus:ring-2 focus:ring-[#007DE4] focus:border-transparent`.
- Tombol aksi utama:
  - Tombol **"Mulai Klasifikasi"**: Latar solid `#007DE4`, teks putih, font medium.
  - Tombol **"Reset"**: Ghost button / outline tipis neutral-slate.

### C. Kartu Hasil Top-5 Notasi DDC
- **Kandidat #1 (Prediksi Utama):**
  - Diberi penanda visual khusus: Border kiri 4px solid `#FBD900` atau badge kecil `Prediksi Utama` berlatar `#FBD900` dengan teks `#0F172A`.
  - Notasi DDC ditampilkan dalam font monospace berukuran besar.
  - Progress bar probabilitas keyakinan (confidence score) dengan warna `#007DE4`.
- **Kandidat #2 sampai #5:**
  - Tampilan list horizontal padat (*dense list*), border bawah tipis 1px, persentase desimal dan progress bar tipis bernuansa slate/blue muted.

---

## 6. Copywriting & Aturan Bahasa (Microcopy)

- Gunakan Bahasa Indonesia formal dan fungsional khas perpustakaan.
- **Larangan Jargon AI:**
  - Dilarang menulis: *"Rasakan Keajaiban Kecerdasan Buatan"*, *"Next-Gen DDC Classifier"*, *"Magic Prediction"*.
  - Gunakan: *"Sistem Klasifikasi DDC Otomatis"*, *"Unggah Foto Halaman KDT / Barcode"*, *"Konfirmasi Metadata Buku"*, *"Hasil Klasifikasi Notasi Desimal"*.
- **Tombol / CTA:**
  - *"Ekstrak ISBN"*, *"Mulai Klasifikasi"*, *"Bersihkan Formulir"*.

---

## 7. Anti-Slop Strict Checklist (Hard Rules)
1. **NO Sparkle / Star Icons (✨):** Jangan gunakan ikon bintang kilau di dekat tombol proses atau judul.
2. **NO Rainbow/Purple Gradients:** Latar belakang harus tetap bersih berbasis `#F3F6FB` atau putih, bukan gradien ungu/sian neon.
3. **NO Floating Arbitrary Badges:** Hindari badge mengambang yang tidak memiliki data riil (misal: "Akurasi 99.9%" atau "Super Fast").
4. **NO Heavy Backdrop Blurs:** Hindari efek glassmorphism berlebihan yang mengorbankan keterbacaan teks angka DDC.
5. **Mandatory Focus State:** Setiap input dan tombol harus memiliki outline keyboard yang jelas (`focus-visible:ring-2 focus:ring-[#007DE4]`).