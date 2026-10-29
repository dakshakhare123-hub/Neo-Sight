"""FastAPI wrapper. Run: uvicorn api:app --reload"""
import logging
import os

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

from neoscan_ml.errors import AnalysisError
from neoscan_ml.predict import Analyzer

log = logging.getLogger("neoscan")
app = FastAPI(title="NeoScan analysis API")
MODEL_PATH = os.environ.get("NEOSCAN_MODEL", "models/model.joblib")
MAX_BYTES = 15 * 1024 * 1024
_analyzer = None


def _get():
    global _analyzer
    if _analyzer is None:
        _analyzer = Analyzer(MODEL_PATH)
    return _analyzer


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    data = await file.read()
    if len(data) > MAX_BYTES:
        return JSONResponse(status_code=413, content={"status": "error", "error": {
            "code": "FILE_TOO_LARGE", "message": "Image exceeds 15 MB.", "hint": "Upload a smaller photo."}})
    try:
        return _get().analyse(data)
    except AnalysisError as e:
        code = 503 if e.code == "MODEL_UNAVAILABLE" else 422
        return JSONResponse(status_code=code, content={"status": "error", "error": e.to_dict()})
    except Exception:
        log.exception("Unexpected analysis failure")
        return JSONResponse(status_code=500, content={"status": "error", "error": {
            "code": "ANALYSIS_FAILED", "message": "Unexpected error during analysis.", "hint": "Try again."}})
