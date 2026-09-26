import uuid
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import (
    EmbeddingRequest,
    EmbeddingResponse,
    ProfileEmbeddingRequest,
    JobEmbeddingRequest,
    SkillEmbeddingRequest,
    EmbeddingWriteResponse,
)
from app.services.embedding_service import embedding_service
from app.core.database import get_db_connection
from app.utils.logger import logger

router = APIRouter(prefix="/embeddings", tags=["Embeddings"])

@router.post(
    "/profile",
    response_model=EmbeddingWriteResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate and store embedding for a user profile"
)
async def create_profile_embedding(request: ProfileEmbeddingRequest) -> EmbeddingWriteResponse:
    """
    Compose profile text, generate a 384-dimensional dense vector,
    and persist it directly to profiles.embedding for the given user_id.
    """
    # 1. Validate UUID format
    try:
        user_uuid = str(uuid.UUID(str(request.userId)))
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with userId '{request.userId}' not found."
        )

    # 2. Compose profile text
    try:
        profile_dict = request.profileFields.model_dump()
        composed_text = embedding_service.build_profile_text(profile_dict)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )

    # 3. Generate embedding
    try:
        embedding = embedding_service.generate_embedding(composed_text)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Embedding generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate embedding vector."
        )

    # 4. Write vector directly to profiles table
    vector_str = str(embedding)
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE profiles SET embedding = %s, updated_at = NOW() WHERE user_id = %s RETURNING id;",
                    (vector_str, user_uuid)
                )
                row = cur.fetchone()
                if row is None:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Profile with userId '{request.userId}' not found."
                    )
    except HTTPException:
        raise
    except Exception as db_err:
        logger.error(f"Database write failure in create_profile_embedding: {db_err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database write failure: {str(db_err)}"
        )

    logger.info(f"Successfully generated and stored 384-dim embedding for user {user_uuid}")
    return EmbeddingWriteResponse(success=True, dimensions=384)


@router.post(
    "/job",
    response_model=EmbeddingWriteResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate and store embedding for a job"
)
async def create_job_embedding(request: JobEmbeddingRequest) -> EmbeddingWriteResponse:
    """
    Compose job text, generate a 384-dimensional dense vector,
    and persist it directly to jobs.embedding for the given jobId.
    """
    # 1. Validate UUID format
    try:
        job_uuid = str(uuid.UUID(str(request.jobId)))
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with id '{request.jobId}' not found."
        )

    # 2. Compose job text
    try:
        job_dict = request.model_dump()
        composed_text = embedding_service.build_job_text(job_dict)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )

    # 3. Generate embedding
    try:
        embedding = embedding_service.generate_embedding(composed_text)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Embedding generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate embedding vector."
        )

    # 4. Write vector directly to jobs table
    vector_str = str(embedding)
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE jobs SET embedding = %s, updated_at = NOW() WHERE id = %s RETURNING id;",
                    (vector_str, job_uuid)
                )
                row = cur.fetchone()
                if row is None:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Job with id '{request.jobId}' not found."
                    )
    except HTTPException:
        raise
    except Exception as db_err:
        logger.error(f"Database write failure in create_job_embedding: {db_err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database write failure: {str(db_err)}"
        )

    logger.info(f"Successfully generated and stored 384-dim embedding for job {job_uuid}")
    return EmbeddingWriteResponse(success=True, dimensions=384)


@router.post(
    "/skill",
    response_model=EmbeddingWriteResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate and store embedding for a skill"
)
async def create_skill_embedding(request: SkillEmbeddingRequest) -> EmbeddingWriteResponse:
    """
    Generate a 384-dimensional dense vector directly from the skill name
    and persist it to skills.embedding for the given skillId.
    """
    # 1. Validate UUID format
    try:
        skill_uuid = str(uuid.UUID(str(request.skillId)))
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Skill with id '{request.skillId}' not found."
        )

    # 2. Validate skill name
    skill_name = request.name.strip() if request.name else ""
    if not skill_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Skill name cannot be empty."
        )

    # 3. Generate embedding directly from the skill name
    try:
        embedding = embedding_service.generate_embedding(skill_name)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Embedding generation error for skill {skill_uuid}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate embedding vector."
        )

    # 4. Write vector directly to skills table
    vector_str = str(embedding)
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE skills SET embedding = %s WHERE id = %s RETURNING id;",
                    (vector_str, skill_uuid)
                )
                row = cur.fetchone()
                if row is None:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Skill with id '{request.skillId}' not found."
                    )
    except HTTPException:
        raise
    except Exception as db_err:
        logger.error(f"Database write failure in create_skill_embedding: {db_err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database write failure: {str(db_err)}"
        )

    logger.info(f"Successfully generated and stored 384-dim embedding for skill {skill_uuid} ('{skill_name}')")
    return EmbeddingWriteResponse(success=True, dimensions=384)


@router.post(
    "/generate",
    response_model=EmbeddingResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate raw text embeddings"
)
async def generate_embeddings(request: EmbeddingRequest) -> EmbeddingResponse:
    """Generate dense vector embeddings for input text items."""
    try:
        vectors = embedding_service.generate_embeddings(request.texts)
        return EmbeddingResponse(
            model="all-MiniLM-L6-v2",
            embeddings=vectors,
            dimensions=len(vectors[0]) if vectors else 384
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Error generating raw embeddings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal embedding generation error."
        )
