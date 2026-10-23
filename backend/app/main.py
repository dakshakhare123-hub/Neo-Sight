"""
NeoScan FastAPI Application Entrypoint
Serves REST API and static documentation/assets.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .api.routes import router as api_router

app = FastAPI(
    title="NeoScan API",
    description="Lighting-Robust Neonatal Jaundice Screening Engine via Smartphone Camera",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for browser frontend (supports localhost, local network mobile testing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix="/api/v1")

# Mount docs directory for static access (e.g. printable SVG cards, benchmark plots)
docs_path = "/Users/dakshakhare/Desktop/Avishkar/docs"
if os.path.exists(docs_path):
    app.mount("/static/docs", StaticFiles(directory=docs_path), name="docs")

# Serve frontend single page app at root
frontend_path = "/Users/dakshakhare/Desktop/Avishkar/frontend"
if os.path.exists(frontend_path):
    app.mount("/app", StaticFiles(directory=frontend_path), name="frontend")

@app.get("/")
def serve_index():
    index_file = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "NeoScan API active. Navigate to /docs for Swagger."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
