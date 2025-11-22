"""
Core Configuration Module
Handles all application settings with validation and type safety
"""

from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import List, Optional
from pathlib import Path
import os


class Settings(BaseSettings):
    """Application settings with validation"""
    
    # Application Settings
    app_name: str = Field(default="Document Similarity Checker", env="APP_NAME")
    app_version: str = Field(default="1.0.0", env="APP_VERSION")
    debug: bool = Field(default=True, env="DEBUG")
    environment: str = Field(default="development", env="ENVIRONMENT")
    
    # Server Configuration
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT", ge=1000, le=65535)
    workers: int = Field(default=4, env="WORKERS", ge=1, le=16)
    
    # CORS Settings
    cors_origins: List[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        env="CORS_ORIGINS"
    )
    
    # File Upload Settings
    max_upload_size: int = Field(default=52428800, env="MAX_UPLOAD_SIZE")  # 50MB
    allowed_extensions: List[str] = Field(
        default=[".txt", ".pdf"],
        env="ALLOWED_EXTENSIONS"
    )
    upload_dir: str = Field(default="uploads", env="UPLOAD_DIR")
    max_files_per_upload: int = Field(default=50, env="MAX_FILES_PER_UPLOAD", ge=2, le=100)
    
    # Spark Configuration
    spark_app_name: str = Field(default="DocumentSimilarity", env="SPARK_APP_NAME")
    spark_master: str = Field(default="local[*]", env="SPARK_MASTER")
    spark_driver_memory: str = Field(default="4g", env="SPARK_DRIVER_MEMORY")
    spark_executor_memory: str = Field(default="4g", env="SPARK_EXECUTOR_MEMORY")
    spark_max_result_size: str = Field(default="2g", env="SPARK_MAX_RESULT_SIZE")
    
    # Similarity Settings
    default_similarity_threshold: float = Field(
        default=0.7,
        env="DEFAULT_SIMILARITY_THRESHOLD",
        ge=0.0,
        le=1.0
    )
    min_similarity_threshold: float = Field(
        default=0.5,
        env="MIN_SIMILARITY_THRESHOLD",
        ge=0.0,
        le=1.0
    )
    max_similarity_threshold: float = Field(
        default=1.0,
        env="MAX_SIMILARITY_THRESHOLD",
        ge=0.0,
        le=1.0
    )
    
    # Processing Settings
    cleanup_after_hours: int = Field(default=24, env="CLEANUP_AFTER_HOURS", ge=1)
    max_processing_time: int = Field(default=300, env="MAX_PROCESSING_TIME", ge=60)
    
    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_file: str = Field(default="logs/app.log", env="LOG_FILE")
    log_max_bytes: int = Field(default=10485760, env="LOG_MAX_BYTES")  # 10MB
    log_backup_count: int = Field(default=5, env="LOG_BACKUP_COUNT")
    
    # Security
    api_key_enabled: bool = Field(default=False, env="API_KEY_ENABLED")
    api_key: Optional[str] = Field(default=None, env="API_KEY")
    
    @validator('upload_dir')
    def create_upload_dir(cls, v):
        """Ensure upload directory exists"""
        Path(v).mkdir(parents=True, exist_ok=True)
        return v
    
    @validator('log_file')
    def create_log_dir(cls, v):
        """Ensure log directory exists"""
        Path(v).parent.mkdir(parents=True, exist_ok=True)
        return v
    
    @validator('cors_origins', pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list"""
        if isinstance(v, str):
            # Remove brackets and quotes, then split
            v = v.strip('[]').replace('"', '').replace("'", '')
            return [origin.strip() for origin in v.split(',')]
        return v
    
    @validator('allowed_extensions', pre=True)
    def parse_allowed_extensions(cls, v):
        """Parse allowed extensions from string or list"""
        if isinstance(v, str):
            v = v.strip('[]').replace('"', '').replace("'", '')
            return [ext.strip() for ext in v.split(',')]
        return v
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = False
    
    def get_upload_path(self) -> Path:
        """Get absolute path to upload directory"""
        return Path(self.upload_dir).absolute()
    
    def get_log_path(self) -> Path:
        """Get absolute path to log file"""
        return Path(self.log_file).absolute()
    
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.environment.lower() == "production"
    
    def display_settings(self) -> dict:
        """Get sanitized settings for display"""
        settings_dict = self.dict()
        # Hide sensitive information
        if 'api_key' in settings_dict:
            settings_dict['api_key'] = '***hidden***' if settings_dict['api_key'] else None
        return settings_dict


# Global settings instance
settings = Settings()


# Configuration constants
class AppConstants:
    """Application-wide constants"""
    
    # File types
    TEXT_MIME_TYPE = "text/plain"
    PDF_MIME_TYPE = "application/pdf"
    
    # Status codes
    STATUS_PENDING = "pending"
    STATUS_PROCESSING = "processing"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED = "failed"
    
    # Error codes
    ERR_FILE_TOO_LARGE = "FILE_TOO_LARGE"
    ERR_INVALID_FILE_TYPE = "INVALID_FILE_TYPE"
    ERR_NO_FILES = "NO_FILES_PROVIDED"
    ERR_PROCESSING_FAILED = "PROCESSING_FAILED"
    ERR_INSUFFICIENT_DOCUMENTS = "INSUFFICIENT_DOCUMENTS"
    ERR_INVALID_THRESHOLD = "INVALID_THRESHOLD"
    
    # Validation
    MIN_DOCUMENTS_FOR_ANALYSIS = 2
    MAX_FILENAME_LENGTH = 255


# Export settings and constants
__all__ = ['settings', 'Settings', 'AppConstants']
