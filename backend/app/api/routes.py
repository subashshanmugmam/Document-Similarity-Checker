"""
API Routes
FastAPI endpoint definitions
"""

from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse

from app.core.logging import get_logger
from app.core.exceptions import BaseAppException
from app.models.schemas import (
    AnalysisRequest,
    AnalysisResult,
    DocumentListResponse,
    UploadResponse,
    DeleteResponse,
    HealthResponse,
    ErrorResponse
)
from app.services.document_service import document_service
from app.services.analysis_service import analysis_service
from app.services.spark_service import spark_service
from app.core.config import settings
from datetime import datetime

logger = get_logger(__name__)

# Create router
router = APIRouter(prefix="/api", tags=["api"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    description="Check API and Spark service health"
)
async def health_check():
    """Health check endpoint"""
    try:
        spark_info = spark_service.get_spark_info()
        spark_status = spark_info.get('status', 'unknown')
        
        return HealthResponse(
            status="healthy" if spark_status == "running" else "degraded",
            version=settings.app_version,
            spark_status=spark_status,
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return HealthResponse(
            status="unhealthy",
            version=settings.app_version,
            spark_status="error",
            timestamp=datetime.utcnow()
        )


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Documents",
    description="Upload one or more documents (.txt, .pdf)"
)
async def upload_documents(
    files: List[UploadFile] = File(..., description="Documents to upload")
):
    """
    Upload documents for analysis
    
    - Accepts .txt and .pdf files
    - Maximum file size: 50MB per file
    - Maximum files per upload: 50
    """
    try:
        logger.info(f"Upload request received: {len(files)} files")
        
        successful, failed = await document_service.upload_documents(files)
        
        return UploadResponse(
            message=f"Successfully uploaded {len(successful)} document(s)",
            documents=successful,
            total_uploaded=len(successful),
            failed=failed
        )
    except BaseAppException as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(
            status_code=e.status_code,
            detail=e.to_dict()
        )
    except Exception as e:
        logger.error(f"Unexpected upload error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "UPLOAD_ERROR", "message": str(e)}}
        )


@router.get(
    "/documents",
    response_model=DocumentListResponse,
    summary="List Documents",
    description="Get list of all uploaded documents"
)
async def list_documents():
    """
    List all uploaded documents
    
    Returns document information including:
    - Document ID
    - Filename
    - File size
    - Upload timestamp
    - Status
    """
    try:
        documents = document_service.list_documents()
        
        return DocumentListResponse(
            documents=documents,
            total=len(documents)
        )
    except Exception as e:
        logger.error(f"Failed to list documents: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "LIST_ERROR", "message": str(e)}}
        )


@router.delete(
    "/documents/{doc_id}",
    response_model=DeleteResponse,
    summary="Delete Document",
    description="Delete a specific document by ID"
)
async def delete_document(doc_id: str):
    """
    Delete a specific document
    
    - Removes the file from storage
    - Removes metadata
    - Cannot be undone
    """
    try:
        document_service.delete_document(doc_id)
        
        return DeleteResponse(
            message=f"Document deleted successfully",
            deleted_count=1
        )
    except BaseAppException as e:
        logger.error(f"Delete failed: {str(e)}")
        raise HTTPException(
            status_code=e.status_code,
            detail=e.to_dict()
        )
    except Exception as e:
        logger.error(f"Unexpected delete error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "DELETE_ERROR", "message": str(e)}}
        )


@router.delete(
    "/documents",
    response_model=DeleteResponse,
    summary="Delete All Documents",
    description="Delete all uploaded documents"
)
async def delete_all_documents():
    """
    Delete all documents
    
    - Removes all files from storage
    - Removes all metadata
    - Cannot be undone
    """
    try:
        count = document_service.delete_all_documents()
        
        return DeleteResponse(
            message=f"All documents deleted successfully",
            deleted_count=count
        )
    except Exception as e:
        logger.error(f"Failed to delete all documents: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "DELETE_ALL_ERROR", "message": str(e)}}
        )


@router.post(
    "/analyze",
    response_model=dict,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Analyze Documents",
    description="Start document similarity analysis"
)
async def analyze_documents(request: AnalysisRequest):
    """
    Trigger document similarity analysis
    
    Analysis is performed asynchronously. Use the returned job_id
    to check the status and retrieve results via /api/results/{job_id}
    
    Request body:
    - document_ids: List of specific document IDs (null for all documents)
    - config:
        - threshold: Similarity threshold for flagging (0.5-1.0)
        - include_all_pairs: Include all pairs or only flagged ones
    
    Returns:
    - job_id: Use this to check analysis status
    - message: Confirmation message
    """
    try:
        logger.info(
            f"Analysis request: docs={request.document_ids}, "
            f"threshold={request.config.threshold}"
        )
        
        job_id = await analysis_service.analyze_documents(
            request.document_ids,
            request.config
        )
        
        return {
            "job_id": job_id,
            "message": "Analysis started",
            "status": "processing"
        }
    except BaseAppException as e:
        logger.error(f"Analysis request failed: {str(e)}")
        raise HTTPException(
            status_code=e.status_code,
            detail=e.to_dict()
        )
    except Exception as e:
        logger.error(f"Unexpected analysis error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "ANALYSIS_ERROR", "message": str(e)}}
        )


@router.get(
    "/results/{job_id}",
    response_model=AnalysisResult,
    summary="Get Analysis Results",
    description="Retrieve analysis results by job ID"
)
async def get_results(job_id: str):
    """
    Get analysis results
    
    Returns:
    - Job status (pending, processing, completed, failed)
    - Similar document pairs
    - Similarity matrix
    - Statistics
    
    Status values:
    - pending: Job created, not started
    - processing: Analysis in progress
    - completed: Analysis finished successfully
    - failed: Analysis failed (check error_message)
    """
    try:
        result = analysis_service.get_job_result(job_id)
        return result
    except BaseAppException as e:
        logger.error(f"Failed to get results: {str(e)}")
        raise HTTPException(
            status_code=e.status_code,
            detail=e.to_dict()
        )
    except Exception as e:
        logger.error(f"Unexpected error getting results: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "RESULTS_ERROR", "message": str(e)}}
        )


@router.get(
    "/jobs",
    response_model=List[AnalysisResult],
    summary="List All Jobs",
    description="Get list of all analysis jobs"
)
async def list_jobs():
    """
    List all analysis jobs
    
    Returns jobs sorted by creation time (newest first)
    """
    try:
        jobs = analysis_service.list_jobs()
        return jobs
    except Exception as e:
        logger.error(f"Failed to list jobs: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "LIST_JOBS_ERROR", "message": str(e)}}
        )


# Export router
__all__ = ['router']
