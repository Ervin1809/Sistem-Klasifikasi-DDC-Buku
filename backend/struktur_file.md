backend/
├── main.py                      # Aplikasi FastAPI, Lifespan Startup, CORS Middleware, & Route Registration
├── test_pipeline.py             # Pengujian integrasi otomatis (TestClient)
├── routers/
│   ├── classify.py              # Endpoint POST /api/classify & GET /api/seksi
│   └── ocr.py                   # Endpoint POST /api/ocr (ekstraksi ISBN & Google Books)
├── schemas/
│   └── ddc_schema.py            # Skema validasi Pydantic (ClassifyRequest, DDCItem, ClassifyResponse, dll.)
├── services/
│   └── metadata_service.py      # Client Google Books API untuk resolusi ISBN ke metadata bibliografi
└── model_ai/
    ├── checkpoint-3444/         # IndoBERT Base P1 (weights + config + tokenizer)
    ├── tfidf_vectorizer.joblib  # Vektorisasi n-gram (1,2) teks kueri
    ├── model_level2_svm_bundle_pk.joblib # Data latih kNN TF-IDF & bobot prioritas frekuensi
    ├── ddc_labels.py            # Kamus deskripsi label untuk 116 seksi DDC
    ├── ddc_inference.py         # Engine inferensi hierarkis (Level 1 + Level 2 Beam Search)
    └── ocr_service.py           # OpenCV + Tesseract OCR & validasi Modulo-10 ISBN-13