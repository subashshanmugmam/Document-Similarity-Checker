"""
Main FastAPI Application
Entry point for the Document Similarity Checker API
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import uvicorn

from app.core.config import settings
from app.core.logging import get_logger
from app.core.exceptions import BaseAppException
from app.api import router, setup_middleware
from app.services.spark_service import spark_service

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events
    
    Handles startup and shutdown operations
    """
    # Startup
    logger.info("=" * 60)
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Debug mode: {settings.debug}")
    logger.info("=" * 60)
    
    # Initialize Spark session
    try:
        spark = spark_service.get_session()
        spark_info = spark_service.get_spark_info()
        logger.info(f"Spark initialized: {spark_info}")
    except Exception as e:
        logger.error(f"Failed to initialize Spark: {str(e)}")
        # Continue anyway - will fail on first request
    
    logger.info(f"API server ready at http://{settings.host}:{settings.port}")
    logger.info(f"API docs at http://{settings.host}:{settings.port}/docs")
    logger.info("=" * 60)
    
    yield
    
    # Shutdown
    logger.info("=" * 60)
    logger.info("Shutting down application...")
    
    # Stop Spark session
    try:
        spark_service.stop_session()
        logger.info("Spark session stopped")
    except Exception as e:
        logger.error(f"Error stopping Spark: {str(e)}")
    
    logger.info("Application shutdown complete")
    logger.info("=" * 60)


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    **Document Similarity Checker API**
    
    A powerful document similarity detection system using PySpark and TF-IDF algorithms.
    
    ## Features
    
    * **Document Upload**: Upload .txt and .pdf files for analysis
    * **Similarity Analysis**: Detect similar documents using cosine similarity
    * **TF-IDF Processing**: Advanced text feature extraction
    * **Async Processing**: Background job processing for large datasets
    * **Real-time Results**: Track analysis progress and retrieve results
    
    ## Workflow
    
    1. **Upload Documents**: POST to `/api/upload`
    2. **Start Analysis**: POST to `/api/analyze`
    3. **Check Results**: GET `/api/results/{job_id}`
    
    ## Technologies
    
    - **Backend**: FastAPI + PySpark
    - **NLP**: TF-IDF, Cosine Similarity
    - **Processing**: Distributed computing with Apache Spark
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Set up middleware (CORS, logging, error handling)
setup_middleware(app)

# Include API routes
app.include_router(router)


# Exception handlers
@app.exception_handler(BaseAppException)
async def custom_exception_handler(request: Request, exc: BaseAppException):
    """Handle custom application exceptions"""
    logger.error(
        f"Application exception: {exc.error_code} - {exc.message}",
        exc_info=True
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict()
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors"""
    logger.warning(f"Validation error: {exc.errors()}")
    
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": exc.errors()
            }
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    # Don't expose internal errors in production
    if settings.is_production():
        error_message = "An unexpected error occurred"
    else:
        error_message = str(exc)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": error_message
            }
        }
    )


# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """
    Root endpoint - API information
    """
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs",
        "health": "/api/health"
    }


def main():
    """
    Main entry point for running the application
    """
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
        access_log=True
    )


if __name__ == "__main__":
    main()
