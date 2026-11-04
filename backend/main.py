"""Titik masuk utama aplikasi backend FastAPI untuk Sistem Otomasi Klasifikasi DDC Berbasis AI."""

from contextlib import asynccontextmanager
import logging
from pathlib import Path
import sys

# Memastikan direktori backend selalu ada di sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Memuat konfigurasi environment variables dari file .env
try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR.parent / ".env")
    load_dotenv(BASE_DIR / ".env")
    load_dotenv()
except ImportError:
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from model_ai.ddc_inference import ddc_engine
from routers import classify, metadata, ocr

# Konfigurasi logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ddc-backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Siklus hidup aplikasi: Memuat model AI satu kali ke RAM saat server dinyalakan."""
    logger.info("=== Memulai Server DDC FastAPI ===")
    logger.info("Memuat model IndoBERT Level 1 dan kNN TF-IDF Level 2 ke RAM...")
    try:
        ddc_engine.load_artifacts()
        app.state.inference_engine = ddc_engine
        logger.info("=== Seluruh Artefak AI Berhasil Dimuat & Siap Menerima Kueri ===")
    except Exception as e:
        logger.critical("Gagal memuat artefak model saat startup: %s", e, exc_info=True)
        raise e

    yield

    logger.info("=== Mematikan Server DDC FastAPI ===")


app = FastAPI(
    title="Sistem Otomasi Klasifikasi DDC Berbasis AI",
    description=(
        "API utilitas pengatalogan otomatis Dewey Decimal Classification (DDC) "
        "menggunakan OCR Tesseract, Google Books Metadata, serta inferensi hierarkis "
        "IndoBERT (Level 1) dan kNN TF-IDF Joint Scoring Beam Search (Level 2)."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware agar dapat diakses dari Web / Mobile (React Native / Expo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrasi Router
app.include_router(classify.router)
app.include_router(ocr.router)
app.include_router(metadata.router)


@app.get("/", tags=["Root"])
async def root():
    """Informasi status root API."""
    return {
        "app": "Sistem Otomasi Klasifikasi DDC Berbasis AI",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_check": "/api/health",
        "endpoints": {
            "classify": "POST /api/classify",
            "ocr": "POST /api/ocr",
            "metadata": "GET /api/metadata/{isbn}",
            "seksi_list": "GET /api/seksi",
        },
    }


@app.get("/api/health", tags=["Root"])
async def health_check():
    """Memeriksa kesiapan model AI dan kesehatan server."""
    is_ready = getattr(app.state, "inference_engine", None) is not None and app.state.inference_engine.is_ready
    return {
        "status": "healthy" if is_ready else "initializing",
        "model_ready": is_ready,
        "classes_count": len(app.state.inference_engine.seksi_list) if is_ready else 0,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

