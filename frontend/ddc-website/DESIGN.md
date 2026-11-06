# Visual Direction & Design System (DESIGN.md)
## Sistem Klasifikasi Notasi DDC Perpustakaan Bank Indonesia

---

## 1. Konteks Produk & Kepribadian Visual
- **Tujuan Aplikasi:** Alat utilitas institusional (*internal library utility*) untuk mempercepat penentuan notasi Dewey Decimal Classification (DDC) dari foto KDT/barcode atau entri manual.
- **Target Pengguna:** Pustakawan Bank Indonesia dan pengelola koleksi buku.
- **Karakter Desain:** Bersih, terpercaya, fungsional, dan tenang (*calm corporate-academic*). Mengadopsi ruang negatif yang lega (airy layout) seperti referensi awal, namun sepenuhnya berorientasi pada kecepatan entri data dan kejelasan notasi.
- **Prinsip Utama:** Setiap piksel memiliki fungsi katalogisasi. Nol ornamen kosmetik tanpa tujuan teknis.

---

## 2. Palet Warna (Color Palette) Berdasarkan `color_palette.jpg`

Sistem mengadopsi 4 kuadran warna resmi yang diekstraksi secara presisi dari `color_palette.jpg`:

### A. Kuadran 1 - Primary Base: Deep Sapphire (`#002072`)
- **Fungsi:** Identitas institusional Bank Indonesia, penekanan judul modul, header logo, border utama footer, dan kartu penjaminan integritas.
- **Varian:**
  - Dark Surface / Header: `#001755` & `#00143D`
  - Kontras: Teks putih (`#FFFFFF`) atau Slate terang di atas Deep Sapphire (rasio kontras WCAG AAA > 12:1).

### B. Kuadran 2 - Primary Action: Royal Blue Beam (`#1E88E5`)
- **Fungsi:** Aksi interaktif utama (tombol submit, active tabs, focus ring, link navigasi, ikon alur, progress bar keyakinan).
- **Varian:**
  - Hover: `#1976D2`
  - Active: `#1565C0`
  - Surface Tint: `#EBF3FC` (badge step nomor 01-03, indikator status pendeteksian OCR)
  - Focus Ring: `outline: 2px solid #1E88E5` (Aksesibilitas WCAG 2.1 AA)

### C. Kuadran 3 - Primary Accent: Golden Pulse (`#F9A825`)
- **Fungsi:** Penanda sorotan berenergi tinggi (tombol utama "Mulai Klasifikasi", badge peringkat 1 "Prediksi Utama", garis aksen judul hero, aksen badge modul, kotak bidik pemindai, tombol shutter kamera).
- **Varian:**
  - Hover: `#E69516`
  - Kontras Teks di atas Golden Pulse: `#002072` (Deep Sapphire pekat, rasio kontras WCAG AAA > 10:1).
  - Pemasangan: Selalu dipasangkan dengan kontras Deep Sapphire `#002072` atau border yang tegas agar warna emas terlihat menyala dan tidak mati di atas permukaan putih.

### D. Kuadran 4 - Secondary Base / Warm Accent: Luxe Ivory Mist (`#FFF8E1`)
- **Fungsi:** Latar lembut, badge DDC pada panduan bagan kelas, dan gradasi hangat pada latar Hero.
- **Karakter:** Memberikan nuansa buku dan perpustakaan klasik yang hangat (*warm library tone*) tanpa mengurangi ketajaman tipografi modern.

### E. Latar Belakang Foto Perpustakaan (`bg.jpeg`) & Penghubung Halus
- **Aset:** `frontend/ddc-website/src/assets/bg.jpeg` (foto otentik rak buku perpustakaan).
- **Gradasi Hangat Pelindung:** Multi-stop linear gradient berkarakter hangat (`linear-gradient(135deg, rgba(255, 252, 240, 0.88) 0%, rgba(240, 246, 255, 0.84) 45%, rgba(0, 32, 114, 0.12) 100%)`).
- **Penghubung Halus (Smooth Dissolve Transition):** Pada bagian bawah Hero, foto rak buku dileburkan secara bertahap menuju kanvas putih murni modul klasifikasi menggunakan multi-stop vertical dissolve (`linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.45) 35%, rgba(255, 255, 255, 0.85) 70%, rgba(255, 255, 255, 0.98) 90%, #ffffff 100%)`), mengeliminasi garis batas kaku (*border-b*) untuk aliran visual yang alami dan mulus.

---

## 3. Tipografi & Skala Teks

- **Font Sans (Antarmuka):** `Plus Jakarta Sans`, `Inter`, atau System Font Stack.
- **Font Mono (Kode & Angka):** `JetBrains Mono` atau font monospace tabular (Wajib untuk angka ISBN, Notasi DDC, dan persentase probabilitas agar simetris vertikal).

### Skala Hierarki
- **Header Judul Modul:** `text-3xl sm:text-4xl font-extrabold tracking-tight text-[#002072]`
- **Sub-label / Keterangan Alur:** `text-sm font-normal text-slate-600`
- **Angka Metrik Hero (Stat Cards Persegi Panjang):** `font-mono text-xl sm:text-2xl font-black tracking-tight text-[#002072]` (~50 ms, Top-5 DDC, Memori RAM berbentuk persegi panjang horizontal ramping)
- **Notasi DDC (Hero Result):** `font-mono text-5xl sm:text-6xl font-black tracking-tight text-[#1E88E5]`
- **Field Label (Form):** `text-xs font-bold uppercase tracking-wider text-slate-700`
- **Input Text:** `text-sm font-normal text-slate-900`
- **Metadata Card Subtext:** `text-xs text-slate-500`

---

## 4. Spacing, Bentuk & Elevasi

- **Border Radius:**
  - Card & Area Upload: `rounded-xl` (12px) atau `rounded-2xl` (16px) untuk kartu metrik
  - Input Field & Tombol: `rounded-xl` (12px)
  - Status Badges / Pills: `rounded-full` untuk kicker institusi dan modul
- **Borders over Shadows:**
  - Utamakan border 1px solid (`border-slate-200`) daripada drop shadow tebal.
  - Shadow hanya menggunakan `shadow-xs` hingga `shadow-md` tipis saat hover atau pada kartu utama.

---

## 5. Tata Letak & Animasi Halus (Smooth Motion System)

### A. Tata Letak Hero Terpusat (Centered Symmetrical Layout)
- Hero section didesain terpusat (`text-center`, `max-w-4xl mx-auto`) dengan proporsi megah dan simetris tanpa ilustrasi buku terpisah, sehingga fokus utama langsung tertuju pada identitas institusi Bank Indonesia dan tombol aksi katalogisasi.
- Garis aksen emas horizontal terletak tepat di tengah bawah tulisan "Klasifikasi DDC".

### B. Animasi Masuk Bertahap (Staggered Fade-in-up)
- Elemen Hero dimuat dengan efek transisi bertingkat (*staggered fadeInUp*):
  - Kicker badge: 0ms (`animate-fade-in`)
  - Judul H1: 100ms (`delay-100`)
  - Subjudul paragraf: 200ms (`delay-200`)
  - Tombol CTA: 300ms (`delay-300`)
  - Kartu metrik: 400ms (`delay-400`)

### C. Navigasi & Smooth Scrolling
- Seluruh tautan navigasi (`#beranda`, `#klasifikasi`, `#tentang`) menggunakan `scroll-behavior: smooth` dengan *offset scroll-padding-top: 5.5rem* agar sticky navbar tidak menutupi judul modul.
- Nav link memiliki garis indikator hover aktif warna emas (`#F9A825`) yang bertransformasi halus dari titik tengah (`origin-center`).
- Header dinamis: Menambahkan elevasi bayangan halus dan *backdrop-blur* saat layar digulirkan ke bawah (`window.scrollY > 20`).
- Kartu metrik memiliki efek melayang lembut saat kursor diarahkan (*hover:-translate-y-1 hover:shadow-md transition-all duration-300*).
- Menghormati preferensi pengguna: `@media (prefers-reduced-motion: reduce)` secara otomatis menonaktifkan seluruh animasi gerak.

---

## 5. Pola Komponen Spesifik (PRD Components)

### A. Upload Zone (Jalur Visual)
- Area dropzone dengan garis putus-putus (`border border-dashed border-slate-300 hover:border-[#1E88E5]`).
- Ilustrasi buku terbuka terisolasi (tanpa background) sebagai representasi katalog sebelum berkas diunggah.
- Preview thumbnail instan dengan tombol pangkas ulang (Crop) dan ganti foto.

### B. Form Konfirmasi Metadata
- Input field ringkas dengan label jelas di atas kolom.
- Background input `#FFFFFF` dengan ring fokus `focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent`.
- Tombol aksi utama:
  - Tombol **"Mulai Klasifikasi DDC"**: Latar solid `#1E88E5` (hover: `#1976D2`, active: `#1565C0`), teks putih, font semibold.
  - Tombol **"Reset Data"**: Ghost button / outline tipis neutral-slate.

### C. Kartu Hasil Top-5 Notasi DDC
- **Kandidat #1 (Prediksi Utama):**
  - Diberi penanda visual khusus: Border kiri 4px solid `#F9A825` dan badge `Prediksi Utama` berlatar `#F9A825` dengan teks `#020617`.
  - Notasi DDC ditampilkan dalam font monospace berukuran besar (`text-[#1E88E5]`).
  - Progress bar probabilitas keyakinan (confidence score) dengan warna `#1E88E5`.
- **Kandidat #2 sampai #5:**
  - Tampilan list horizontal padat (*dense list*), border bawah tipis 1px, persentase desimal dan progress bar dengan aksen `#1E88E5`.

---

## 6. Copywriting & Aturan Bahasa (Microcopy)

- Gunakan Bahasa Indonesia formal dan fungsional khas perpustakaan.
- **Larangan Jargon AI:**
  - Dilarang menulis: *"Rasakan Keajaiban Kecerdasan Buatan"*, *"Next-Gen DDC Classifier"*, *"Magic Prediction"*.
  - Gunakan: *"Sistem Otomasi Klasifikasi DDC"*, *"Pindai Foto Halaman KDT / Barcode"*, *"Konfirmasi Metadata Buku"*, *"Hasil Klasifikasi Notasi Desimal"*.
- **Tombol / CTA:**
  - *"Ekstrak ISBN"*, *"Mulai Klasifikasi DDC"*, *"Reset Data"*.

---

## 7. Anti-Slop Strict Checklist (Hard Rules)
1. **NO Sparkle / Star Icons (✨):** Jangan gunakan ikon bintang kilau di dekat tombol proses atau judul.
2. **NO Rainbow/Purple Gradients:** Latar belakang harus tetap bersih berbasis palet resmi (`#002072`, `#1E88E5`, `#F9A825`, `#FFF8E1`) dan gradasi tenang foto perpustakaan `bg.jpeg`.
3. **NO Floating Arbitrary Badges:** Hindari badge mengambang yang tidak memiliki data riil.
4. **NO Heavy Backdrop Blurs:** Hindari efek glassmorphism berlebihan yang mengorbankan keterbacaan teks angka DDC.
5. **Mandatory Focus State:** Setiap input dan tombol harus memiliki outline keyboard yang jelas (`focus-visible:outline-2 focus-visible:outline-[#1E88E5]`).