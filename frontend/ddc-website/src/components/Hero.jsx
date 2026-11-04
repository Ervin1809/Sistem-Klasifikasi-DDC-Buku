import { Clock, BookOpenCheck, ShieldCheck } from 'lucide-react';
import openBookImg from '../assets/book-removebg-preview.png';

export default function Hero({ onStartClick, onGuideClick }) {
  return (
    <section id="beranda" className="relative hero-gradient-bg pt-12 pb-16 md:pt-16 md:pb-24 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Kolom Kiri: Informasi Sistem & Aksi Utama */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Kicker Institusi */}
            <span className="text-xs font-bold uppercase tracking-wider text-[#007de4] mb-3">
              Perpustakaan Kantor Perwakilan Bank Indonesia
            </span>

            {/* Judul Utama Fungsional (Bahasa Indonesia Sesuai DESIGN.md) */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-4">
              Sistem Otomasi <br className="hidden sm:inline" />
              Klasifikasi DDC
            </h1>

            {/* Sub-judul & Deskripsi Alur Kerja */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mb-8 font-normal">
              Asisten digital untuk membantu pustakawan menentukan nomor notasi <strong className="text-slate-800 font-semibold">Dewey Decimal Classification (DDC)</strong> secara cepat dan terstandarisasi melalui pemindaian nomor ISBN atau masukan judul buku.
            </p>

            {/* Tombol Aksi Fungsional (Border-radius berjenjang sesuai DESIGN.md) */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onStartClick}
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg bg-[#007de4] hover:bg-[#0066be] active:bg-[#005096] text-white font-semibold text-sm tracking-wide shadow-xs transition-colors cursor-pointer"
              >
                Mulai Klasifikasi
              </button>

              <button
                type="button"
                onClick={onGuideClick}
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold text-sm tracking-wide border border-slate-300 shadow-xs transition-colors cursor-pointer"
              >
                Bagan 10 Kelas DDC
              </button>
            </div>

            {/* Ringkasan Spesifikasi Kinerja Faktual */}
            <div className="grid grid-cols-3 gap-6 mt-10 pt-8 border-t border-slate-200 w-full max-w-lg">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-base">
                  <Clock className="w-4 h-4 text-[#007de4]" />
                  <span>~50 ms</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Inferensi CPU Cepat</p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-base">
                  <BookOpenCheck className="w-4 h-4 text-[#007de4]" />
                  <span>Top-5 DDC</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Hierarki IndoBERT + kNN</p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-base">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Memori RAM</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Zero DB Persistence</p>
              </div>
            </div>

          </div>

          {/* Kolom Kanan: Ilustrasi Bersih Buku Terbuka Tanpa Ornamen Mengambang */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="w-full max-w-md lg:max-w-none flex flex-col items-center p-4">
              <img
                src={openBookImg}
                alt="Ilustrasi Buku Terbuka Katalog DDC"
                className="w-full max-w-[460px] h-auto object-contain drop-shadow-md"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

