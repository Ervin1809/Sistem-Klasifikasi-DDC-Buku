"""Router API untuk inferensi klasifikasi DDC (Level 1 & Level 2)."""

import logging
from fastapi import APIRouter, HTTPException, Request, status
from model_ai.ddc_labels import SEKSI_DDC_LABELS
from schemas.ddc_schema import ClassifyRequest, ClassifyResponse, DDCItem

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Klasifikasi DDC"])


@router.post(
    "/classify",
    response_model=ClassifyResponse,
    summary="Klasifikasi Notasi DDC Bertingkat (Top-5)",
    description=(
        "Menghitung probabilitas seksi 3-digit menggunakan model IndoBERT (Level 1) "
        "dan mengeksekusi kNN TF-IDF Joint Scoring Beam Search (Level 2) "
        "untuk menghasilkan Top-5 rekomendasi notasi DDC desimal."
    ),
)
async def classify_book(payload: ClassifyRequest, request: Request) -> ClassifyResponse:
    # 1. Validasi Masukan Teks
    judul_bersih = payload.judul.strip()
    if len(judul_bersih) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Judul buku wajib diisi minimal 3 karakter untuk melakukan klasifikasi.",
        )

    pengarang_bersih = (payload.pengarang or "").strip()

    # 2. Ambil instance inference engine dari application state
    engine = getattr(request.app.state, "inference_engine", None)
    if engine is None or not engine.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model AI inferensi DDC sedang dalam proses pemuatan atau belum siap.",
        )

    # 3. Jalankan Inferensi Hierarkis Level 1 & Level 2
    try:
        recommendations_raw, latency_ms = engine.predict(
            judul=judul_bersih,
            pengarang=pengarang_bersih,
            top_k=payload.top_k or 5,
        )
    except Exception as e:
        logger.exception("Kesalahan saat menjalankan inferensi DDC: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Terjadi kesalahan internal saat komputasi inferensi model: {e}",
        )

    # 4. Bangun Objek Respon
    items = [
        DDCItem(
            rank=r.rank,
            kode_ddc=r.kode_ddc,
            seksi=r.seksi,
            label_seksi=r.label_seksi,
            confidence_pct=r.confidence_pct,
            joint_score=r.joint_score,
            is_top=r.is_top,
            method=r.method,
        )
        for r in recommendations_raw
    ]

    prediksi_utama = items[0] if items else None

    return ClassifyResponse(
        success=True,
        judul=judul_bersih,
        pengarang=pengarang_bersih,
        inference_time_ms=latency_ms,
        prediksi_utama=prediksi_utama,
        recommendations=items,
    )


@router.get(
    "/seksi",
    summary="Daftar 116 Seksi DDC Terdaftar",
    description="Mengembalikan seluruh seksi DDC yang didukung oleh model klasifikasi.",
)
async def list_seksi(request: Request):
    engine = getattr(request.app.state, "inference_engine", None)
    seksi_list = engine.seksi_list if engine and engine.is_ready else sorted(SEKSI_DDC_LABELS.keys())
    return {
        "total_seksi": len(seksi_list),
        "data": [
            {"kode_seksi": s, "label": SEKSI_DDC_LABELS.get(s, f"Seksi {s}")}
            for s in seksi_list
        ],
    }

