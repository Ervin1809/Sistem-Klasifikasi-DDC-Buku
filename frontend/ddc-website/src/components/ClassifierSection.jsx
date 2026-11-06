import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  FileText,
  Camera,
  Smartphone,
  SwitchCamera,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  Loader2,
  Crop,
  Maximize2
} from 'lucide-react';
import { uploadOcrImage, classifyBook, fetchMetadataByIsbn } from '../services/api';
import { compressAndFormatImage } from '../utils/imageCompressor';

export default function ClassifierSection() {
  // Mode: 'visual' (Upload Foto) atau 'manual' (Ketik Langsung)
  const [activeTab, setActiveTab] = useState('visual');

  // State Unggahan Citra & Kompresi Sisi Klien
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [optimizationInfo, setOptimizationInfo] = useState(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState(null);

  // Status Siklus OCR Jalur 1: 'idle' | 'processing' | 'success' | 'failed'
  const [ocrStatus, setOcrStatus] = useState('idle');
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [forceShowManualForm, setForceShowManualForm] = useState(false);

  // State Pemotongan Interaktif Area KDT / Barcode (allowsEditing: true)
  const [rawFileToCrop, setRawFileToCrop] = useState(null);
  const [rawPreviewUrl, setRawPreviewUrl] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropOption, setCropOption] = useState('kdt'); // 'kdt' atau 'full'

  // State Kamera Langsung (Webcam / Live Viewfinder)
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' (belakang) atau 'user' (depan)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // State Form Konfirmasi Teks (Bisa diedit oleh pengguna)
  const [isbn, setIsbn] = useState('');
  const [judul, setJudul] = useState('');
  const [pengarang, setPengarang] = useState('');
  const [metadataExtra, setMetadataExtra] = useState(null);

  // State Klasifikasi DDC
  const [isClassifying, setIsClassifying] = useState(false);
  const [classifyError, setClassifyError] = useState(null);
  const [results, setResults] = useState(null);

  // State Salin Teks
  const [copiedCode, setCopiedCode] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const resultsRef = useRef(null);
  const cropImgRef = useRef(null);

  // Hentikan Stream Kamera Perangkat
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping camera track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Bersihkan stream kamera saat unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Inisialisasi Aliran Video Kamera
  const initCameraStream = async (facing = 'environment') => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Peramban Anda tidak mendukung akses kamera langsung (WebRTC). Silakan gunakan opsi Kamera HP Bawaan.');
      }

      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (err) {
          console.warn('Video playback warning:', err);
        }
      }

      if (navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      }
    } catch (err) {
      console.error('Camera stream error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Izin akses kamera belum diberikan. Izinkan peramban mengakses kamera atau gunakan opsi Kamera HP Bawaan.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Perangkat kamera tidak ditemukan.');
      } else {
        setCameraError(err.message || 'Gagal menyalakan kamera langsung.');
      }
    }
  };

  // Buka Modal Kamera Web
  const openLiveCamera = async () => {
    setIsCameraOpen(true);
    await initCameraStream(cameraFacing);
  };

  // Penanganan Cerdas Tombol Kamera (HP vs Desktop/Laptop)
  const handleSmartCameraClick = () => {
    const isMobile =
      typeof navigator !== 'undefined' &&
      (/Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 1 && window.innerWidth <= 1024));

    if (isMobile) {
      // Pada perangkat HP/Tablet: aktifkan kamera bawaan HP via capture="environment"
      cameraInputRef.current?.click();
    } else {
      // Pada laptop / komputer desktop: nyalakan jendela bidik webcam langsung
      openLiveCamera();
    }
  };

  // Tutup Modal Kamera Web
  const closeLiveCamera = () => {
    stopCamera();
    setIsCameraOpen(false);
    setCameraError(null);
  };

  // Ganti Kamera Depan / Belakang
  const handleSwitchCamera = async () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    await initCameraStream(nextFacing);
  };

  // Jepret Foto dari Video Canvas (Live Webcam)
  const captureLivePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `kdt_webcam_${Date.now()}.jpg`, { type: 'image/jpeg' });
        closeLiveCamera();
        handleFileChange(file);
      },
      'image/jpeg',
      0.85
    );
  };

  // 1. Penanganan Pemilihan Berkas Gambar (Kamera HP Langsung / Galeri)
  const handleFileChange = async (file) => {
    if (!file) return;

    // Validasi Ekstensi & Tipe Berkas (Mendukung JPG, JPEG, PNG, WEBP, dan HEIC kamera)
    const isImage = file.type?.startsWith('image/') || /\.(jpe?g|png|webp|heic)$/i.test(file.name);
    if (!isImage) {
      setOcrError('Format berkas tidak didukung. Harap gunakan foto berformat JPG, PNG, atau WEBP.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setOcrError('Ukuran berkas mentah melebihi batas 25 MB. Harap pilih foto lain.');
      return;
    }

    setOcrError(null);
    setClassifyError(null);
    setResults(null);

    // Siapkan pratinjau mentah untuk dialog pemotongan (allowsEditing: true)
    if (rawPreviewUrl) URL.revokeObjectURL(rawPreviewUrl);
    const rawUrl = URL.createObjectURL(file);
    setRawFileToCrop(file);
    setRawPreviewUrl(rawUrl);
    setCropOption('kdt');
    setIsCropModalOpen(true);
  };

  // Eksekusi Pemotongan Interaktif & Kompresi Sisi Klien (max 1600 px, quality 0.7, format JPEG)
  const handleConfirmCropAndUpload = async (customOption = null) => {
    if (!rawFileToCrop) return;
    const activeOption = customOption || cropOption;
    setIsCropModalOpen(false);
    setIsOcrLoading(true);
    setOcrError(null);

    try {
      // Hitung koordinat crop jika mode 'kdt' (fokus 80% lebar, 65% tinggi)
      let cropRect = null;
      if (activeOption === 'kdt' && cropImgRef.current) {
        const naturalW = cropImgRef.current.naturalWidth || 1600;
        const naturalH = cropImgRef.current.naturalHeight || 1200;
        const w = Math.round(naturalW * 0.85);
        const h = Math.round(naturalH * 0.65);
        const x = Math.round((naturalW - w) / 2);
        const y = Math.round((naturalH - h) / 2);
        cropRect = { x, y, width: w, height: h };
      }

      // Kompresi sisi klien: batasi max 1600 px, JPEG standar, quality 0.7
      const compressed = await compressAndFormatImage(rawFileToCrop, {
        maxDimension: 1600,
        quality: 0.7,
        cropRect,
      });

      setSelectedFile(compressed.file);
      setOptimizationInfo({
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        width: compressed.width,
        height: compressed.height,
      });

      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(compressed.previewUrl);

      // Otomatis kirim ke pipeline OCR backend FastAPI
      await runOcrPipeline(compressed.file);
    } catch (err) {
      setOcrError(err.message || 'Gagal memproses dan mengompresi gambar.');
      setIsOcrLoading(false);
    }
  };

  // 2. Eksekusi Pipeline OCR & Fetch Metadata
  const runOcrPipeline = async (file) => {
    setIsOcrLoading(true);
    setOcrStatus('processing');
    setOcrError(null);
    setLookupError(null);
    setForceShowManualForm(false);

    try {
      const res = await uploadOcrImage(file);

      if (res.success && res.isbn) {
        setIsbn(res.isbn);
        setOcrStatus('success');

        if (res.metadata && res.metadata.found) {
          setJudul(res.metadata.judul || '');
          setPengarang(res.metadata.pengarang || '');
          setMetadataExtra(res.metadata);
        } else {
          // ISBN valid tetapi metadata Google Books tidak ditemukan
          setMetadataExtra(null);
          setOcrError('Nomor ISBN berhasil dideteksi, namun metadata buku belum tercatat di Google Books. Silakan lengkapi Judul dan Pengarang secara manual.');
        }
      } else {
        setIsbn('');
        setMetadataExtra(null);
        setOcrStatus('failed');
        setOcrError(res.pesan || 'Nomor ISBN tidak terdeteksi dari foto.');
      }
    } catch (err) {
      setOcrStatus('failed');
      setOcrError(err.message || 'Gagal memproses gambar OCR.');
    } finally {
      setIsOcrLoading(false);
    }
  };

  // 3. Pencarian Metadata Manual via Tombol Cari ISBN
  const handleLookupIsbn = async (customIsbn = null) => {
    const targetIsbn = (customIsbn || isbn || '').trim();
    if (!targetIsbn) {
      setLookupError('Harap masukkan nomor ISBN terlebih dahulu.');
      return;
    }

    setIsLookupLoading(true);
    setLookupError(null);

    try {
      const meta = await fetchMetadataByIsbn(targetIsbn);
      if (meta && meta.found) {
        setIsbn(meta.isbn || targetIsbn);
        setJudul(meta.judul || judul);
        setPengarang(meta.pengarang || pengarang);
        setMetadataExtra(meta);
        setOcrStatus('success');
      } else {
        setIsbn(targetIsbn);
        setLookupError('Nomor ISBN ditemukan, namun data bibliografi belum tercatat di Google Books / Open Library. Silakan isi formulir secara manual.');
      }
    } catch (err) {
      setLookupError(err.message || 'Gagal mencari metadata buku dari nomor ISBN ini.');
    } finally {
      setIsLookupLoading(false);
    }
  };

  // 4. Eksekusi Klasifikasi DDC (Level 1 + Level 2)
  const handleSubmitClassification = async (e) => {
    e.preventDefault();

    if (judul.trim().length < 3) {
      setClassifyError('Judul buku wajib diisi minimal 3 karakter untuk melakukan klasifikasi.');
      return;
    }

    setIsClassifying(true);
    setClassifyError(null);

    try {
      const data = await classifyBook(judul, pengarang, 5);
      setResults(data);

      // Scroll halus ke kartu hasil
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setClassifyError(err.message || 'Terjadi kesalahan saat memproses klasifikasi.');
    } finally {
      setIsClassifying(false);
    }
  };

  // 5. Reset Formulir (Klasifikasi Buku Baru)
  const handleReset = () => {
    setSelectedFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (rawPreviewUrl) URL.revokeObjectURL(rawPreviewUrl);
    setRawPreviewUrl(null);
    setRawFileToCrop(null);
    setIsCropModalOpen(false);
    setOptimizationInfo(null);
    setIsbn('');
    setJudul('');
    setPengarang('');
    setMetadataExtra(null);
    setResults(null);
    setOcrError(null);
    setLookupError(null);
    setClassifyError(null);
    setOcrStatus('idle');
    setForceShowManualForm(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // 6. Salin Kode DDC ke Clipboard
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Penentu Visibilitas Formulir Penuh & Fallback ISBN
  const showFullForm =
    activeTab === 'manual' ||
    (activeTab === 'visual' && (
      ocrStatus === 'success' ||
      forceShowManualForm ||
      Boolean(judul.trim())
    ));

  const showIsbnFallback =
    activeTab === 'visual' &&
    ocrStatus === 'failed' &&
    !showFullForm;

  return (
    <section id="klasifikasi" className="py-16 md:py-20 bg-white relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#002072] text-[#f9a825] border border-[#f9a825]/40 text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#f9a825] shadow-xs shadow-amber-400/50" />
            <span>Modul Katalogisasi</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#002072] tracking-tight">
            Klasifikasi Koleksi Buku
          </h2>
          <p className="mt-2 text-slate-600 text-sm sm:text-base">
            Pindai halaman KDT atau nomor ISBN untuk pencarian bibliografi otomatis, atau masukkan judul dan pengarang secara manual.
          </p>
        </div>

        {/* Tab Pemilihan Alur Masukan */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-xl bg-slate-100 border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => { setActiveTab('visual'); setOcrError(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'visual'
                  ? 'bg-[#002072] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className={`w-4 h-4 ${activeTab === 'visual' ? 'text-[#f9a825]' : 'text-slate-500'}`} />
              <span>Jalur 1: Foto KDT / Barcode</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('manual'); setOcrError(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-[#002072] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className={`w-4 h-4 ${activeTab === 'manual' ? 'text-[#f9a825]' : 'text-slate-500'}`} />
              <span>Jalur 2: Input Manual</span>
            </button>
          </div>
        </div>

        {/* Area Kerja Utama (Card Container - DESIGN.md rounded-xl, border-slate-200) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          
          <div className="p-6 sm:p-8 lg:p-10">
            
            {/* Bagian Unggah Berkas Gambar (Hanya tampil di tab 'visual') */}
            {activeTab === 'visual' && (
              <div className="mb-10 pb-10 border-b border-slate-200">
                <label className="block text-sm font-bold text-slate-900 mb-1">
                  1. Unggah Foto Halaman KDT atau Barcode Buku
                </label>
                <p className="text-xs text-slate-500 mb-4">
                  Mendukung format JPG, PNG, WEBP (maks. 5 MB). Pastikan teks ISBN tajam dan terbaca jelas.
                </p>

                {!imagePreview ? (
                  <div className="space-y-4">
                    {/* Hidden Inputs untuk File Picker dan Kamera HP Langsung */}
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />

                    {/* 2 Pilihan Utama Input Foto (Kamera Cerdas & Galeri Berkas) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Opsi 1: Ambil Foto Kamera (Otomatis: Kamera Bawaan di HP, Webcam di Laptop/Desktop) */}
                      <button
                        type="button"
                        onClick={handleSmartCameraClick}
                        className="group flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-[#002072] to-[#001755] hover:to-[#002072] text-white shadow-md transition-all cursor-pointer text-center border border-blue-900/60"
                      >
                        <div className="w-12 h-12 rounded-xl bg-white/10 border border-[#f9a825]/40 flex items-center justify-center mb-3 text-white transition-transform group-hover:scale-105">
                          <Camera className="w-6 h-6 text-[#f9a825]" />
                        </div>
                        <span className="font-bold text-sm tracking-wide">
                          Ambil Foto Kamera
                        </span>
                        <span className="text-xs text-blue-100/85 mt-1 leading-snug max-w-xs">
                          Jepret foto KDT langsung dari kamera HP atau webcam laptop
                        </span>
                        <div className="mt-3 px-3 py-1 rounded-md bg-[#f9a825] text-[#002072] text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                          Kamera Perangkat
                        </div>
                      </button>

                      {/* Opsi 2: Pilih dari Galeri / Berkas */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="group flex flex-col items-center justify-center p-6 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#1e88e5] text-slate-800 transition-all cursor-pointer text-center shadow-xs"
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mb-3 transition-transform group-hover:scale-105">
                          <Upload className="w-6 h-6 text-slate-700" />
                        </div>
                        <span className="font-bold text-sm text-slate-900 tracking-wide">
                          Pilih dari Galeri / Berkas
                        </span>
                        <span className="text-xs text-slate-500 mt-1 leading-snug max-w-xs">
                          Pilih berkas foto dari galeri atau penyimpanan perangkat
                        </span>
                        <div className="mt-3 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold uppercase tracking-wider border border-slate-200">
                          Penyimpanan Berkas
                        </div>
                      </button>

                    </div>

                    {/* Area Drag & Drop Cadangan untuk Desktop */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-slate-300 hover:border-[#1e88e5] bg-slate-50/60 rounded-lg p-3 text-center transition-colors cursor-pointer group"
                    >
                      <p className="text-xs text-slate-500 group-hover:text-slate-700">
                        Atau seret & lepas berkas foto ke sini (JPG, PNG, WEBP maks. 5 MB)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-full md:w-60 h-40 bg-slate-200 rounded-xl overflow-hidden flex items-center justify-center relative shadow-inner">
                      <img
                        src={imagePreview}
                        alt="Pratinjau KDT Buku"
                        className="w-full h-full object-contain"
                      />
                      {isOcrLoading && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-3 text-center">
                          <Loader2 className="w-6 h-6 animate-spin text-[#f9a825] mb-2" />
                          <span className="text-xs font-semibold">Mengekstrak ISBN & Metadata...</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 w-full text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Berkas Citra Terpilih
                        </span>
                        <div className="flex items-center gap-3">
                          {rawFileToCrop && (
                            <button
                              type="button"
                              onClick={() => setIsCropModalOpen(true)}
                              className="text-xs font-semibold text-[#1e88e5] hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <Crop className="w-3.5 h-3.5" />
                              <span>Pangkas Ulang</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleReset}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                          >
                            Ganti Foto
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {selectedFile?.name} ({(selectedFile?.size / 1024).toFixed(1)} KB)
                      </p>

                      {/* Indikator Optimalisasi Citra Sisi Klien */}
                      {optimizationInfo && (
                        <div className="mt-2 inline-flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-medium">
                          <span>Dimensi: {optimizationInfo.width}×{optimizationInfo.height} px</span>
                          <span className="text-slate-300">•</span>
                          <span>Format JPEG (0.7)</span>
                          {optimizationInfo.originalSize > optimizationInfo.compressedSize && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="font-semibold text-emerald-700">
                                Hemat {Math.round((1 - optimizationInfo.compressedSize / optimizationInfo.originalSize) * 100)}%
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Status Deteksi OCR */}
                      <div className="mt-3.5 flex flex-wrap items-center gap-2">
                        {isOcrLoading ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#ebf3fc] text-[#1e88e5] text-xs font-medium">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Mendeteksi nomor ISBN dari foto buku...</span>
                          </div>
                        ) : isbn ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>ISBN Terdeteksi: {isbn} (Modulo-10 Valid)</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                {/* Catatan Panduan Awal (Saat belum ada foto yang diunggah) */}
                {!selectedFile && ocrStatus === 'idle' && (
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#1e88e5] shrink-0" />
                    <span>
                      Pilih atau jepret foto halaman KDT / barcode buku. Formulir konfirmasi data buku akan dimunculkan secara otomatis setelah hasil ekstraksi siap.
                    </span>
                  </div>
                )}

                {/* Fallback Input ISBN Manual Jika OCR Gagal Mendeteksi ISBN */}
                {showIsbnFallback && (
                  <div className="mt-6 p-5 sm:p-6 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Nomor ISBN Tidak Terdeteksi dari Foto
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Sistem tidak menemukan nomor ISBN yang terbaca jelas pada foto. Silakan ketik nomor ISBN buku di bawah ini untuk mencari judul dan pengarang secara otomatis dari basis data katalog.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <div className="relative flex-1">
                        <input
                          id="manual-isbn-input"
                          type="text"
                          value={isbn}
                          onChange={(e) => {
                            setIsbn(e.target.value);
                            if (lookupError) setLookupError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleLookupIsbn();
                            }
                          }}
                          placeholder="Ketik 10 atau 13 digit ISBN (Contoh: 9786020652283)"
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1e88e5] focus:border-transparent text-sm bg-white font-mono"
                          autoFocus
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleLookupIsbn()}
                        disabled={isLookupLoading || !isbn.trim()}
                        className="px-6 py-3 rounded-xl bg-[#1e88e5] hover:bg-[#1976d2] active:bg-[#1565c0] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        {isLookupLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#f9a825]" />
                            <span>Mencari Katalog...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4" />
                            <span>Cari Data Buku</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Pesan Galat jika Lookup ISBN Gagal */}
                    {lookupError && (
                      <div className="mt-3.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{lookupError}</p>
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => setForceShowManualForm(true)}
                              className="font-bold text-[#1e88e5] hover:underline cursor-pointer"
                            >
                              Lengkapi Judul & Pengarang secara manual &rarr;
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pintasan Jika Buku Tidak Memiliki ISBN */}
                    <div className="mt-4 pt-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                      <span>Buku Anda tidak mencantumkan nomor ISBN?</span>
                      <button
                        type="button"
                        onClick={() => setForceShowManualForm(true)}
                        className="font-semibold text-[#1e88e5] hover:underline cursor-pointer"
                      >
                        Lewati ke Pengisian Judul Manual &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bagian Formulir Konfirmasi & Penyuntingan Teks (Ditampilkan setelah ada hasil atau mode manual) */}
            {showFullForm && (
              <form onSubmit={handleSubmitClassification}>
                
                {/* Banner Peringatan jika ISBN Terdeteksi tapi Metadata Tidak Ada */}
                {activeTab === 'visual' && ocrError && (
                  <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{ocrError}</span>
                  </div>
                )}

                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {activeTab === 'visual' ? '2. Konfirmasi & Verifikasi Data Masukan' : '1. Masukkan Informasi Buku'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeTab === 'visual'
                        ? 'Tinjau atau perbaiki data yang berhasil dimuat sebelum inferensi DDC.'
                        : 'Masukkan judul dan pengarang buku untuk inferensi klasifikasi DDC.'}
                    </p>
                  </div>

                  {metadataExtra?.cover_url && (
                    <div className="hidden sm:flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-slate-50 border border-slate-200">
                      <img
                        src={metadataExtra.cover_url}
                        alt="Cover Buku"
                        className="w-8 h-11 object-cover rounded shadow-xs"
                      />
                      <div className="text-left text-[11px]">
                        <div className="font-bold text-slate-900 truncate max-w-[120px]">{metadataExtra.penerbit || 'Buku Terdaftar'}</div>
                        <div className="text-slate-500">{metadataExtra.tahun || 'Google Books'}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  
                  {/* Field ISBN */}
                  <div className="md:col-span-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="isbn" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Nomor ISBN {activeTab === 'manual' ? '(Opsional)' : ''}
                      </label>
                      {isbn && (
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Terverifikasi
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="isbn"
                        type="text"
                        value={isbn}
                        onChange={(e) => setIsbn(e.target.value)}
                        placeholder="Contoh: 9786020652283"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1e88e5] focus:border-transparent text-sm bg-white font-mono"
                      />
                      {isbn.length >= 10 && (
                        <button
                          type="button"
                          onClick={() => handleLookupIsbn()}
                          disabled={isLookupLoading}
                          title="Cari ulang metadata berdasarkan ISBN ini"
                          className="absolute right-2 top-2 p-1.5 rounded-lg bg-slate-100 hover:bg-[#ebf3fc] text-slate-600 hover:text-[#1e88e5] transition-colors cursor-pointer"
                        >
                          {isLookupLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[#1e88e5]" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Nomor ISBN-10 atau ISBN-13 standar.
                    </p>
                  </div>

                  {/* Field Judul Buku (Wajib diisi, min 3 karakter, Modern Web Guidance compliant) */}
                  <div className="md:col-span-8">
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="judul" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Judul Buku <span className="text-rose-500">*</span>
                      </label>
                      <span id="judul-hint" className="text-[11px] text-slate-500">
                        Wajib diisi (Minimal 3 karakter)
                      </span>
                    </div>
                    <input
                      id="judul"
                      type="text"
                      required
                      minLength={3}
                      value={judul}
                      onChange={(e) => setJudul(e.target.value)}
                      placeholder="Contoh: Pengantar Akuntansi Dasar Keuangan"
                      aria-describedby="judul-hint"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1e88e5] focus:border-transparent text-sm bg-white"
                    />
                    <div className="field-error hidden text-rose-600 text-xs mt-1 items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Judul buku wajib diisi minimal 3 karakter.</span>
                    </div>
                  </div>

                  {/* Field Pengarang */}
                  <div className="md:col-span-12">
                    <label htmlFor="pengarang" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Nama Pengarang / Penulis (Opsional)
                    </label>
                    <input
                      id="pengarang"
                      type="text"
                      value={pengarang}
                      onChange={(e) => setPengarang(e.target.value)}
                      placeholder="Contoh: Warren Reeve Fess"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1e88e5] focus:border-transparent text-sm bg-white"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Nama pengarang membantu model membedakan konteks keilmuan secara lebih spesifik.
                    </p>
                  </div>

                </div>

                {/* Error Banner jika Klasifikasi Gagal */}
                {classifyError && (
                  <div className="mt-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                    <span>{classifyError}</span>
                  </div>
                )}

                {/* Tombol Eksekusi Submit */}
                <div className="mt-8 flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-slate-200">
                  {(judul || imagePreview || isbn) && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-5 py-3 rounded-lg text-slate-700 hover:text-slate-900 font-semibold text-xs tracking-wide border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Data</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isClassifying || judul.trim().length < 3}
                    className="px-8 py-3.5 rounded-xl bg-[#f9a825] hover:bg-[#e69516] active:bg-[#d4840f] disabled:bg-slate-300 disabled:cursor-not-allowed text-[#002072] disabled:text-slate-500 font-extrabold text-xs sm:text-sm tracking-wide shadow-md shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {isClassifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#002072]" />
                        <span>Sedang Mengklasifikasikan...</span>
                      </>
                    ) : (
                      <span>Mulai Klasifikasi DDC</span>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>

        </div>

        {/* ======================================================== */}
        {/* TAMPILAN HASIL REKOMENDASI TOP-5 DDC (Sesuai PRD & DESIGN) */}
        {/* ======================================================== */}
        {results && (
          <div ref={resultsRef} className="mt-12 transition-all duration-300">
            
            <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-10 shadow-md border border-slate-800 relative overflow-hidden">
              
              {/* Header Hasil */}
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Klasifikasi Selesai</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {results.judul}
                  </h3>
                  {results.pengarang && (
                    <p className="text-slate-400 text-sm mt-1">
                      Penulis: <span className="text-slate-200 font-semibold">{results.pengarang}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400 font-medium">Durasi Inferensi CPU</div>
                    <div className="text-base font-black text-emerald-400 font-mono">
                      {results.inference_time_ms} ms
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Klasifikasi buku lain"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Konten Hasil: Grid Prediksi Utama & Top-5 */}
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
                
                {/* Kolom Kiri: Kartu Prediksi Utama (Rank 1 Highlight Sesuai DESIGN.md) */}
                <div className="lg:col-span-5 flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Rekomendasi Notasi Utama
                  </span>

                  {results.prediksi_utama && (
                    <div className="flex-1 rounded-xl bg-slate-800/80 p-6 sm:p-8 border-l-4 border-l-[#f9a825] border-t border-r border-b border-slate-700/80 shadow-md flex flex-col justify-between relative group">
                      
                      {/* Badge Prediksi Utama Emas */}
                      <div className="flex items-center justify-between mb-6">
                        <span className="px-2.5 py-1 rounded-md bg-[#f9a825] text-slate-950 font-bold text-xs uppercase tracking-wider shadow-xs">
                          Prediksi Utama
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopyCode(results.prediksi_utama.kode_ddc)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
                        >
                          {copiedCode === results.prediksi_utama.kode_ddc ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Nomor Notasi DDC Utama Besar */}
                      <div className="my-auto py-4">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                          Notasi DDC Desimal
                        </div>
                        <div className="text-5xl sm:text-6xl font-black text-[#1e88e5] font-mono tracking-tight group-hover:text-white transition-colors">
                          {results.prediksi_utama.kode_ddc}
                        </div>
                        <div className="mt-3 text-lg font-bold text-slate-200">
                          {results.prediksi_utama.label_seksi}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Seksi Induk: <strong className="text-slate-300">Kelas {results.prediksi_utama.seksi}</strong>
                        </div>
                      </div>

                      {/* Skor Keyakinan Prediksi Utama */}
                      <div className="mt-6 pt-4 border-t border-slate-700/80">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="text-slate-400 font-medium">Skor Keyakinan Relatif</span>
                          <span className="font-bold text-[#f9a825] text-sm font-mono">
                            {results.prediksi_utama.confidence_pct}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-700/80 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1e88e5] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, results.prediksi_utama.confidence_pct)}%` }}
                          />
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Kolom Kanan: Daftar Peringkat Top-5 Notasi Desimal (Dense List Format) */}
                <div className="lg:col-span-7 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Top-5 Kandidat Notasi DDC Bertingkat
                    </span>
                    <span className="text-xs text-slate-500">
                      Beam Search Joint Scoring
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                    {results.recommendations.map((item) => {
                      const isTop = item.is_top;
                      return (
                        <div
                          key={item.kode_ddc}
                          className={`p-3.5 rounded-lg border transition-colors ${
                            isTop
                              ? 'bg-slate-800 border-l-4 border-l-[#f9a825] border-slate-700'
                              : 'bg-slate-800/50 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                                isTop ? 'bg-[#f9a825] text-slate-950' : 'bg-slate-700 text-slate-300'
                              }`}>
                                {item.rank}
                              </span>
                              <div>
                                <span className="font-mono font-bold text-base text-white mr-2">
                                  {item.kode_ddc}
                                </span>
                                <span className="text-xs text-slate-300">
                                  {item.label_seksi}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-200">
                                {item.confidence_pct}%
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(item.kode_ddc)}
                                title="Salin kode ini"
                                className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                              >
                                {copiedCode === item.kode_ddc ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Progress bar keyakinan solid */}
                          <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isTop ? 'bg-[#f9a825]' : 'bg-[#1e88e5]'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(3, item.confidence_pct))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tombol Klasifikasi Buku Baru */}
                  <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-5 py-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-950 font-semibold text-xs tracking-wide transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Klasifikasikan Buku Baru</span>
                    </button>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* Modal Pemotongan Citra KDT/Barcode (allowsEditing: true) */}
      {isCropModalOpen && rawFileToCrop && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            
            {/* Header Modal */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#1e88e5]/10 text-[#1e88e5] flex items-center justify-center">
                  <Crop className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Potong & Sesuaikan Area KDT
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Otomatis konversi ke JPEG standar & batasan maks. 1600 px
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCropModalOpen(false);
                  setRawFileToCrop(null);
                }}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                title="Batal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Area Pratinjau Citra Mentah */}
            <div className="relative flex-1 bg-slate-950 flex items-center justify-center p-3 sm:p-4 overflow-hidden min-h-[240px] max-h-[50vh]">
              <img
                ref={cropImgRef}
                src={rawPreviewUrl}
                alt="Area Pangkas KDT"
                className="max-h-full max-w-full object-contain select-none"
              />

              {/* Kotak Bidik Area KDT jika mode 'kdt' aktif */}
              {cropOption === 'kdt' && (
                <div className="absolute inset-x-8 sm:inset-x-12 inset-y-8 sm:inset-y-12 pointer-events-none border-2 border-[#f9a825] bg-[#f9a825]/10 rounded-lg flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <span className="w-3 h-3 border-t-2 border-l-2 border-[#f9a825]" />
                    <span className="w-3 h-3 border-t-2 border-r-2 border-[#f9a825]" />
                  </div>
                  <div className="text-center bg-slate-900/80 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white mx-auto shadow-sm">
                    Fokus Area ISBN / KDT
                  </div>
                  <div className="flex justify-between">
                    <span className="w-3 h-3 border-b-2 border-l-2 border-[#f9a825]" />
                    <span className="w-3 h-3 border-b-2 border-r-2 border-[#f9a825]" />
                  </div>
                </div>
              )}
            </div>

            {/* Kontrol Mode Pilihan */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCropOption('kdt')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    cropOption === 'kdt'
                      ? 'bg-[#1e88e5] text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span>Pangkas Area KDT</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCropOption('full')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    cropOption === 'full'
                      ? 'bg-[#1e88e5] text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Gunakan Foto Utuh</span>
                </button>
              </div>

              {/* Tombol Eksekusi */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsCropModalOpen(false);
                    setRawFileToCrop(null);
                  }}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmCropAndUpload(cropOption)}
                  className="px-4 py-2 rounded-lg bg-[#1e88e5] hover:bg-[#1976d2] active:bg-[#1565c0] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Ekstrak OCR ({cropOption === 'kdt' ? 'Hasil Pangkas' : 'Foto Utuh'})</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal Jendela Bidik Kamera Langsung (Webcam / WebRTC) */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-xl flex flex-col">
            
            {/* Header Modal Kamera */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1e88e5]/20 text-[#1e88e5] flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">Kamera Pengenal KDT / ISBN</h3>
                  <p className="text-[11px] text-slate-400">Jepret foto buku langsung di browser</p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeLiveCamera}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup Kamera"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Area Tampilan Video / Viewfinder */}
            <div className="relative w-full aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
              {cameraError ? (
                <div className="p-6 text-center max-w-sm">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-300 mb-4 leading-relaxed">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      closeLiveCamera();
                      cameraInputRef.current?.click();
                    }}
                    className="px-5 py-2.5 rounded-lg bg-[#1e88e5] hover:bg-[#1976d2] active:bg-[#1565c0] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer inline-flex items-center gap-2"
                  >
                    <Smartphone className="w-4 h-4 text-[#f9a825]" />
                    <span>Gunakan Kamera Bawaan HP</span>
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Kotak Bidik Pemindai (Targeting Box) */}
                  <div className="absolute inset-8 pointer-events-none border-2 border-dashed border-[#f9a825]/70 rounded-2xl flex flex-col justify-between p-3">
                    <div className="flex justify-between items-start">
                      <span className="w-4 h-4 border-t-2 border-l-2 border-[#f9a825]" />
                      <span className="w-4 h-4 border-t-2 border-r-2 border-[#f9a825]" />
                    </div>
                    <div className="text-center bg-slate-950/70 backdrop-blur-xs py-1 px-3 rounded-full mx-auto text-[11px] font-medium text-white/95">
                      Posisikan ISBN atau halaman KDT di dalam kotak
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="w-4 h-4 border-b-2 border-l-2 border-[#f9a825]" />
                      <span className="w-4 h-4 border-b-2 border-r-2 border-[#f9a825]" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Kontrol Bawah: Beralih Kamera & Shutter Jepret */}
            {!cameraError && (
              <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                
                {/* Tombol Cadangan Kamera HP */}
                <button
                  type="button"
                  onClick={() => {
                    closeLiveCamera();
                    cameraInputRef.current?.click();
                  }}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Gunakan Aplikasi Kamera Bawaan HP"
                >
                  <Smartphone className="w-4 h-4 text-[#f9a825]" />
                  <span className="hidden sm:inline">Kamera HP</span>
                </button>

                {/* Tombol Shutter Utama (Jepret) */}
                <button
                  type="button"
                  onClick={captureLivePhoto}
                  className="w-16 h-16 rounded-full border-4 border-white/80 p-1 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#1e88e5]/30 cursor-pointer group"
                  title="Ambil Foto Sekarang"
                >
                  <div className="w-full h-full rounded-full bg-[#f9a825] group-hover:bg-[#e69516] flex items-center justify-center text-slate-950">
                    <Camera className="w-6 h-6" />
                  </div>
                </button>

                {/* Tombol Ganti Kamera Depan / Belakang */}
                {hasMultipleCameras ? (
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Ganti Kamera Depan / Belakang"
                  >
                    <SwitchCamera className="w-4 h-4 text-[#1e88e5]" />
                    <span className="hidden sm:inline">Putar</span>
                  </button>
                ) : (
                  <div className="w-16" />
                )}

              </div>
            )}

          </div>
        </div>
      )}
    </section>
  );
}

