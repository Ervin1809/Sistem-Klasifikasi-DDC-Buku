import { ShieldCheck, GitBranch, Binary, Layers } from 'lucide-react';

export default function AboutSection() {
  return (
    <section id="tentang" className="py-16 md:py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Bagian */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#002072] text-[#f9a825] border border-[#f9a825]/40 text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#f9a825] shadow-xs shadow-amber-400/50" />
            <span>Arsitektur Sistem</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#002072] tracking-tight">
            Alur Pipeline Klasifikasi Dua Tingkat
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Sistem memadukan pengenalan visual nomor ISBN (OCR), validasi matematis ISO Modulo-10, serta inferensi hierarkis dua tingkat untuk menjamin akurasi dan kecepatan tinggi.
          </p>
        </div>

        {/* Pipeline 3 Tahap Terstruktur Berurutan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {/* Tahap 1: OCR & Modulo-10 */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-lg bg-[#fff8e1] text-[#002072] border border-[#f9a825]/50 font-bold text-xs flex items-center justify-center font-mono shadow-2xs">
                  01
                </span>
                <Binary className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Ekstraksi ISBN & Modulo-10
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Memproses citra KDT menggunakan Tesseract OCR. Pola nomor ISBN diekstraksi via regex dan diverifikasi menggunakan rumus ISO Modulo-10 untuk mencegah kesalahan karakter sebelum pencarian metadata.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
              Komponen: Tesseract OCR + Google Books API
            </div>
          </div>

          {/* Tahap 2: IndoBERT Level 1 */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-lg bg-[#fff8e1] text-[#002072] border border-[#f9a825]/50 font-bold text-xs flex items-center justify-center font-mono shadow-2xs">
                  02
                </span>
                <GitBranch className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Level 1: IndoBERT Klasifikasi
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Model IndoBERT Base P1 mengevaluasi representasi semantik judul dan pengarang buku untuk memprediksi probabilitas seksi 3-digit di antara 116 kelas seksi DDC terdaftar dalam hitungan milidetik.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
              Komponen: IndoBERT Base P1 (116 Seksi)
            </div>
          </div>

          {/* Tahap 3: kNN TF-IDF Level 2 */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-lg bg-[#fff8e1] text-[#002072] border border-[#f9a825]/50 font-bold text-xs flex items-center justify-center font-mono shadow-2xs">
                  03
                </span>
                <Layers className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Level 2: Beam Search Reranking
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Algoritma kNN berbasis pembobotan TF-IDF n-gram (1,2) menghitung kemiripan kosinus terhadap sampel latih dan mengeksekusi Joint Scoring Beam Search untuk menentukan Top-5 notasi desimal penuh.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
              Komponen: kNN TF-IDF + Joint Scoring
            </div>
          </div>

        </div>

        {/* Jaminan Integritas Privasi (Zero Database Persistence) */}
        <div className="rounded-xl bg-[#002072] text-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-[#001755] shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#f9a825]" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">
                Jaminan Privasi & Zero Database Persistence
              </h4>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
                Seluruh komputasi berjalan murni di memori RAM server (*in-memory*). Berkas citra dan hasil inferensi tidak disimpan ke dalam basis data permanen dan dimusnahkan segera setelah respon dikirim.
              </p>
            </div>
          </div>

          <div className="shrink-0 text-xs font-medium text-blue-200 border border-blue-900/50 rounded-md px-3 py-1.5 bg-[#001755]">
            Akses Terbuka Tanpa Autentikasi
          </div>
        </div>

      </div>
    </section>
  );
}

