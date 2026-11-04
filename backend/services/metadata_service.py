"""Layanan integrasi Google Books API & resolusi metadata bibliografi buku berbasis ISBN.

Fitur:
1. Google Books API sebagai sumber data utama (mendukung query dengan/tanpa API key).
2. Mekanisme fallback ganda:
   - Fallback query Google Books (q=isbn:{isbn} -> q={isbn})
   - Fallback penyedia bibliografi (Open Library API) jika Google Books API
     terkena limit kuota harian (HTTP 429) atau timeout.
3. Ekstraksi otomatis Judul, Pengarang, Penerbit, Tahun Terbit, Deskripsi, dan Cover.
"""

import logging
import os
from typing import Optional
import requests
from schemas.ddc_schema import MetadataBook

logger = logging.getLogger(__name__)

GOOGLE_BOOKS_ENDPOINT = "https://www.googleapis.com/books/v1/volumes"
OPEN_LIBRARY_ENDPOINT = "https://openlibrary.org/api/books"


def _fetch_from_google_books(
    clean_isbn: str, api_key: Optional[str] = None, timeout: int = 5
) -> Optional[MetadataBook]:
    """Mengambil metadata dari Google Books API."""
    params: dict[str, str | int] = {
        "q": f"isbn:{clean_isbn}",
        "maxResults": 1,
        "printType": "books",
    }
    if api_key:
        params["key"] = api_key

    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; DDCClassifierApp/1.0; +https://github.com/ervinhsn)",
        "Accept": "application/json",
    }

    try:
        response = requests.get(
            GOOGLE_BOOKS_ENDPOINT, params=params, headers=headers, timeout=timeout
        )

        # Jika terkena kuota 429, log dan alihkan ke fallback
        if response.status_code == 429:
            logger.warning(
                "Google Books API kuota terlampaui (HTTP 429) untuk ISBN %s. Menyiapkan fallback.",
                clean_isbn,
            )
            return None

        if response.status_code != 200:
            logger.warning(
                "Google Books API mengembalikan HTTP %s untuk ISBN %s",
                response.status_code,
                clean_isbn,
            )
            return None

        data = response.json()
        items = data.get("items", [])

        # Jika tidak ditemukan dengan prefix isbn:, coba kueri langsung tanpa prefix
        if not items:
            params["q"] = clean_isbn
            retry_res = requests.get(
                GOOGLE_BOOKS_ENDPOINT, params=params, headers=headers, timeout=timeout
            )
            if retry_res.status_code == 200:
                data = retry_res.json()
                items = data.get("items", [])

        if not items:
            return None

        volume_info = items[0].get("volumeInfo", {})
        judul = volume_info.get("title", "").strip()
        if not judul:
            return None

        subjudul = volume_info.get("subtitle", "").strip()
        if subjudul:
            judul = f"{judul}: {subjudul}"

        authors_list = volume_info.get("authors", [])
        pengarang = ", ".join(authors_list) if authors_list else ""

        penerbit = volume_info.get("publisher")
        tahun = volume_info.get("publishedDate")
        deskripsi = volume_info.get("description")

        image_links = volume_info.get("imageLinks", {})
        cover_url = image_links.get("thumbnail") or image_links.get("smallThumbnail")
        if cover_url and cover_url.startswith("http://"):
            cover_url = "https://" + cover_url[7:]

        return MetadataBook(
            isbn=clean_isbn,
            judul=judul,
            pengarang=pengarang,
            penerbit=penerbit,
            tahun=str(tahun) if tahun else None,
            deskripsi=deskripsi,
            cover_url=cover_url,
            found=True,
            source="google_books",
        )

    except requests.exceptions.RequestException as e:
        logger.warning("Gagal koneksi ke Google Books API: %s", e)
        return None


def _fetch_from_open_library(clean_isbn: str, timeout: int = 5) -> Optional[MetadataBook]:
    """Fallback mengambil metadata dari Open Library API."""
    params = {
        "bibkeys": f"ISBN:{clean_isbn}",
        "format": "json",
        "jscmd": "data",
    }
    headers = {
        "User-Agent": "DDCClassifierApp/1.0 (contact@example.com)",
        "Accept": "application/json",
    }

    try:
        response = requests.get(
            OPEN_LIBRARY_ENDPOINT, params=params, headers=headers, timeout=timeout
        )
        if response.status_code != 200:
            return None

        data = response.json()
        book_key = f"ISBN:{clean_isbn}"
        if book_key not in data:
            return None

        info = data[book_key]
        judul = info.get("title", "").strip()
        if not judul:
            return None

        subjudul = info.get("subtitle", "").strip()
        if subjudul:
            judul = f"{judul}: {subjudul}"

        authors = [a.get("name") for a in info.get("authors", []) if a.get("name")]
        pengarang = ", ".join(authors) if authors else ""

        publishers = [p.get("name") for p in info.get("publishers", []) if p.get("name")]
        penerbit = ", ".join(publishers) if publishers else None

        tahun = info.get("publish_date")
        cover_dict = info.get("cover", {})
        cover_url = (
            cover_dict.get("medium")
            or cover_dict.get("large")
            or cover_dict.get("small")
        )

        return MetadataBook(
            isbn=clean_isbn,
            judul=judul,
            pengarang=pengarang,
            penerbit=penerbit,
            tahun=str(tahun) if tahun else None,
            deskripsi=None,
            cover_url=cover_url,
            found=True,
            source="open_library",
        )

    except requests.exceptions.RequestException as e:
        logger.warning("Gagal koneksi ke Open Library fallback: %s", e)
        return None


def cari_metadata_google_books(
    isbn: str, timeout_seconds: int = 5
) -> Optional[MetadataBook]:
    """Mencari data bibliografi buku berdasarkan nomor ISBN.

    Alur:
    1. Mencoba Google Books API terlebih dahulu.
    2. Jika gagal atau terkena kuota, otomatis fallback ke Open Library API.
    3. Jika kedua layanan tidak menemukan buku, mengembalikan None.

    Args:
        isbn: Nomor ISBN (10 atau 13 digit).
        timeout_seconds: Batas waktu permintaan HTTP per layanan.

    Returns:
        MetadataBook jika ditemukan, None jika buku tidak tercatat.
    """
    clean_isbn = "".join(filter(str.isdigit, isbn))
    if len(clean_isbn) not in (10, 13):
        logger.debug("ISBN tidak valid (harus 10 atau 13 digit): %s", clean_isbn)
        return None

    api_key = os.getenv("GOOGLE_BOOKS_API_KEY", "").strip() or None

    # 1. Coba Google Books API
    metadata = _fetch_from_google_books(clean_isbn, api_key=api_key, timeout=timeout_seconds)
    if metadata:
        logger.info(
            "Metadata ditemukan via Google Books untuk ISBN %s: '%s' oleh '%s'",
            clean_isbn,
            metadata.judul,
            metadata.pengarang,
        )
        return metadata

    # 2. Coba Fallback Open Library API
    logger.info("Mencoba fallback Open Library untuk ISBN: %s", clean_isbn)
    metadata_fallback = _fetch_from_open_library(clean_isbn, timeout=timeout_seconds)
    if metadata_fallback:
        logger.info(
            "Metadata ditemukan via Open Library untuk ISBN %s: '%s' oleh '%s'",
            clean_isbn,
            metadata_fallback.judul,
            metadata_fallback.pengarang,
        )
        return metadata_fallback

    logger.info("Metadata tidak ditemukan di Google Books maupun Open Library untuk ISBN: %s", clean_isbn)
    return None
