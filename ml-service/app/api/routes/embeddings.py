from fastapi import APIRouter, HTTPException, status
from app.models.schemas import EmbeddingRequest, EmbeddingResponse
from app.services.embedding_service import embedding_service
from app.utils.logger import logger

router = APIRouter(prefix="/embeddings", tags=["Embeddings"])

@router.post(
    "/generate",
    response_model=EmbeddingResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate text embeddings"
)
async def generate_embeddings(request: EmbeddingRequest) -> EmbeddingResponse:
    """Generate dense vector embeddings for input text items."""
    try:
        await embedding_service.generate_embeddings(request.texts)
    except NotImplementedError:
        logger.info("POST /embeddings/generate called (stub mode)")
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Embedding generation endpoint is not implemented yet."
        )
