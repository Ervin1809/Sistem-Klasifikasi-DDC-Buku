/**
 * Layanan komunikasi API backend FastAPI untuk sistem klasifikasi DDC.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Memeriksa status kesehatan server backend dan kesiapan model AI.
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { method: 'GET' });
    if (!res.ok) return { status: 'error', model_ready: false };
    return await res.json();
  } catch (error) {
    return { status: 'offline', model_ready: false, error: error.message };
  }
}

/**
 * Mengunggah berkas citra KDT/Barcode ke endpoint OCR.
 * Mengembalikan hasil ekstraksi ISBN dan metadata Google Books jika ada.
 * 
 * @param {File|Blob} file - Berkas gambar yang telah dikompresi (maksimal 1600 px, JPEG)
 */
export async function uploadOcrImage(file) {
  const formData = new FormData();
  
  // Pastikan nama berkas selalu berakhiran .jpg dan terdeteksi sebagai image/jpeg
  const rawName = file.name || 'foto_kdt.jpg';
  const cleanName = rawName.toLowerCase().endsWith('.jpg')
    ? rawName
    : `${rawName.replace(/\.[^/.]+$/, '')}.jpg`;

  formData.append('file', file, cleanName);

  const res = await fetch(`${API_BASE}/api/ocr`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Gagal memproses gambar OCR.');
  }
  return data;
}

/**
 * Mengirim judul dan pengarang buku untuk diklasifikasikan ke DDC.
 * 
 * @param {string} judul - Judul buku (minimal 3 karakter)
 * @param {string} pengarang - Nama pengarang
 * @param {number} topK - Jumlah rekomendasi teratas (default 5)
 */
export async function classifyBook(judul, pengarang = '', topK = 5) {
  const res = await fetch(`${API_BASE}/api/classify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      judul: judul.trim(),
      pengarang: pengarang.trim(),
      top_k: topK,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    let errMsg = 'Gagal melakukan klasifikasi.';
    if (data.detail) {
      if (typeof data.detail === 'string') {
        errMsg = data.detail;
      } else if (Array.isArray(data.detail) && data.detail[0]?.msg) {
        errMsg = data.detail[0].msg;
      }
    }
    throw new Error(errMsg);
  }
  return data;
}

/**
 * Mengambil metadata buku berdasarkan ISBN secara langsung.
 * 
 * @param {string} isbn - Nomor ISBN (10 atau 13 digit)
 */
export async function fetchMetadataByIsbn(isbn) {
  const cleanIsbn = isbn.replace(/\D/g, '');
  const res = await fetch(`${API_BASE}/api/metadata/${cleanIsbn}`, {
    method: 'GET',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Metadata buku tidak ditemukan.');
  }
  return data;
}

/**
 * Mengambil daftar seluruh 116 seksi DDC terdaftar.
 */
export async function fetchSeksiList() {
  const res = await fetch(`${API_BASE}/api/seksi`, {
    method: 'GET',
  });
  if (!res.ok) return { total_seksi: 0, data: [] };
  return await res.json();
}

