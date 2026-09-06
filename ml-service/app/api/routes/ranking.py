from fastapi import APIRouter, HTTPException, status
from app.models.schemas import RankingRequest, RankingResponse
from app.services.ranking_service import ranking_service
from app.utils.logger import logger

router = APIRouter(prefix="/ranking", tags=["Ranking"])

@router.post(
    "/candidates",
    response_model=RankingResponse,
    status_code=status.HTTP_200_OK,
    summary="Rank candidate resumes against a job description"
)
async def rank_candidates(request: RankingRequest) -> RankingResponse:
    """Score and rank candidate profiles using semantic and skill similarity."""
    try:
        await ranking_service.rank_candidates(
            job_description=request.job_description,
            required_skills=request.required_skills,
            candidates=request.candidates,
            top_k=request.top_k or 10
        )
    except NotImplementedError:
        logger.info("POST /ranking/candidates called (stub mode)")
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Candidate ranking endpoint is not implemented yet."
        )
