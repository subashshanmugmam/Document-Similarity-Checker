"""
Analysis Service
Manages analysis jobs and coordinates document processing with similarity computation
"""

from typing import Optional, Dict, List
from datetime import datetime
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor

from app.core.config import settings
from app.core.logging import get_logger
from app.core.exceptions import JobNotFoundException, DocumentProcessingException
from app.models.schemas import (
    AnalysisResult,
    AnalysisConfig,
    JobStatus,
    SimilarPair,
    AnalysisStatistics
)
from app.services.document_processor import DocumentProcessor
from app.services.similarity_service import SimilarityComputer
from app.utils.helpers import IDGenerator, TimeFormatter, ValidationHelper

logger = get_logger(__name__)


class AnalysisService:
    """Manages document similarity analysis jobs"""
    
    def __init__(self, document_service=None):
        """Initialize analysis service"""
        # Use provided document_service or create new instance
        if document_service is None:
            from app.services.document_service import DocumentService
            self.document_service = DocumentService()
        else:
            self.document_service = document_service
        self.document_processor = DocumentProcessor()
        self.similarity_computer = SimilarityComputer()
        self._jobs: Dict[str, AnalysisResult] = {}
        self._executor = ThreadPoolExecutor(max_workers=2)
    
    def create_job(
        self,
        document_ids: Optional[List[str]],
        config: AnalysisConfig
    ) -> str:
        """
        Create a new analysis job
        
        Args:
            document_ids: Specific document IDs or None for all
            config: Analysis configuration
        
        Returns:
            Job ID
        """
        # Validate threshold
        ValidationHelper.validate_threshold(config.threshold)
        
        # Generate job ID
        job_id = IDGenerator.generate_job_id()
        
        # Get document count
        if document_ids:
            doc_count = len(document_ids)
        else:
            doc_count = self.document_service.get_document_count()
        
        # Validate document count
        ValidationHelper.validate_document_count(doc_count)
        
        # Create job result placeholder
        job_result = AnalysisResult(
            job_id=job_id,
            status=JobStatus.PENDING,
            total_documents=doc_count,
            total_comparisons=0,
            similar_pairs=[],
            similarity_matrix=[],
            document_names=[],
            created_at=datetime.utcnow()
        )
        
        self._jobs[job_id] = job_result
        
        logger.info(
            f"Analysis job created: {job_id} "
            f"(documents={doc_count}, threshold={config.threshold})"
        )
        
        return job_id
    
    def get_job_result(self, job_id: str) -> AnalysisResult:
        """
        Get job result
        
        Args:
            job_id: Job ID
        
        Returns:
            AnalysisResult
        
        Raises:
            JobNotFoundException: If job not found
        """
        if job_id not in self._jobs:
            raise JobNotFoundException(
                f"Job not found: {job_id}",
                job_id=job_id
            )
        
        return self._jobs[job_id]
    
    def _update_job_status(
        self,
        job_id: str,
        status: JobStatus,
        **kwargs
    ) -> None:
        """Update job status"""
        if job_id in self._jobs:
            job = self._jobs[job_id]
            job.status = status
            
            for key, value in kwargs.items():
                if hasattr(job, key):
                    setattr(job, key, value)
    
    def _perform_analysis(
        self,
        job_id: str,
        document_ids: Optional[List[str]],
        config: AnalysisConfig
    ) -> None:
        """
        Perform the actual analysis (runs in background)
        
        Args:
            job_id: Job ID
            document_ids: Document IDs to analyze
            config: Analysis configuration
        """
        try:
            logger.info(f"Starting analysis for job {job_id}")
            start_time = time.time()
            
            # Update status
            self._update_job_status(job_id, JobStatus.PROCESSING)
            
            # Step 1: Get documents
            documents = self.document_service.get_documents_for_analysis(document_ids)
            logger.info(f"Retrieved {len(documents)} documents for analysis")
            
            # Step 2: Process documents (TF-IDF)
            features_df, pipeline_model = self.document_processor.process_documents(documents)
            logger.info("Document processing completed")
            
            # Step 3: Compute similarities
            similarities = self.similarity_computer.compute_pairwise_similarities(
                features_df,
                threshold=config.threshold,
                include_all_pairs=config.include_all_pairs
            )
            logger.info(f"Computed {len(similarities)} similarity pairs")
            
            # Step 4: Create similarity matrix
            matrix, doc_names = self.similarity_computer.create_similarity_matrix(
                features_df
            )
            logger.info(f"Created similarity matrix: {len(matrix)}x{len(matrix)}")
            
            # Step 5: Compute statistics
            processing_time = time.time() - start_time
            statistics = self.similarity_computer.compute_statistics(
                similarities,
                len(documents),
                processing_time,
                config.threshold
            )
            
            # Step 6: Format results
            similar_pairs = self.similarity_computer.format_similar_pairs(similarities)
            
            # Update job with results
            self._update_job_status(
                job_id,
                JobStatus.COMPLETED,
                total_documents=len(documents),
                total_comparisons=len(similarities),
                similar_pairs=similar_pairs,
                similarity_matrix=matrix,
                document_names=doc_names,
                statistics=statistics,
                completed_at=datetime.utcnow()
            )
            
            logger.info(
                f"Analysis completed for job {job_id}: "
                f"time={TimeFormatter.format_duration(processing_time)}, "
                f"pairs={len(similar_pairs)}"
            )
            
        except Exception as e:
            logger.error(f"Analysis failed for job {job_id}: {str(e)}", exc_info=True)
            
            # Update job with error
            self._update_job_status(
                job_id,
                JobStatus.FAILED,
                error_message=str(e),
                completed_at=datetime.utcnow()
            )
    
    async def analyze_documents(
        self,
        document_ids: Optional[List[str]],
        config: AnalysisConfig
    ) -> str:
        """
        Start document similarity analysis
        
        Args:
            document_ids: Specific document IDs or None for all
            config: Analysis configuration
        
        Returns:
            Job ID
        """
        # Create job
        job_id = self.create_job(document_ids, config)
        
        # Start analysis in background
        loop = asyncio.get_event_loop()
        loop.run_in_executor(
            self._executor,
            self._perform_analysis,
            job_id,
            document_ids,
            config
        )
        
        logger.info(f"Analysis started in background: {job_id}")
        
        return job_id
    
    def list_jobs(self) -> List[AnalysisResult]:
        """
        List all jobs
        
        Returns:
            List of AnalysisResult
        """
        jobs = list(self._jobs.values())
        # Sort by creation time (newest first)
        jobs.sort(key=lambda x: x.created_at, reverse=True)
        return jobs
    
    def delete_job(self, job_id: str) -> None:
        """
        Delete a job
        
        Args:
            job_id: Job ID
        
        Raises:
            JobNotFoundException: If job not found
        """
        if job_id not in self._jobs:
            raise JobNotFoundException(
                f"Job not found: {job_id}",
                job_id=job_id
            )
        
        del self._jobs[job_id]
        logger.info(f"Job deleted: {job_id}")


# Import document_service singleton to share state
from app.services.document_service import document_service

# Global service instance with shared document service
analysis_service = AnalysisService(document_service=document_service)


# Export
__all__ = ['AnalysisService', 'analysis_service']
