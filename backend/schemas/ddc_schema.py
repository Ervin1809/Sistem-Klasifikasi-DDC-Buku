"""Skema Pydantic untuk masukan dan luaran API Klasifikasi DDC."""

from typing import Optional
from pydantic import BaseModel, Field


class ClassifyRequest(BaseModel):
    """Permintaan inferensi klasifikasi DDC."""

    judul: str = Field(
        ...,
        min_length=3,
        description="Judul buku, wajib diisi minimal 3 karakter.",
        examples=["Pengantar Akuntansi"],
    )
    pengarang: Optional[str] = Field(
        default="",
        description="Nama pengarang buku (opsional).",
        examples=["Warren Reeve Fess"],
    )
    top_k: Optional[int] = Field(
        default=5,
        ge=1,
        le=10,
        description="Jumlah rekomendasi notasi DDC teratas (default 5).",
    )


class DDCItem(BaseModel):
    """Representasi satu kandidat notasi DDC hasil inferensi."""

    rank: int = Field(..., description="Peringkat kandidat (1-5).")
    kode_ddc: str = Field(..., description="Nomor notasi DDC desimal.")
    seksi: str = Field(..., description="Kode seksi DDC 3-digit.")
    label_seksi: str = Field(..., description="Deskripsi nama seksi DDC.")
    confidence_pct: float = Field(
        ..., description="Persentase skor keyakinan relatif (0-100%)."
    )
    joint_score: float = Field(
        ..., description="Probabilitas keyakinan gabungan Level 1 & Level 2."
    )
    is_top: bool = Field(
        default=False, description="Penanda kandidat peringkat 1 (Prediksi Utama)."
    )
    method: str = Field(
        default="knn_tfidf",
        description="Metode inferensi Level 2 (knn_tfidf / freq_fallback).",
    )


class ClassifyResponse(BaseModel):
    """Respon lengkap hasil inferensi DDC."""

    success: bool = Field(default=True, description="Status keberhasilan inferensi.")
    judul: str = Field(..., description="Judul buku yang dievaluasi.")
    pengarang: str = Field(default="", description="Nama pengarang yang dievaluasi.")
    inference_time_ms: float = Field(
        ..., description="Durasi komputasi inferensi AI dalam milidetik (ms)."
    )
    prediksi_utama: Optional[DDCItem] = Field(
        default=None, description="Notasi DDC dengan keyakinan tertinggi."
    )
    recommendations: list[DDCItem] = Field(
        ..., description="Daftar Top-5 rekomendasi notasi DDC."
    )


class MetadataBook(BaseModel):
    """Metadata buku dari Google Books API atau penyedia data bibliografi."""

    isbn: str
    judul: str
    pengarang: str = ""
    penerbit: Optional[str] = None
    tahun: Optional[str] = None
    deskripsi: Optional[str] = None
    cover_url: Optional[str] = None
    found: bool = True
    source: Optional[str] = Field(
        default="google_books",
        description="Sumber penyedia metadata (google_books / open_library)",
    )


class OCRResponse(BaseModel):
    """Respon pemrosesan OCR dan metadata buku."""

    success: bool
    isbn: Optional[str] = None
    is_valid_checksum: bool = False
    metadata: Optional[MetadataBook] = None
    pesan: Optional[str] = None

