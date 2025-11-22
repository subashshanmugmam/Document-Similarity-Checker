"""
Custom Exceptions Module
Defines all custom exceptions with proper error codes and messages
"""

from typing import Optional, Any, Dict
from fastapi import status


class BaseAppException(Exception):
    """Base exception class for all application exceptions"""
    
    def __init__(
        self,
        message: str,
        error_code: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary"""
        return {
            'error': {
                'code': self.error_code,
                'message': self.message,
                'details': self.details
            }
        }


class ValidationException(BaseAppException):
    """Validation error exception"""
    
    def __init__(
        self,
        message: str,
        error_code: str = "VALIDATION_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details
        )


class FileUploadException(BaseAppException):
    """File upload related exceptions"""
    
    def __init__(
        self,
        message: str,
        error_code: str = "FILE_UPLOAD_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details
        )


class DocumentProcessingException(BaseAppException):
    """Document processing exceptions"""
    
    def __init__(
        self,
        message: str,
        error_code: str = "PROCESSING_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details
        )


class SparkException(BaseAppException):
    """PySpark related exceptions"""
    
    def __init__(
        self,
        message: str,
        error_code: str = "SPARK_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details
        )


class DocumentNotFoundException(BaseAppException):
    """Document not found exception"""
    
    def __init__(
        self,
        message: str = "Document not found",
        document_id: Optional[str] = None
    ):
        details = {'document_id': document_id} if document_id else {}
        super().__init__(
            message=message,
            error_code="DOCUMENT_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details=details
        )


class InsufficientDocumentsException(BaseAppException):
    """Insufficient documents for analysis"""
    
    def __init__(
        self,
        message: str = "Insufficient documents for analysis",
        required: int = 2,
        provided: int = 0
    ):
        super().__init__(
            message=message,
            error_code="INSUFFICIENT_DOCUMENTS",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={'required': required, 'provided': provided}
        )


class InvalidThresholdException(BaseAppException):
    """Invalid similarity threshold"""
    
    def __init__(
        self,
        message: str = "Invalid similarity threshold",
        threshold: Optional[float] = None
    ):
        super().__init__(
            message=message,
            error_code="INVALID_THRESHOLD",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={'threshold': threshold} if threshold else {}
        )


class JobNotFoundException(BaseAppException):
    """Job not found exception"""
    
    def __init__(
        self,
        message: str = "Job not found",
        job_id: Optional[str] = None
    ):
        super().__init__(
            message=message,
            error_code="JOB_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={'job_id': job_id} if job_id else {}
        )


class TimeoutException(BaseAppException):
    """Processing timeout exception"""
    
    def __init__(
        self,
        message: str = "Processing timeout",
        timeout_seconds: Optional[int] = None
    ):
        super().__init__(
            message=message,
            error_code="TIMEOUT_ERROR",
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            details={'timeout_seconds': timeout_seconds} if timeout_seconds else {}
        )


class ConfigurationException(BaseAppException):
    """Configuration error exception"""
    
    def __init__(
        self,
        message: str = "Configuration error",
        config_key: Optional[str] = None
    ):
        super().__init__(
            message=message,
            error_code="CONFIGURATION_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={'config_key': config_key} if config_key else {}
        )


# Export all exceptions
__all__ = [
    'BaseAppException',
    'ValidationException',
    'FileUploadException',
    'DocumentProcessingException',
    'SparkException',
    'DocumentNotFoundException',
    'InsufficientDocumentsException',
    'InvalidThresholdException',
    'JobNotFoundException',
    'TimeoutException',
    'ConfigurationException',
]
