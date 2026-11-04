import { useState, useEffect } from 'react';
import { BookMarked, Search, ChevronDown, ChevronUp, Layers, X } from 'lucide-react';

const DDC_MAIN_CLASSES = [
  {
    code: '000',
    title: 'Karya Umum, Komputer & Informasi',
    description: 'Ilmu komputer, pemrograman, sistem informasi, jurnalisme, dan metodologi riset umum.',
    divisions: ['001 Ilmu Pengetahuan Umum', '004 Pemrosesan Data & Komputer', '005 Pemrograman & Software', '025 Operasi Perpustakaan', '070 Media Berita & Penerbitan']
  },
  {
    code: '100',
    title: 'Filsafat & Psikologi',
    description: 'Epistemologi, etika moral, logika penalaran, psikologi perkembangan, dan psikologi kepribadian.',
    divisions: ['150 Psikologi Umum', '153 Proses Mental & Inteligensi', '155 Psikologi Perkembangan', '158 Psikologi Terapan & Pengembangan Diri', '174 Etika Profesi']
  },
  {
    code: '200',
    title: 'Agama & Spiritualitas',
    description: 'Agama-agama dunia, teologi, hukum keagamaan, serta studi khusus Agama Islam.',
    divisions: ['200 Agama Umum', '220 Alkitab', '297 Agama Islam (Al-Qur\'an, Hadis, Fiqih, Muamalah, Sejarah Islam)']
  },
  {
    code: '300',
    title: 'Ilmu-Ilmu Sosial',
    description: 'Sosiologi, ilmu politik, hukum perdata/pidana, pendidikan, ekonomi makro, dan perbankan.',
    divisions: ['320 Ilmu Politik', '330 Ilmu Ekonomi', '332 Ekonomi Keuangan & Pasar Modal', '336 Keuangan Negara & Bank Sentral', '340 Ilmu Hukum', '370 Pendidikan']
  },
  {
    code: '400',
    title: 'Bahasa & Linguistik',
    description: 'Linguistik deskriptif, tata bahasa, kamus, bahasa Indonesia, daerah, dan bahasa internasional.',
    divisions: ['410 Linguistik', '413 Kamus Bahasa', '420 Bahasa Inggris', '499 Bahasa Indonesia & Melayu']
  },
  {
    code: '500',
    title: 'Sains Murni & Matematika',
    description: 'Fisika, kimia, biologi, ilmu kebumian, kalkulus, dan ilmu alam semesta.',
    divisions: ['510 Matematika & Aljabar', '530 Fisika', '540 Kimia', '550 Ilmu Bumi / Geologi', '590 Zoologi']
  },
  {
    code: '600',
    title: 'Teknologi & Ilmu Terapan',
    description: 'Kedokteran, kesehatan, teknik mesin, industri, administrasi bisnis, akuntansi, dan manajemen.',
    divisions: ['610 Kedokteran & Kesehatan', '621 Teknik Mesin & Elektronika', '650 Bisnis & Perkantoran', '657 Akuntansi & Pelaporan Keuangan', '658 Manajemen Bisnis']
  },
  {
    code: '700',
    title: 'Kesenian & Rekreasi',
    description: 'Arsitektur, seni rupa, desain grafis, fotografi, musik, film, dan olahraga.',
    divisions: ['720 Arsitektur', '740 Seni Grafis & Dekoratif', '741 Gambar & Desain Komik', '790 Olahraga & Hiburan']
  },
  {
    code: '800',
    title: 'Kesusastraan & Retorika',
    description: 'Teori sastra, puisi, novel, naskah drama, fiksi populer, dan karya sastra Indonesia.',
    divisions: ['082.3 / 82.3 Sastra Populer & Fiksi Indonesia', '808 Menulis Kreatif', '811 Puisi', '813 Fiksi & Cerita Rekaan', '899 Sastra Nusantara']
  },
  {
    code: '900',
    title: 'Sejarah & Geografi',
    description: 'Geografi dunia, atlas, penjelajahan, biografi tokoh nasional/dunia, dan sejarah peradaban bangsa.',
    divisions: ['910 Geografi & Perjalanan', '920 Biografi & Tokoh Terkenal', '930 Sejarah Kuno', '959 Sejarah Asia Tenggara & Indonesia']
  }
];

export default function DDCGuideSection({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCode, setExpandedCode] = useState(null);

  // Aksesibilitas Keyboard: Tutup modal dengan tombol Escape (R-32)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredClasses = DDC_MAIN_CLASSES.filter(c =>
    c.code.includes(searchQuery) ||
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.divisions.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[85vh] shadow-xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#007de4] text-white flex items-center justify-center shadow-xs">
              <BookMarked className="w-5 h-5 text-[#fbd900]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">Bagan Ringkas 10 Kelas Utama DDC</h3>
              <p className="text-xs text-slate-500">Panduan standar notasi Dewey Decimal Classification</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Filter */}
        <div className="px-6 py-3.5 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kelas atau bidang ilmu (misal: 657, Akuntansi, Islam, Fiksi, Ekonomi)..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#007de4] text-sm"
            />
          </div>
        </div>

        {/* List 10 Kelas DDC */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-100">
          {filteredClasses.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Tidak ada kelas DDC yang cocok dengan kata kunci "{searchQuery}".
            </div>
          ) : (
            filteredClasses.map((item) => {
              const isExpanded = expandedCode === item.code;
              return (
                <div key={item.code} className="pt-3 first:pt-0">
                  <div
                    onClick={() => setExpandedCode(isExpanded ? null : item.code)}
                    className="p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors cursor-pointer flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="font-mono font-bold bg-[#fbd900]/25 text-[#007de4] px-2.5 py-1 rounded-md text-sm shrink-0 border border-[#fbd900]/40">
                        {item.code}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-slate-400 shrink-0 mt-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Divisi Detail */}
                  {isExpanded && (
                    <div className="mt-2 ml-12 mr-4 p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                      <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#007de4]" />
                        <span>Seksi & Divisi Utama yang Didukung Model:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                        {item.divisions.map((div, i) => (
                          <div key={i} className="flex items-center gap-2 p-1.5 rounded-md bg-white border border-slate-200/60 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#007de4]" />
                            <span>{div}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs tracking-wide transition-colors cursor-pointer"
          >
            Tutup Bagan
          </button>
        </div>

      </div>
    </div>
  );
}

