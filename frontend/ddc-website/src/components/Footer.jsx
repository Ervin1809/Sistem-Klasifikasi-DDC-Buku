import { BookOpen } from 'lucide-react';

export default function Footer({ onOpenDDCGuide }) {
  const scrollToSection = (e, targetId) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#00143d] text-slate-300 py-12 border-t border-[#002072] text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-blue-900/60">
          
          {/* Kolom 1: Profil Sistem */}
          <div className="md:col-span-6 flex flex-col items-start">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#002072] flex items-center justify-center text-white shadow-xs border border-blue-800/40">
                <BookOpen className="w-4 h-4 text-[#f9a825]" />
              </div>
              <span className="font-bold text-white text-base tracking-tight">
                Sistem Otomasi Klasifikasi DDC
              </span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-md">
              Aplikasi utilitas pengatalogan untuk asisten pustakawan di lingkungan perpustakaan Kantor Perwakilan Bank Indonesia, mempermudah dan menstandarisasi penentuan nomor klasifikasi DDC.
            </p>
          </div>

          {/* Kolom 2: Tautan Pintas dengan Smooth Scrolling */}
          <div className="md:col-span-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">Navigasi Utilitas</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a 
                  href="#beranda" 
                  onClick={(e) => scrollToSection(e, 'beranda')}
                  className="hover:text-white hover:underline transition-colors cursor-pointer"
                >
                  Beranda
                </a>
              </li>
              <li>
                <a 
                  href="#klasifikasi" 
                  onClick={(e) => scrollToSection(e, 'klasifikasi')}
                  className="hover:text-white hover:underline transition-colors cursor-pointer"
                >
                  Klasifikasi
                </a>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={onOpenDDCGuide} 
                  className="hover:text-white hover:underline transition-colors cursor-pointer text-left"
                >
                  Bagan 10 Kelas DDC
                </button>
              </li>
              <li>
                <a 
                  href="#tentang" 
                  onClick={(e) => scrollToSection(e, 'tentang')}
                  className="hover:text-white hover:underline transition-colors cursor-pointer"
                >
                  Arsitektur Sistem
                </a>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Spesifikasi Teknis */}
          <div className="md:col-span-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">Spesifikasi Teknis</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>• Level 1: IndoBERT Base P1 (116 Seksi)</li>
              <li>• Level 2: kNN TF-IDF Joint Beam Search</li>
              <li>• OCR Engine: Tesseract 5.5 + Modulo-10</li>
              <li>• Backend: FastAPI (Python 3.12)</li>
            </ul>
          </div>

        </div>

        {/* Baris Bawah Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Final Skripsi M. Ervin. Dikembangkan untuk Perpustakaan Bank Indonesia.</p>
          <div className="flex items-center gap-2">
            <span>Palet identitas:</span>
            <span className="inline-block w-3 h-3 rounded-xs bg-[#002072] border border-white/20" title="Deep Sapphire (#002072)" />
            <span className="inline-block w-3 h-3 rounded-xs bg-[#1e88e5] border border-white/20" title="Royal Blue Beam (#1e88e5)" />
            <span className="inline-block w-3 h-3 rounded-xs bg-[#f9a825] border border-white/20" title="Golden Pulse (#f9a825)" />
            <span className="inline-block w-3 h-3 rounded-xs bg-[#fff8e1] border border-white/20" title="Luxe Ivory Mist (#fff8e1)" />
          </div>
        </div>

      </div>
    </footer>
  );
}

