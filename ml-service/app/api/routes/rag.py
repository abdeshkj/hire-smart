from fastapi import APIRouter, HTTPException, status
from app.models.schemas import RAGRequest, RAGResponse
from app.services.rag_service import rag_service
from app.utils.logger import logger

router = APIRouter(prefix="/rag", tags=["RAG"])

@router.post(
    "/retrieve",
    response_model=RAGResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve relevant documents from vector store"
)
async def retrieve_context(request: RAGRequest) -> RAGResponse:
    """Retrieve top-K matching document chunks using semantic vector search."""
    try:
        await rag_service.retrieve_context(
            query=request.query,
            collection=request.collection_name,
            top_k=request.top_k
        )
    except NotImplementedError:
        logger.info("POST /rag/retrieve called (stub mode)")
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="RAG retrieval endpoint is not implemented yet."
        )
