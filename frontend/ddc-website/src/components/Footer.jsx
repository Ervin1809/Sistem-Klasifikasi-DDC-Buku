import { BookOpen } from 'lucide-react';

export default function Footer({ onOpenDDCGuide }) {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-800/80">
          
          {/* Kolom 1: Profil Sistem */}
          <div className="md:col-span-6 flex flex-col items-start">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#007de4] flex items-center justify-center text-white shadow-xs">
                <BookOpen className="w-4 h-4 text-[#fbd900]" />
              </div>
              <span className="font-bold text-white text-base tracking-tight">
                Sistem Otomasi Klasifikasi DDC
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md">
              Aplikasi utilitas pengatalogan untuk asisten pustakawan di lingkungan perpustakaan Kantor Perwakilan Bank Indonesia, mempermudah dan menstandarisasi penentuan nomor klasifikasi DDC.
            </p>
          </div>

          {/* Kolom 2: Tautan Pintas */}
          <div className="md:col-span-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">Navigasi Utilitas</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#beranda" className="hover:text-white transition-colors">Beranda</a>
              </li>
              <li>
                <a href="#klasifikasi" className="hover:text-white transition-colors">Klasifikasi</a>
              </li>
              <li>
                <button type="button" onClick={onOpenDDCGuide} className="hover:text-white transition-colors cursor-pointer text-left">
                  Bagan 10 Kelas DDC
                </button>
              </li>
              <li>
                <a href="#tentang" className="hover:text-white transition-colors">Arsitektur Sistem</a>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Spesifikasi Teknis */}
          <div className="md:col-span-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">Spesifikasi Teknis</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• Level 1: IndoBERT Base P1 (116 Seksi)</li>
              <li>• Level 2: kNN TF-IDF Joint Beam Search</li>
              <li>• OCR Engine: Tesseract 5.5 + Modulo-10</li>
              <li>• Backend: FastAPI (Python 3.12)</li>
            </ul>
          </div>

        </div>

        {/* Baris Bawah Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Final Skripsi M. Ervin. Dikembangkan untuk Perpustakaan Bank Indonesia.</p>
          <div className="flex items-center gap-2">
            <span>Palet resmi</span>
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#007de4]" title="Bank Indonesia Blue (#007de4)" />
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#fbd900]" title="Accent Gold (#fbd900)" />
          </div>
        </div>

      </div>
    </footer>
  );
}

