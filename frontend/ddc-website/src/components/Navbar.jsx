import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';

export default function Navbar({ serverStatus, onOpenDDCGuide }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const isHealthy = serverStatus?.status === 'healthy' && serverStatus?.model_ready;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e, targetId) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200' 
        : 'bg-white/85 backdrop-blur-sm border-b border-slate-200/60'
    }`}>
      {/* Garis Aksen Tri-Warna Resmi Bank Indonesia di Ujung Atas */}
      <div className="h-1 w-full bg-gradient-to-r from-[#002072] via-[#1e88e5] to-[#f9a825]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Identitas Institusi & Logo dengan Animasi Halus saat Klik */}
        <a 
          href="#beranda" 
          onClick={(e) => scrollToSection(e, 'beranda')}
          className="flex items-center gap-3.5 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[#002072] border border-[#f9a825]/40 flex items-center justify-center text-white shadow-xs group-hover:scale-105 group-hover:border-[#f9a825] transition-all duration-200">
            <BookOpen className="w-5 h-5 text-[#f9a825]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[#002072] text-base sm:text-lg tracking-tight group-hover:text-[#1e88e5] transition-colors">
              Katalog DDC
            </span>
            <span className="text-xs text-slate-500 font-normal -mt-0.5">
              Perpustakaan Bank Indonesia
            </span>
          </div>
        </a>

        {/* Menu Navigasi dengan Smooth Scroll & Indikator Hover Interaktif */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <a 
            href="#beranda" 
            onClick={(e) => scrollToSection(e, 'beranda')}
            className="group relative py-1 text-slate-700 hover:text-[#002072] font-semibold transition-colors"
          >
            <span>Beranda</span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f9a825] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center" />
          </a>

          <a 
            href="#klasifikasi" 
            onClick={(e) => scrollToSection(e, 'klasifikasi')}
            className="group relative py-1 text-slate-700 hover:text-[#002072] font-semibold transition-colors"
          >
            <span>Klasifikasi</span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f9a825] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center" />
          </a>

          <button 
            type="button"
            onClick={onOpenDDCGuide}
            className="group relative py-1 text-slate-700 hover:text-[#002072] font-semibold transition-colors cursor-pointer"
          >
            <span>Bagan DDC</span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f9a825] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center" />
          </button>

          <a 
            href="#tentang" 
            onClick={(e) => scrollToSection(e, 'tentang')}
            className="group relative py-1 text-slate-700 hover:text-[#002072] font-semibold transition-colors"
          >
            <span>Arsitektur Sistem</span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f9a825] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center" />
          </a>
        </nav>

        {/* Indikator Status Operasional Layanan & Tombol Entri Emas */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border ${
            isHealthy 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`} />
            <span className="hidden sm:inline">
              {isHealthy ? 'Layanan Inferensi Siap' : 'Menghubungkan Server...'}
            </span>
          </div>

          <a 
            href="#klasifikasi"
            onClick={(e) => scrollToSection(e, 'klasifikasi')}
            className="px-4 py-2.5 rounded-lg bg-[#f9a825] hover:bg-[#e69516] active:bg-[#d4840f] text-[#002072] text-xs font-extrabold tracking-wide transition-all shadow-xs hover:shadow-amber-500/30 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            Mulai Entri
          </a>
        </div>

      </div>
    </header>
  );
}

