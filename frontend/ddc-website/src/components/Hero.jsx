import { Clock, BookOpenCheck, ShieldCheck } from 'lucide-react';
import bgHeroImg from '../assets/bg.jpeg';

export default function Hero({ onStartClick, onGuideClick }) {
  return (
    <section 
      id="beranda" 
      className="relative pt-14 pb-24 md:pt-20 md:pb-36 overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(255, 252, 240, 0.88) 0%, rgba(240, 246, 255, 0.84) 45%, rgba(0, 32, 114, 0.12) 100%), url(${bgHeroImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
        
        {/* Kicker Institusi Kontras Tinggi Rata Tengah */}
        <div className="animate-fade-in inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#002072] text-[#f9a825] border border-[#f9a825]/40 text-xs sm:text-sm font-bold mb-5 shadow-xs hover:border-[#f9a825] transition-colors">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f9a825] shadow-xs shadow-amber-400/50 animate-pulse" />
          <span className="tracking-wide">Perpustakaan Kantor Perwakilan Bank Indonesia</span>
        </div>

        {/* Judul Utama Rata Tengah dengan Garis Aksen Emas Sentral */}
        <h1 className="animate-fade-in-up delay-100 text-4xl sm:text-5xl md:text-6xl font-black text-[#002072] tracking-tight leading-[1.15] mb-6 text-center">
          Sistem Otomasi <br className="hidden sm:inline" />
          <span className="relative inline-block mt-1">
            <span className="text-[#002072]">Klasifikasi DDC</span>
            <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-48 h-1.5 bg-gradient-to-r from-transparent via-[#f9a825] to-transparent rounded-full shadow-xs" />
          </span>
        </h1>

        {/* Sub-judul & Deskripsi Alur Kerja Rata Tengah */}
        <p className="animate-fade-in-up delay-200 text-base sm:text-lg md:text-xl text-slate-800 leading-relaxed max-w-2xl mx-auto mb-9 font-normal text-center">
          Asisten digital untuk membantu pustakawan menentukan nomor notasi <strong className="text-[#002072] font-bold">Dewey Decimal Classification (DDC)</strong> secara cepat dan terstandarisasi melalui pemindaian nomor ISBN atau masukan judul buku.
        </p>

        {/* Tombol Aksi Fungsional Rata Tengah */}
        <div className="animate-fade-in-up delay-300 flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={onStartClick}
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-[#f9a825] hover:bg-[#e69516] active:bg-[#d4840f] text-[#002072] font-extrabold text-sm sm:text-base tracking-wide shadow-md shadow-amber-500/30 transition-all cursor-pointer hover:scale-[1.03] active:scale-[0.98] hover:shadow-lg hover:shadow-amber-500/40"
          >
            Mulai Klasifikasi
          </button>

          <button
            type="button"
            onClick={onGuideClick}
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/95 hover:bg-[#fff8e1] text-[#002072] hover:border-[#f9a825] font-bold text-sm sm:text-base tracking-wide border-2 border-slate-300 shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            Bagan 10 Kelas DDC
          </button>
        </div>

        {/* Ringkasan Spesifikasi Kinerja Faktual (Bentuk Persegi Panjang Proporsional) */}
        <div className="animate-fade-in-up delay-400 grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mt-11 pt-8 border-t border-slate-300/80 w-full max-w-4xl mx-auto">
          
          {/* Stat 1: Inferensi CPU (Persegi Panjang Horizontal) */}
          <div className="p-3.5 sm:px-5 sm:py-3.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#1e88e5]/60 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3.5 text-left group">
            <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <Clock className="w-5 h-5 text-[#1e88e5]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xl sm:text-2xl font-black text-[#002072] font-mono tracking-tight leading-none">
                ~50 ms
              </span>
              <span className="text-xs font-semibold text-slate-700 mt-1 truncate">
                Inferensi CPU Cepat
              </span>
            </div>
          </div>

          {/* Stat 2: Top-5 DDC (Persegi Panjang Horizontal) */}
          <div className="p-3.5 sm:px-5 sm:py-3.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#f9a825]/70 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3.5 text-left group">
            <div className="w-11 h-11 rounded-lg bg-amber-50 border border-amber-100/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <BookOpenCheck className="w-5 h-5 text-[#f9a825]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xl sm:text-2xl font-black text-[#002072] font-mono tracking-tight leading-none">
                Top-5 DDC
              </span>
              <span className="text-xs font-semibold text-slate-700 mt-1 truncate">
                IndoBERT + kNN TF-IDF
              </span>
            </div>
          </div>

          {/* Stat 3: Memori RAM (Persegi Panjang Horizontal) */}
          <div className="p-3.5 sm:px-5 sm:py-3.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-500/60 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3.5 text-left group">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-100/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xl sm:text-2xl font-black text-[#002072] tracking-tight leading-none">
                Memori RAM
              </span>
              <span className="text-xs font-semibold text-slate-700 mt-1 truncate">
                Zero DB Persistence
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Penghubung Halus dengan Bagian Bawahnya (Smooth Bottom Gradient Dissolve to Pure White) */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-28 sm:h-40 pointer-events-none select-none z-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.45) 35%, rgba(255, 255, 255, 0.85) 70%, rgba(255, 255, 255, 0.98) 90%, #ffffff 100%)'
        }}
      />
    </section>
  );
}

