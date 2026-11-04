/**
 * Layanan Kamera Mobile React Native / Expo (expo-image-picker & expo-image-manipulator).
 * 
 * Implementasi acuan sesuai spesifikasi PRD Bab 7 dan penanganan kamera ponsel (iPhone / Android):
 * - mediaTypes: ImagePicker.MediaTypeOptions.Images
 * - allowsEditing: true (antarmuka pemotongan/crop area KDT/ISBN langsung di layar)
 * - quality: 0.7 (mengompresi citra dan otomatis mengonversi format ke JPEG standar, bukan HEIC)
 * - Pembatasan dimensi maksimum: lebar/tinggi maksimal 1600 px via ImageManipulator
 * - FormData dikirim dengan type: 'image/jpeg' dan ekstensi .jpg
 */

// Contoh import dalam proyek React Native / Expo:
// import * as ImagePicker from 'expo-image-picker';
// import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Mengambil foto via kamera HP, memotong area KDT, mengompresi ke JPEG <= 1600 px, dan mengunggah ke backend.
 * 
 * @param {string} apiBaseUrl - URL dasar backend FastAPI (contoh: 'http://192.168.1.10:8000')
 * @param {object} imagePickerModule - Instansi expo-image-picker
 * @param {object} imageManipulatorModule - Instansi expo-image-manipulator
 */
export async function takeKdtPhotoAndUpload(
  apiBaseUrl = 'http://localhost:8000',
  imagePickerModule = null,
  imageManipulatorModule = null
) {
  const ImagePicker = imagePickerModule || (typeof window !== 'undefined' ? window.ImagePicker : null);
  const ImageManipulator = imageManipulatorModule || (typeof window !== 'undefined' ? window.ImageManipulator : null);

  if (!ImagePicker) {
    throw new Error('Modul expo-image-picker tidak tersedia di lingkungan ini.');
  }

  // 1. Minta izin akses kamera perangkat
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Izin akses kamera ditolak. Harap berikan izin pada pengaturan perangkat.');
  }

  // 2. Luncurkan kamera dengan konfigurasi spesifik
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true, // Memungkinkan pengguna langsung crop area KDT/ISBN
    aspect: [4, 3],
    quality: 0.7, // Kompresi 0.7 dan otomatis konversi ke format JPEG (bukan HEIC)
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  let finalUri = asset.uri;

  // 3. Batasi dimensi maksimum citra sebelum diunggah (maksimal 1600 px)
  if (ImageManipulator && (asset.width > 1600 || asset.height > 1600)) {
    const resizeConstraint =
      asset.width >= asset.height
        ? { resize: { width: 1600 } }
        : { resize: { height: 1600 } };

    const manipResult = await ImageManipulator.manipulateAsync(
      asset.uri,
      [resizeConstraint],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    finalUri = manipResult.uri;
  }

  // 4. Susun FormData standar dengan type 'image/jpeg' dan nama file .jpg
  const formData = new FormData();
  formData.append('file', {
    uri: finalUri,
    type: 'image/jpeg',
    name: `kdt_capture_${Date.now()}.jpg`,
  });

  // 5. Kirim ke endpoint FastAPI
  const response = await fetch(`${apiBaseUrl}/api/ocr`, {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Gagal memproses gambar OCR.');
  }

  return data;
}

