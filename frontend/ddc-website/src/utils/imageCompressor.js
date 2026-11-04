/**
 * Utilitas pemrosesan dan kompresi citra sisi klien (Client-side Image Compressor).
 * 
 * Mengatasi kendala foto kamera ponsel resolusi tinggi (12-48 MP, HEIC) sebelum diunggah:
 * 1. Mengubah format apa pun (HEIC via canvas/JPEG/PNG) ke JPEG standar.
 * 2. Mengompresi citra dengan kualitas 0.7 (menghemat bandwidth dan mencegah galat 413).
 * 3. Membatasi dimensi maksimum ke 1600 px (rasio aspek terjaga).
 * 4. Menjamin FormData menerima berkas berkategori 'image/jpeg' dengan ekstensi .jpg.
 * 5. Mendukung pemotongan (cropping) interaktif area KDT/ISBN sebelum kompresi.
 */

/**
 * Mengompresi dan membatasi dimensi citra secara in-memory menggunakan HTML5 Canvas.
 * 
 * @param {File|Blob} file - Berkas citra masukan
 * @param {Object} options - Opsi konfigurasi
 * @param {number} options.maxDimension - Batas dimensi terpanjang (default: 1600 px)
 * @param {number} options.quality - Kualitas kompresi JPEG 0.0 - 1.0 (default: 0.7)
 * @param {Object|null} options.cropRect - Koordinat pemotongan { x, y, width, height } (opsional)
 * @returns {Promise<{ file: File, previewUrl: string, originalSize: number, compressedSize: number, width: number, height: number }>}
 */
export async function compressAndFormatImage(
  file,
  { maxDimension = 1600, quality = 0.7, cropRect = null } = {}
) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('Berkas foto tidak ditemukan.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca data berkas gambar.'));

    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Peramban tidak dapat memuat gambar. Gunakan format JPG, PNG, atau WEBP.'));

      img.onload = () => {
        try {
          // Tentukan koordinat area sumber (crop atau citra utuh)
          let sourceX = 0;
          let sourceY = 0;
          let sourceW = img.naturalWidth || img.width;
          let sourceH = img.naturalHeight || img.height;

          if (
            cropRect &&
            cropRect.width > 20 &&
            cropRect.height > 20 &&
            cropRect.x >= 0 &&
            cropRect.y >= 0
          ) {
            sourceX = Math.max(0, Math.min(cropRect.x, sourceW));
            sourceY = Math.max(0, Math.min(cropRect.y, sourceH));
            sourceW = Math.min(cropRect.width, (img.naturalWidth || img.width) - sourceX);
            sourceH = Math.min(cropRect.height, (img.naturalHeight || img.height) - sourceY);
          }

          // Hitung dimensi target dengan batas maksimal 1600 px
          let targetW = sourceW;
          let targetH = sourceH;

          if (targetW > maxDimension || targetH > maxDimension) {
            if (targetW >= targetH) {
              targetH = Math.round((targetH * maxDimension) / targetW);
              targetW = maxDimension;
            } else {
              targetW = Math.round((targetW * maxDimension) / targetH);
              targetH = maxDimension;
            }
          }

          // Buat Canvas untuk me-render dan mengekspor citra terkompresi
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d', { alpha: false });

          // Latar belakang putih bersih (mencegah artefak transparan pada PNG)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetW, targetH);

          // Render citra dengan sampling berkualitas tinggi
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceW,
            sourceH,
            0,
            0,
            targetW,
            targetH
          );

          // Ekspor ke format image/jpeg dengan kualitas yang diminta (0.7)
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return reject(new Error('Gagal menghasilkan buffer citra JPEG.'));
              }

              const namaDasar = (file.name || 'foto_kdt')
                .replace(/\.[^/.]+$/, '')
                .replace(/[^a-zA-Z0-9_-]/g, '_');
              const finalFileName = `${namaDasar}_optimized_${Date.now()}.jpg`;

              const processedFile = new File([blob], finalFileName, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              const previewUrl = URL.createObjectURL(blob);

              resolve({
                file: processedFile,
                previewUrl,
                originalSize: file.size,
                compressedSize: blob.size,
                width: targetW,
                height: targetH,
              });
            },
            'image/jpeg',
            quality
          );
        } catch (err) {
          reject(new Error(`Terjadi galat kompresi citra: ${err.message}`));
        }
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}

