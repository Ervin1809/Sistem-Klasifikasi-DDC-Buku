import { BookOpen } from 'lucide-react';

export default function Navbar({ serverStatus, onOpenDDCGuide }) {
  const isHealthy = serverStatus?.status === 'healthy' && serverStatus?.model_ready;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Identitas Institusi & Logo */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#007de4] flex items-center justify-center text-white shadow-xs">
            <BookOpen className="w-5 h-5 text-[#fbd900]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">Katalog DDC</span>
            <span className="text-xs text-slate-500 font-normal -mt-0.5">Perpustakaan Bank Indonesia</span>
          </div>
        </div>

        {/* Menu Navigasi Bahasa Indonesia Fungsional */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <a href="#beranda" className="hover:text-[#007de4] transition-colors py-1">
            Beranda
          </a>
          <a href="#klasifikasi" className="hover:text-[#007de4] transition-colors py-1">
            Klasifikasi
          </a>
          <button 
            type="button"
            onClick={onOpenDDCGuide}
            className="hover:text-[#007de4] transition-colors py-1 cursor-pointer font-medium"
          >
            Bagan DDC
          </button>
          <a href="#tentang" className="hover:text-[#007de4] transition-colors py-1">
            Arsitektur Sistem
          </a>
        </nav>

        {/* Indikator Status Operasional Layanan */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border ${
            isHealthy 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-600' : 'bg-amber-600'}`} />
            <span className="hidden sm:inline">
              {isHealthy ? 'Layanan Inferensi Siap' : 'Menghubungkan Server...'}
            </span>
          </div>

          <a 
            href="#klasifikasi"
            className="px-4 py-2.5 rounded-lg bg-[#007de4] hover:bg-[#0066be] active:bg-[#005096] text-white text-xs font-semibold tracking-wide transition-colors shadow-xs"
          >
            Mulai Entri
          </a>
        </div>

      </div>
    </header>
  );
}

