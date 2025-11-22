"""
Data Models (Pydantic Schemas)
Defines request/response models with validation
"""

from pydantic import BaseModel, Field, validator, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class JobStatus(str, Enum):
    """Job status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentStatus(str, Enum):
    """Document status enumeration"""
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    ERROR = "error"


# Request Models

class AnalysisConfig(BaseModel):
    """Analysis configuration request model"""
    threshold: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Similarity threshold for flagging documents"
    )
    include_all_pairs: bool = Field(
        default=True,
        description="Include all pairs or only those above threshold"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "threshold": 0.7,
                "include_all_pairs": True
            }
        }


class AnalysisRequest(BaseModel):
    """Analysis request model"""
    document_ids: Optional[List[str]] = Field(
        default=None,
        description="Specific document IDs to analyze (null for all)"
    )
    config: AnalysisConfig = Field(
        default_factory=AnalysisConfig,
        description="Analysis configuration"
    )
    
    @field_validator('document_ids')
    @classmethod
    def validate_document_ids(cls, v):
        """Validate document IDs list"""
        if v is not None and len(v) < 2:
            raise ValueError("At least 2 documents required for analysis")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "document_ids": None,
                "config": {
                    "threshold": 0.7,
                    "include_all_pairs": True
                }
            }
        }


# Response Models

class DocumentInfo(BaseModel):
    """Document information model"""
    doc_id: str = Field(..., description="Unique document identifier")
    filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., description="File size in bytes")
    upload_timestamp: datetime = Field(..., description="Upload timestamp")
    status: DocumentStatus = Field(default=DocumentStatus.UPLOADED)
    content_preview: Optional[str] = Field(
        default=None,
        description="First 100 characters of content"
    )
    word_count: Optional[int] = Field(default=None, description="Number of words")
    
    class Config:
        json_schema_extra = {
            "example": {
                "doc_id": "abc123",
                "filename": "document1.txt",
                "file_size": 2048,
                "upload_timestamp": "2024-01-01T12:00:00",
                "status": "uploaded",
                "content_preview": "This is a sample document...",
                "word_count": 150
            }
        }


class SimilarPair(BaseModel):
    """Similar document pair model"""
    doc1: str = Field(..., description="First document name")
    doc2: str = Field(..., description="Second document name")
    doc1_id: str = Field(..., description="First document ID")
    doc2_id: str = Field(..., description="Second document ID")
    similarity: float = Field(..., ge=0.0, le=1.0, description="Similarity score")
    percentage: str = Field(..., description="Similarity percentage")
    flagged: bool = Field(..., description="Whether above threshold")
    
    class Config:
        json_schema_extra = {
            "example": {
                "doc1": "file1.txt",
                "doc2": "file2.txt",
                "doc1_id": "abc123",
                "doc2_id": "def456",
                "similarity": 0.85,
                "percentage": "85%",
                "flagged": True
            }
        }


class AnalysisStatistics(BaseModel):
    """Analysis statistics model"""
    total_documents: int = Field(..., description="Total documents analyzed")
    total_comparisons: int = Field(..., description="Total pairwise comparisons")
    flagged_pairs: int = Field(..., description="Pairs above threshold")
    avg_similarity: float = Field(..., description="Average similarity score")
    max_similarity: float = Field(..., description="Maximum similarity score")
    min_similarity: float = Field(..., description="Minimum similarity score")
    processing_time: str = Field(..., description="Processing time")
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_documents": 10,
                "total_comparisons": 45,
                "flagged_pairs": 5,
                "avg_similarity": 0.42,
                "max_similarity": 0.89,
                "min_similarity": 0.12,
                "processing_time": "2.5s"
            }
        }


class AnalysisResult(BaseModel):
    """Analysis result model"""
    job_id: str = Field(..., description="Job identifier")
    status: JobStatus = Field(..., description="Job status")
    total_documents: int = Field(..., description="Total documents analyzed")
    total_comparisons: int = Field(..., description="Total comparisons performed")
    similar_pairs: List[SimilarPair] = Field(
        default_factory=list,
        description="List of similar document pairs"
    )
    similarity_matrix: List[List[float]] = Field(
        default_factory=list,
        description="Similarity matrix"
    )
    document_names: List[str] = Field(
        default_factory=list,
        description="Document names (for matrix mapping)"
    )
    statistics: Optional[AnalysisStatistics] = Field(
        default=None,
        description="Analysis statistics"
    )
    error_message: Optional[str] = Field(
        default=None,
        description="Error message if failed"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Job creation time"
    )
    completed_at: Optional[datetime] = Field(
        default=None,
        description="Job completion time"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_abc123",
                "status": "completed",
                "total_documents": 10,
                "total_comparisons": 45,
                "similar_pairs": [
                    {
                        "doc1": "file1.txt",
                        "doc2": "file2.txt",
                        "doc1_id": "abc123",
                        "doc2_id": "def456",
                        "similarity": 0.85,
                        "percentage": "85%",
                        "flagged": True
                    }
                ],
                "similarity_matrix": [[1.0, 0.85], [0.85, 1.0]],
                "document_names": ["file1.txt", "file2.txt"],
                "statistics": {
                    "total_documents": 10,
                    "total_comparisons": 45,
                    "flagged_pairs": 5,
                    "avg_similarity": 0.42,
                    "max_similarity": 0.89,
                    "min_similarity": 0.12,
                    "processing_time": "2.5s"
                },
                "created_at": "2024-01-01T12:00:00",
                "completed_at": "2024-01-01T12:00:05"
            }
        }


class DocumentListResponse(BaseModel):
    """Document list response model"""
    documents: List[DocumentInfo] = Field(..., description="List of documents")
    total: int = Field(..., description="Total number of documents")
    
    class Config:
        json_schema_extra = {
            "example": {
                "documents": [
                    {
                        "doc_id": "abc123",
                        "filename": "document1.txt",
                        "file_size": 2048,
                        "upload_timestamp": "2024-01-01T12:00:00",
                        "status": "uploaded",
                        "word_count": 150
                    }
                ],
                "total": 1
            }
        }


class UploadResponse(BaseModel):
    """File upload response model"""
    message: str = Field(..., description="Success message")
    documents: List[DocumentInfo] = Field(..., description="Uploaded documents info")
    total_uploaded: int = Field(..., description="Total files uploaded")
    failed: List[Dict[str, str]] = Field(
        default_factory=list,
        description="Failed uploads with reasons"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Files uploaded successfully",
                "documents": [
                    {
                        "doc_id": "abc123",
                        "filename": "document1.txt",
                        "file_size": 2048,
                        "upload_timestamp": "2024-01-01T12:00:00",
                        "status": "uploaded",
                        "word_count": 150
                    }
                ],
                "total_uploaded": 1,
                "failed": []
            }
        }


class DeleteResponse(BaseModel):
    """Delete response model"""
    message: str = Field(..., description="Success message")
    deleted_count: int = Field(..., description="Number of documents deleted")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Documents deleted successfully",
                "deleted_count": 1
            }
        }


class HealthResponse(BaseModel):
    """Health check response model"""
    status: str = Field(..., description="Service status")
    version: str = Field(..., description="Application version")
    spark_status: str = Field(..., description="Spark session status")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Check timestamp"
    )
    uptime: Optional[str] = Field(default=None, description="Service uptime")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "spark_status": "running",
                "timestamp": "2024-01-01T12:00:00",
                "uptime": "2h 30m"
            }
        }


class ErrorResponse(BaseModel):
    """Error response model"""
    error: Dict[str, Any] = Field(..., description="Error details")
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid input provided",
                    "details": {}
                }
            }
        }


# Export all models
__all__ = [
    'JobStatus',
    'DocumentStatus',
    'AnalysisConfig',
    'AnalysisRequest',
    'DocumentInfo',
    'SimilarPair',
    'AnalysisStatistics',
    'AnalysisResult',
    'DocumentListResponse',
    'UploadResponse',
    'DeleteResponse',
    'HealthResponse',
    'ErrorResponse',
]
