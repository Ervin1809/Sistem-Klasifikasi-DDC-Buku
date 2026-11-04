"""Router API untuk pencarian metadata buku berdasarkan ISBN."""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from model_ai.ocr_service import validasi_isbn13
from schemas.ddc_schema import MetadataBook
from services.metadata_service import cari_metadata_google_books

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/metadata", tags=["Metadata Buku (Google Books)"])


@router.get(
    "/{isbn}",
    response_model=MetadataBook,
    summary="Ambil Metadata Buku Berdasarkan ISBN (Path Param)",
    description=(
        "Mengambil data bibliografi (Judul, Pengarang, Penerbit, Tahun, Cover) "
        "dari Google Books API (dengan fallback Open Library) berdasarkan nomor ISBN."
    ),
)
async def get_book_metadata(isbn: str) -> MetadataBook:
    clean_isbn = "".join(filter(str.isdigit, isbn))
    if len(clean_isbn) not in (10, 13):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nomor ISBN tidak valid. ISBN harus terdiri dari 10 atau 13 digit angka.",
        )

    # Validasi checksum jika 13 digit
    if len(clean_isbn) == 13 and not validasi_isbn13(clean_isbn):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Digit kontrol ISBN-13 (Modulo-10) tidak valid.",
        )

    meta = cari_metadata_google_books(clean_isbn)
    if not meta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Metadata buku dengan ISBN {clean_isbn} tidak ditemukan di Google Books. "
                "Silakan masukkan Judul dan Pengarang secara manual."
            ),
        )

    return meta


@router.get(
    "",
    response_model=MetadataBook,
    summary="Ambil Metadata Buku Berdasarkan ISBN (Query Param)",
    description="Alternatif pengambilan metadata menggunakan parameter kueri ?isbn=...",
)
async def query_book_metadata(
    isbn: str = Query(..., description="Nomor ISBN buku", examples=["9789793062792"])
) -> MetadataBook:
    return await get_book_metadata(isbn)

