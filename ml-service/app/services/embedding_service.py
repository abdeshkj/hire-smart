import hashlib
import math
from typing import List, Dict, Any
from app.utils.logger import logger
from app.core.config import settings

# Load model safely with fallback if PyTorch DLL is blocked by OS security policies
_model = None
try:
    from sentence_transformers import SentenceTransformer
    logger.info(f"Loading embedding model '{settings.EMBEDDING_MODEL}' at startup...")
    _model = SentenceTransformer(settings.EMBEDDING_MODEL)
    logger.info(f"Embedding model '{settings.EMBEDDING_MODEL}' loaded and ready for inference.")
except Exception as e:
    logger.warning(
        f"[WARNING] Could not load SentenceTransformer / PyTorch ({e}). "
        "Operating in fallback embedding mode."
    )

class EmbeddingService:
    """Service handling text embedding generation and text composition."""

    def __init__(self, model = None):
        self.model = model if model is not None else _model

    def generate_embedding(self, text: str) -> List[float]:
        """
        Encode text into a 384-dim vector, returning a plain Python list of floats.
        Raises ValueError on empty or whitespace-only text.
        """
        if not text or not text.strip():
            raise ValueError("Input text cannot be empty or whitespace-only.")
        
        if self.model is not None:
            vector = self.model.encode(text.strip())
            return [float(x) for x in vector.tolist()]
        
        # Deterministic 384-dim normalized fallback vector (avoids crash when Windows blocks torch.dll)
        h = hashlib.sha256(text.strip().encode("utf-8")).digest()
        vec = [((h[i % len(h)] + i * 31) % 256 - 128) / 128.0 for i in range(384)]
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [round(x / norm, 6) for x in vec]

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Encode multiple texts into a list of 384-dim vectors."""
        if not texts:
            return []
        for t in texts:
            if not t or not t.strip():
                raise ValueError("Input text cannot be empty or whitespace-only.")
        if self.model is not None:
            vectors = self.model.encode([t.strip() for t in texts])
            return [[float(x) for x in v.tolist()] for v in vectors]
        return [self.generate_embedding(t) for t in texts]

    def build_profile_text(self, profile: Dict[str, Any]) -> str:
        """
        Concatenate profile fields into a single text blob for embedding.
        Combines full_name (if present), bio, description, experience_level,
        years_of_experience, and any skills passed in.
        """
        parts = []

        full_name = profile.get("fullName") or profile.get("full_name")
        if full_name and str(full_name).strip():
            parts.append(f"Name: {str(full_name).strip()}")

        bio = profile.get("bio")
        if bio and str(bio).strip():
            parts.append(f"Bio: {str(bio).strip()}")

        description = profile.get("description")
        if description and str(description).strip():
            parts.append(f"Description: {str(description).strip()}")

        experience_level = profile.get("experienceLevel") or profile.get("experience_level")
        if experience_level and str(experience_level).strip():
            parts.append(f"Experience Level: {str(experience_level).strip()}")

        years_of_experience = profile.get("yearsOfExperience") or profile.get("years_of_experience")
        if years_of_experience is not None and str(years_of_experience).strip():
            parts.append(f"Years of Experience: {str(years_of_experience).strip()}")

        skills = profile.get("skills")
        if skills:
            skill_names = []
            for s in skills:
                if isinstance(s, dict):
                    name = s.get("name") or s.get("skill_name") or s.get("label")
                    if name and str(name).strip():
                        skill_names.append(str(name).strip())
                elif isinstance(s, str) and s.strip():
                    skill_names.append(s.strip())
            if skill_names:
                parts.append(f"Skills: {', '.join(skill_names)}")

        composed_text = " | ".join(parts).strip()
        if not composed_text:
            raise ValueError("Profile text cannot be empty. At least one profile field must be provided.")
        return composed_text

    def build_job_text(self, job: Dict[str, Any]) -> str:
        """
        Concatenate title, description, experience_requirement, and skill names
        into a single text blob for embedding.
        """
        parts = []

        title = job.get("title")
        if title and str(title).strip():
            parts.append(f"Title: {str(title).strip()}")

        description = job.get("description")
        if description and str(description).strip():
            parts.append(f"Description: {str(description).strip()}")

        experience_requirement = job.get("experienceRequirement") or job.get("experience_requirement")
        if experience_requirement and str(experience_requirement).strip():
            parts.append(f"Experience Requirement: {str(experience_requirement).strip()}")

        skills = job.get("skills")
        if skills:
            skill_names = []
            for s in skills:
                if isinstance(s, dict):
                    name = s.get("name") or s.get("skill_name") or s.get("label")
                    if name and str(name).strip():
                        skill_names.append(str(name).strip())
                elif isinstance(s, str) and s.strip():
                    skill_names.append(s.strip())
            if skill_names:
                parts.append(f"Required Skills: {', '.join(skill_names)}")

        composed_text = " | ".join(parts).strip()
        if not composed_text:
            raise ValueError("Job text cannot be empty. At least one job field must be provided.")
        return composed_text

embedding_service = EmbeddingService()
