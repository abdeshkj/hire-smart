from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.core.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse, summary="Service Health Check")
async def health_check() -> HealthResponse:
    """Return health status of the ML microservice."""
    return HealthResponse(
        status="ok",
        service="hire-smart-ml-service",
        environment=settings.ENVIRONMENT
    )
