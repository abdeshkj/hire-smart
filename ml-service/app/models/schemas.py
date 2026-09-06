from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# ==========================================
# Health Schemas
# ==========================================
class HealthResponse(BaseModel):
    status: str = Field(default="ok", example="ok")
    service: str = Field(default="hire-smart-ml-service", example="hire-smart-ml-service")
    environment: str = Field(default="development", example="development")


# ==========================================
# Embedding Schemas
# ==========================================
class EmbeddingRequest(BaseModel):
    texts: List[str] = Field(..., min_length=1, description="List of texts to generate embeddings for")
    model: Optional[str] = Field(default=None, description="Optional custom embedding model name")

class EmbeddingResponse(BaseModel):
    model: str = Field(..., description="Embedding model used")
    embeddings: List[List[float]] = Field(..., description="Generated vector embeddings")
    dimensions: int = Field(..., description="Dimensionality of the vector embeddings")


# ==========================================
# Candidate Ranking Schemas
# ==========================================
class CandidateProfile(BaseModel):
    id: str = Field(..., description="Unique candidate identifier")
    name: Optional[str] = Field(default=None, description="Candidate name")
    skills: List[str] = Field(default_factory=list, description="Extracted skills")
    experience_years: Optional[float] = Field(default=0.0, description="Total years of relevant experience")
    resume_text: Optional[str] = Field(default=None, description="Parsed text of candidate resume")

class CandidateScore(BaseModel):
    candidate_id: str
    match_score: float = Field(..., ge=0.0, le=1.0, description="Normalized match score between 0.0 and 1.0")
    skill_alignment: float = Field(..., ge=0.0, le=1.0, description="Skill overlap score")
    relevance_summary: str = Field(..., description="Brief explanation of fit")

class RankingRequest(BaseModel):
    job_description: str = Field(..., min_length=10, description="Target job description")
    required_skills: List[str] = Field(default_factory=list, description="Mandatory required skills")
    candidates: List[CandidateProfile] = Field(..., min_length=1, description="List of candidates to rank")
    top_k: Optional[int] = Field(default=10, description="Number of top candidates to return")

class RankingResponse(BaseModel):
    job_title: Optional[str] = None
    ranked_candidates: List[CandidateScore]
    total_evaluated: int


# ==========================================
# RAG (Retrieval-Augmented Generation) Schemas
# ==========================================
class RetrievedDocument(BaseModel):
    id: str
    content: str
    score: float
    metadata: Dict[str, Any] = Field(default_factory=dict)

class RAGRequest(BaseModel):
    query: str = Field(..., min_length=3, description="Search query or interview question context")
    collection_name: str = Field(default="resumes", description="Target vector collection")
    top_k: int = Field(default=5, ge=1, le=50, description="Number of results to retrieve")

class RAGResponse(BaseModel):
    query: str
    results: List[RetrievedDocument]
    generated_context: Optional[str] = None


# ==========================================
# Generic API Responses
# ==========================================
class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None
