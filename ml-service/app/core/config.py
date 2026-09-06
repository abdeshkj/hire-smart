from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Application settings and environment variable validation."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "HireSmart ML Microservice"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "info"
    ML_SERVICE_PORT: int = Field(default=8000, description="Port on which the service listens")
    
    ALLOWED_ORIGINS: Union[str, List[str]] = "http://localhost:5000,http://localhost:3000"

    # AI & Embeddings
    GEMINI_API_KEY: str = Field(default="your_gemini_api_key_here", description="Google Gemini API Key")
    GEMINI_MODEL: str = "gemini-1.5-flash"
    EMBEDDING_MODEL: str = "models/embedding-001"
    VECTOR_DB_URL: str = Field(default="your_vector_db_url_here", description="Vector database endpoint")

    @field_validator("ALLOWED_ORIGINS", mode="after")
    @classmethod
    def parse_allowed_origins(cls, value: Union[str, List[str]]) -> List[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

settings = Settings()
