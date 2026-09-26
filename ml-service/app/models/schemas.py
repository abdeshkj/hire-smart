from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field, ConfigDict

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

class ProfileFields(BaseModel):
    model_config = ConfigDict(extra="allow")
    fullName: Optional[str] = None
    full_name: Optional[str] = None
    bio: Optional[str] = None
    description: Optional[str] = None
    experienceLevel: Optional[str] = None
    experience_level: Optional[str] = None
    yearsOfExperience: Optional[Union[int, float, str]] = None
    years_of_experience: Optional[Union[int, float, str]] = None
    skills: Optional[List[Union[str, dict]]] = Field(default_factory=list)

class ProfileEmbeddingRequest(BaseModel):
    userId: str = Field(..., min_length=1, description="ID of user profile to embed")
    profileFields: ProfileFields

class JobEmbeddingRequest(BaseModel):
    model_config = ConfigDict(extra="allow")
    jobId: str = Field(..., min_length=1, description="ID of job to embed")
    title: str = Field(..., min_length=1, description="Job title")
    description: Optional[str] = Field(default="", description="Job description")
    experienceRequirement: Optional[str] = None
    experience_requirement: Optional[str] = None
    skills: Optional[List[Union[str, dict]]] = Field(default_factory=list)

class SkillEmbeddingRequest(BaseModel):
    model_config = ConfigDict(extra="allow")
    skillId: str = Field(..., min_length=1, description="ID of skill to embed")
    name: str = Field(..., min_length=1, description="Skill name")

class EmbeddingWriteResponse(BaseModel):
    success: bool = True
    dimensions: int = 384


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
    model_config = ConfigDict(extra="allow")
    freelancer_id: str
    semantic_score: float
    skill_overlap_score: float
    lexical_overlap_score: float
    combined_score: float
    matched_skills: List[str] = Field(default_factory=list)

class RankingRequest(BaseModel):
    model_config = ConfigDict(extra="allow")
    jobId: Optional[str] = None
    job_id: Optional[str] = None
    top_k: Optional[int] = Field(default=50, ge=1, le=100)
    job_description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    candidates: Optional[List[CandidateProfile]] = None

class RankingResponse(BaseModel):
    job_id: str
    job_title: Optional[str] = None
    total_evaluated: int
    ranked_candidates: List[CandidateScore]


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
