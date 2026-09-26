import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import RankingRequest, RankingResponse, CandidateScore
from app.core.database import get_db_connection
from app.services.embedding_service import embedding_service
from app.utils.logger import logger

router = APIRouter(prefix="/ranking", tags=["Ranking"])

@router.post(
    "/candidates",
    response_model=RankingResponse,
    status_code=status.HTTP_200_OK,
    summary="Rank candidate freelancers for a job using hybrid multi-stage retrieval"
)
async def rank_candidates(request: RankingRequest) -> RankingResponse:
    """
    Candidate retrieval endpoint combining:
    1. Semantic similarity (pgvector <=> between job and profile embeddings)
    2. Max-pooled skill embedding similarity (avoiding dilution vs averaging)
    3. Lexical skill overlap ratio (exact term matching)
    """
    job_id_raw = request.jobId or request.job_id
    if not job_id_raw:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Missing required field: jobId"
        )

    try:
        job_uuid = str(uuid.UUID(str(job_id_raw)))
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with id '{job_id_raw}' not found."
        )

    top_k = request.top_k or 50

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # 1. Fetch Job details and whole embedding
                cur.execute(
                    "SELECT id, title, description, experience_requirement, embedding FROM jobs WHERE id = %s;",
                    (job_uuid,)
                )
                job_row = cur.fetchone()
                if not job_row:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Job with id '{job_uuid}' not found."
                    )

                job_id, job_title, job_desc, job_exp, job_embedding = job_row

                # Fetch Job's required skills
                cur.execute(
                    """
                    SELECT s.id::text, s.name, s.embedding
                    FROM job_skills js
                    JOIN skills s ON s.id = js.skill_id
                    WHERE js.job_id = %s
                    ORDER BY s.name ASC;
                    """,
                    (job_uuid,)
                )
                job_skill_rows = cur.fetchall()
                job_skills = [
                    {"id": row[0], "name": row[1], "has_embedding": row[2] is not None}
                    for row in job_skill_rows
                ]
                job_skill_ids = [js["id"] for js in job_skills]
                job_skill_names = [js["name"] for js in job_skills]

                # Ensure Job has an embedding if missing
                if job_embedding is None:
                    logger.info(f"Job {job_uuid} has no precomputed embedding. Generating on the fly...")
                    composed_job_text = embedding_service.build_job_text({
                        "title": job_title,
                        "description": job_desc or "",
                        "experienceRequirement": job_exp or "",
                        "skills": job_skill_names,
                    })
                    generated_vector = embedding_service.generate_embedding(composed_job_text)
                    vector_str = str(generated_vector)
                    cur.execute(
                        "UPDATE jobs SET embedding = %s, updated_at = NOW() WHERE id = %s RETURNING embedding;",
                        (vector_str, job_uuid)
                    )
                    job_embedding = vector_str

                # 2. Count total freelancers in database
                cur.execute("SELECT COUNT(*) FROM users WHERE role = 'freelancer';")
                total_freelancers = cur.fetchone()[0]

                # 3. Retrieve eligible freelancer candidates:
                # Must have a non-null profile embedding AND at least one skill with a non-null embedding.
                # Compute semantic_score using pgvector's <=> cosine distance operator directly in SQL.
                cur.execute(
                    """
                    SELECT 
                        u.id::text as freelancer_id,
                        ROUND(GREATEST(0.0, LEAST(1.0, (1.0 - (p.embedding <=> j.embedding))))::numeric, 4) as semantic_score
                    FROM users u
                    JOIN profiles p ON p.user_id = u.id
                    JOIN jobs j ON j.id = %s
                    WHERE u.role = 'freelancer'
                      AND p.embedding IS NOT NULL
                      AND EXISTS (
                          SELECT 1 FROM user_skills us
                          JOIN skills s ON s.id = us.skill_id
                          WHERE us.user_id = u.id AND s.embedding IS NOT NULL
                      );
                    """,
                    (job_uuid,)
                )
                eligible_rows = cur.fetchall()

                eligible_candidates = [
                    {"freelancer_id": row[0], "semantic_score": float(row[1])}
                    for row in eligible_rows
                ]
                candidate_ids = [c["freelancer_id"] for c in eligible_candidates]

                skipped_count = total_freelancers - len(eligible_candidates)
                logger.info(
                    f"Candidate retrieval for job {job_uuid}: evaluated {len(eligible_candidates)} eligible freelancer(s), "
                    f"skipped {skipped_count} lacking profile embeddings or embedded skills."
                )

                if not eligible_candidates:
                    return RankingResponse(
                        job_id=job_uuid,
                        job_title=job_title,
                        total_evaluated=0,
                        ranked_candidates=[]
                    )

                # 4. Fetch each candidate freelancer's skills for lexical overlap
                cur.execute(
                    """
                    SELECT us.user_id::text, s.name
                    FROM user_skills us
                    JOIN skills s ON s.id = us.skill_id
                    WHERE us.user_id = ANY(%s::uuid[]);
                    """,
                    (candidate_ids,)
                )
                freelancer_skills_map: Dict[str, List[str]] = {cid: [] for cid in candidate_ids}
                for f_id, skill_name in cur.fetchall():
                    if f_id in freelancer_skills_map:
                        freelancer_skills_map[f_id].append(skill_name)

                # 5. Compute max-pooled skill similarity via pgvector <=> in SQL
                # For each job required skill, find the MAX cosine similarity against any of the freelancer's skills.
                skill_sim_map: Dict[str, Dict[str, float]] = {cid: {} for cid in candidate_ids}
                if job_skill_ids:
                    cur.execute(
                        """
                        SELECT 
                            us.user_id::text as freelancer_id,
                            js.skill_id::text as job_skill_id,
                            GREATEST(0.0, LEAST(1.0, MAX(1.0 - (fs.embedding <=> js_s.embedding)))) as max_sim
                        FROM job_skills js
                        JOIN skills js_s ON js_s.id = js.skill_id
                        JOIN user_skills us ON true
                        JOIN skills fs ON fs.id = us.skill_id
                        WHERE js.job_id = %s
                          AND us.user_id = ANY(%s::uuid[])
                          AND js_s.embedding IS NOT NULL
                          AND fs.embedding IS NOT NULL
                        GROUP BY us.user_id, js.skill_id;
                        """,
                        (job_uuid, candidate_ids)
                    )
                    for f_id, j_skill_id, max_sim in cur.fetchall():
                        if f_id in skill_sim_map:
                            skill_sim_map[f_id][j_skill_id] = float(max_sim)

                # 6. Compute scores for each candidate
                scored_candidates: List[CandidateScore] = []
                num_job_skills = len(job_skills)
                job_skill_names_lower = {name.lower(): name for name in job_skill_names}

                for candidate in eligible_candidates:
                    f_id = candidate["freelancer_id"]
                    semantic_score = candidate["semantic_score"]

                    # a. Skill overlap score: average of max-pooled similarity across each required job skill
                    if num_job_skills > 0:
                        per_skill_maxes = [
                            skill_sim_map[f_id].get(js_id, 0.0)
                            for js_id in job_skill_ids
                        ]
                        skill_overlap_score = round(sum(per_skill_maxes) / num_job_skills, 4)
                    else:
                        skill_overlap_score = 0.0

                    # b. Lexical overlap score: exact term match ratio
                    f_skill_names = freelancer_skills_map.get(f_id, [])
                    f_skill_names_lower = {s.lower() for s in f_skill_names}
                    matched_skills = [
                        orig_name for lower_name, orig_name in job_skill_names_lower.items()
                        if lower_name in f_skill_names_lower
                    ]
                    if num_job_skills > 0:
                        lexical_overlap_score = round(len(matched_skills) / num_job_skills, 4)
                    else:
                        lexical_overlap_score = 0.0

                    # c. Combined score: weighted sum
                    # Documented initial heuristic weights:
                    # 0.4 * semantic_score + 0.4 * skill_overlap_score + 0.2 * lexical_overlap_score
                    # TODO: replace with trained reranker once real hire/application outcome data accumulates
                    combined_score = round(
                        0.4 * semantic_score + 0.4 * skill_overlap_score + 0.2 * lexical_overlap_score,
                        4
                    )

                    scored_candidates.append(
                        CandidateScore(
                            freelancer_id=f_id,
                            semantic_score=semantic_score,
                            skill_overlap_score=skill_overlap_score,
                            lexical_overlap_score=lexical_overlap_score,
                            combined_score=combined_score,
                            matched_skills=matched_skills
                        )
                    )

                # 7. Order candidates by combined_score DESC, limit top 50
                scored_candidates.sort(key=lambda c: c.combined_score, reverse=True)
                top_candidates = scored_candidates[:top_k]

                return RankingResponse(
                    job_id=job_uuid,
                    job_title=job_title,
                    total_evaluated=len(eligible_candidates),
                    ranked_candidates=top_candidates
                )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ranking candidates for job {job_uuid}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Candidate ranking retrieval error: {str(e)}"
        )
