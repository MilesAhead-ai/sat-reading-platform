from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import error_analysis, content_generation, irt_calibration

app = FastAPI(
    title="SAT Reading AI Service",
    description="AI/ML backend for error pattern analysis, content generation, and IRT calibration",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(error_analysis.router, prefix="/api/v1/error-analysis", tags=["Error Analysis"])
app.include_router(content_generation.router, prefix="/api/v1/content", tags=["Content Generation"])
app.include_router(irt_calibration.router, prefix="/api/v1/irt", tags=["IRT Calibration"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-service"}
