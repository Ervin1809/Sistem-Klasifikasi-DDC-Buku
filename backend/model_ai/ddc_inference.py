"""Modul Inferensi Klasifikasi DDC Bertingkat (Hierarchical Inference Engine).

Alur:
1. Level 1: IndoBERT Base P1 memprediksi probabilitas Top-K seksi DDC (116 kelas).
2. Level 2: kNN TF-IDF + Joint Scoring Beam Search menghitung kemiripan kosinus
   dan mengombinasikan probabilitas seksi dengan probabilitas lokal notasi desimal.
"""

from dataclasses import dataclass
import logging
from pathlib import Path
import sys
import time
from typing import Any
import joblib
import numpy as np
import torch
from transformers import AutoTokenizer, BertForSequenceClassification

# Memastikan direktori backend terdaftar dalam sys.path
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

try:
    from model_ai.ddc_labels import get_seksi_label
except ImportError:
    from backend.model_ai.ddc_labels import get_seksi_label

logger = logging.getLogger(__name__)


@dataclass
class DDCRecommendationResult:
    rank: int
    kode_ddc: str
    seksi: str
    label_seksi: str
    confidence_pct: float
    joint_score: float
    is_top: bool
    method: str


class DDCInferenceEngine:
    """Mesin inferensi hierarkis DDC IndoBERT + kNN TF-IDF Beam Search."""

    def __init__(
        self,
        checkpoint_dir: str | Path | None = None,
        tfidf_path: str | Path | None = None,
        bundle_path: str | Path | None = None,
        max_seq_length: int = 64,
        default_beam_width: int = 5,
        default_top_k: int = 5,
    ):
        base_dir = Path(__file__).resolve().parent
        self.checkpoint_dir = (
            Path(checkpoint_dir) if checkpoint_dir else (base_dir / "checkpoint-3444")
        )
        self.tfidf_path = (
            Path(tfidf_path) if tfidf_path else (base_dir / "tfidf_vectorizer.joblib")
        )
        self.bundle_path = (
            Path(bundle_path)
            if bundle_path
            else (base_dir / "model_level2_svm_bundle_pk.joblib")
        )
        self.max_seq_length = max_seq_length
        self.default_beam_width = default_beam_width
        self.default_top_k = default_top_k

        self.tokenizer = None
        self.model = None
        self.tfidf = None
        self.bundle = None
        self.seksi_list: list[str] = []
        self.k_tetangga: int = 10
        self.is_ready: bool = False

    def load_artifacts(self) -> None:
        """Memuat seluruh artefak model ke RAM satu kali saat startup."""
        logger.info(
            "Memuat artefak model DDC dari %s, %s, %s ...",
            self.checkpoint_dir,
            self.tfidf_path,
            self.bundle_path,
        )
        t_start = time.time()

        # 1. Load Tokenizer & IndoBERT
        self.tokenizer = AutoTokenizer.from_pretrained(
            str(self.checkpoint_dir), local_files_only=True
        )
        self.model = BertForSequenceClassification.from_pretrained(
            str(self.checkpoint_dir), local_files_only=True
        )
        self.model.eval()

        # 2. Load TF-IDF Vectorizer
        self.tfidf = joblib.load(str(self.tfidf_path))

        # 3. Load Level 2 Bundle (kNN TF-IDF, Prior Freq, Daftar Seksi)
        self.bundle = joblib.load(str(self.bundle_path))
        self.seksi_list = sorted(self.bundle["seksi_terdaftar"])
        self.k_tetangga = int(self.bundle.get("k_tetangga", 10))

        # Warmup inferensi CPU untuk memicu inisialisasi PyTorch graph
        self._warmup()

        self.is_ready = True
        elapsed = time.time() - t_start
        logger.info("Artefak model DDC berhasil dimuat dalam %.2f detik.", elapsed)

    def _warmup(self) -> None:
        """Inisialisasi pemanasan inferensi agar inferensi pertama tidak mengalami cold start."""
        try:
            sample_text = "Pengantar Sistem Informasi Manajemen"
            inputs = self.tokenizer(
                sample_text,
                return_tensors="pt",
                truncation=True,
                max_length=self.max_seq_length,
                padding=True,
            )
            with torch.no_grad():
                _ = self.model(**inputs)
            _ = self.tfidf.transform([sample_text])
        except Exception as e:
            logger.warning("Pemanasan model (warmup) gagal: %s", e)

    def predict(
        self,
        judul: str,
        pengarang: str = "",
        top_k: int | None = None,
        beam_width: int | None = None,
    ) -> tuple[list[DDCRecommendationResult], float]:
        """Menjalankan klasifikasi DDC bertingkat (Level 1 + Level 2).

        Args:
            judul: Judul buku (wajib, minimal 3 karakter).
            pengarang: Nama pengarang (opsional).
            top_k: Jumlah hasil notasi desimal terbaik (default: 5).
            beam_width: Lebar beam seksi teratas Level 1 (default: 5).

        Returns:
            Tuple (daftar rekomendasi DDC, waktu inferensi dalam milidetik).
        """
        if not self.is_ready:
            raise RuntimeError(
                "Model DDC belum dimuat. Panggil `load_artifacts()` terlebih dahulu."
            )

        t_start = time.perf_counter()

        top_k = top_k or self.default_top_k
        beam_width = beam_width or self.default_beam_width

        # Gabungkan teks masukan
        teks_gabungan = f"{judul.strip()} {pengarang.strip()}".strip()

        # ========================================================
        # LEVEL 1: IndoBERT Base P1 (Prediksi Probabilitas Seksi)
        # ========================================================
        inputs = self.tokenizer(
            teks_gabungan,
            return_tensors="pt",
            truncation=True,
            max_length=self.max_seq_length,
            padding=True,
        )

        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=1)[0].numpy()

        # Ambil Top-B seksi dengan probabilitas tertinggi
        top_seksi_idx = np.argsort(probs)[::-1][:beam_width]

        # ========================================================
        # LEVEL 2: kNN TF-IDF + Joint Scoring Beam Search
        # ========================================================
        q_vec = self.tfidf.transform([teks_gabungan])
        q_norm = np.linalg.norm(q_vec.data) if q_vec.nnz > 0 else 0.0

        candidates: list[dict[str, Any]] = []

        for s_idx in top_seksi_idx:
            seksi = self.seksi_list[s_idx]
            p_seksi = float(probs[s_idx])

            knn_data = self.bundle.get("knn_tfidf", {}).get(seksi)
            freq_data = self.bundle.get("freq_probs", {}).get(seksi, {})

            if not knn_data:
                # Fallback jika seksi tidak memiliki data kNN
                for kode, p_freq in freq_data.items():
                    candidates.append({
                        "seksi": seksi,
                        "kode_ddc": str(kode),
                        "joint_score": p_seksi * float(p_freq),
                        "method": "freq_fallback",
                    })
                continue

            mat = knn_data["tfidf_mat"]
            kodes = knn_data["kode"]
            n_samples = mat.shape[0]

            # Hitung kemiripan kosinus jika vektor query tidak kosong
            if q_norm > 0 and mat.nnz > 0:
                # Karena vektor TF-IDF l2-normalized, dot product adalah cosine similarity
                sims = (mat.dot(q_vec.T)).toarray().ravel()
                k = min(self.k_tetangga, n_samples)
                top_neighbor_idx = np.argsort(sims)[::-1][:k]

                code_sim_sum: dict[str, float] = {}
                total_sim = 0.0

                for idx in top_neighbor_idx:
                    s_val = max(0.0, float(sims[idx]))
                    c_code = str(kodes[idx])
                    code_sim_sum[c_code] = code_sim_sum.get(c_code, 0.0) + s_val
                    total_sim += s_val

                if total_sim > 0.0:
                    for c_code, s_val in code_sim_sum.items():
                        p_local = s_val / total_sim
                        candidates.append({
                            "seksi": seksi,
                            "kode_ddc": c_code,
                            "joint_score": p_seksi * p_local,
                            "method": "knn_tfidf",
                        })
                else:
                    # Kemiripan bernilai 0, gunakan bobot prioritas frekuensi
                    for kode, p_freq in freq_data.items():
                        candidates.append({
                            "seksi": seksi,
                            "kode_ddc": str(kode),
                            "joint_score": p_seksi * float(p_freq),
                            "method": "freq_fallback",
                        })
            else:
                # Query kosong atau tanpa kata kunci berbobot
                for kode, p_freq in freq_data.items():
                    candidates.append({
                        "seksi": seksi,
                        "kode_ddc": str(kode),
                        "joint_score": p_seksi * float(p_freq),
                        "method": "freq_fallback",
                    })

        # Urutkan seluruh kandidat berdasarkan Joint Score (Probabilitas Gabungan)
        candidates.sort(key=lambda x: x["joint_score"], reverse=True)

        # Deduplikasi: bila kode DDC yang sama muncul di beberapa cabang seksi,
        # pertahankan kandidat dengan skor joint tertinggi
        seen_codes: set[str] = set()
        deduped: list[dict[str, Any]] = []
        for cand in candidates:
            c = cand["kode_ddc"]
            if c not in seen_codes:
                seen_codes.add(c)
                deduped.append(cand)
            if len(deduped) >= top_k:
                break

        # Jika kandidat unik kurang dari top_k, ambil dari prior fallback
        if len(deduped) < top_k and len(top_seksi_idx) > 0:
            top_seksi = self.seksi_list[top_seksi_idx[0]]
            freq_data = self.bundle.get("freq_probs", {}).get(top_seksi, {})
            for kode, p_freq in sorted(
                freq_data.items(), key=lambda x: x[1], reverse=True
            ):
                str_kode = str(kode)
                if str_kode not in seen_codes:
                    seen_codes.add(str_kode)
                    deduped.append({
                        "seksi": top_seksi,
                        "kode_ddc": str_kode,
                        "joint_score": float(probs[top_seksi_idx[0]]) * float(p_freq),
                        "method": "freq_fallback",
                    })
                if len(deduped) >= top_k:
                    break

        # Normalisasi skor keyakinan menjadi persentase relatif (Total 100%)
        total_top_score = sum(c["joint_score"] for c in deduped)
        results: list[DDCRecommendationResult] = []

        for rank, cand in enumerate(deduped, start=1):
            if total_top_score > 0.0:
                conf = round((cand["joint_score"] / total_top_score) * 100.0, 2)
            else:
                conf = round(100.0 / len(deduped), 2) if deduped else 0.0

            seksi_code = cand["seksi"]
            results.append(
                DDCRecommendationResult(
                    rank=rank,
                    kode_ddc=cand["kode_ddc"],
                    seksi=seksi_code,
                    label_seksi=get_seksi_label(seksi_code),
                    confidence_pct=conf,
                    joint_score=round(cand["joint_score"], 6),
                    is_top=(rank == 1),
                    method=cand["method"],
                )
            )

        elapsed_ms = round((time.perf_counter() - t_start) * 1000.0, 2)
        return results, elapsed_ms


# Instance global singleton
ddc_engine = DDCInferenceEngine()

