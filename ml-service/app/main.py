from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.utils.logger import logger
from app.api.routes import health, embeddings, ranking, rag

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown routines."""
    # Startup logic
    logger.info(f"Starting {settings.APP_NAME} in [{settings.ENVIRONMENT}] mode")
    logger.info(f"Allowed CORS origins: {settings.ALLOWED_ORIGINS}")
    yield
    # Shutdown logic
    logger.info(f"Shutting down {settings.APP_NAME}")

def create_application() -> FastAPI:
    """FastAPI application factory."""
    application = FastAPI(
        title=settings.APP_NAME,
        description="HireSmart Machine Learning & AI Microservice",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan
    )

    # Configure CORS Middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API routers
    application.include_router(health.router)
    application.include_router(embeddings.router)
    application.include_router(ranking.router)
    application.include_router(rag.router)

    return application

app = create_application()
