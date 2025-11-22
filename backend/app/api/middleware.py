"""
API Middleware
Custom middleware for request/response processing
"""

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
import time
import traceback

from app.core.logging import get_logger
from app.core.config import settings
from app.core.exceptions import BaseAppException

logger = get_logger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all requests and responses"""
    
    async def dispatch(self, request: Request, call_next):
        """Process request and log details"""
        # Generate request ID
        request_id = f"{int(time.time() * 1000)}"
        
        # Log request
        logger.info(
            f"Request started: {request.method} {request.url.path} "
            f"(ID: {request_id})"
        )
        
        start_time = time.time()
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log response
            logger.info(
                f"Request completed: {request.method} {request.url.path} "
                f"status={response.status_code} duration={duration:.3f}s "
                f"(ID: {request_id})"
            )
            
            # Add custom headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = f"{duration:.3f}"
            
            return response
            
        except Exception as e:
            # Log error
            duration = time.time() - start_time
            logger.error(
                f"Request failed: {request.method} {request.url.path} "
                f"error={str(e)} duration={duration:.3f}s "
                f"(ID: {request_id})",
                exc_info=True
            )
            
            # Return error response
            return JSONResponse(
                status_code=500,
                content={
                    "error": {
                        "code": "INTERNAL_ERROR",
                        "message": "Internal server error",
                        "request_id": request_id
                    }
                }
            )


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware to handle exceptions globally"""
    
    async def dispatch(self, request: Request, call_next):
        """Process request with error handling"""
        try:
            response = await call_next(request)
            return response
        except BaseAppException as e:
            # Handle custom exceptions
            logger.error(
                f"Application error: {e.error_code} - {e.message}",
                exc_info=True
            )
            
            return JSONResponse(
                status_code=e.status_code,
                content=e.to_dict()
            )
        except Exception as e:
            # Handle unexpected exceptions
            logger.error(
                f"Unexpected error: {str(e)}",
                exc_info=True
            )
            
            # Don't expose internal errors in production
            if settings.is_production():
                error_message = "An unexpected error occurred"
            else:
                error_message = str(e)
            
            return JSONResponse(
                status_code=500,
                content={
                    "error": {
                        "code": "INTERNAL_ERROR",
                        "message": error_message
                    }
                }
            )


def setup_cors(app):
    """
    Configure CORS middleware
    
    Args:
        app: FastAPI application instance
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    logger.info(f"CORS configured: origins={settings.cors_origins}")


def setup_middleware(app):
    """
    Set up all middleware
    
    Args:
        app: FastAPI application instance
    """
    # Add custom middleware
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(ErrorHandlingMiddleware)
    
    # Configure CORS
    setup_cors(app)
    
    logger.info("Middleware configured successfully")


# Export
__all__ = [
    'RequestLoggingMiddleware',
    'ErrorHandlingMiddleware',
    'setup_cors',
    'setup_middleware'
]
