"""
Document Service
Manages document storage, retrieval, and metadata
"""

from typing import List, Optional, Dict, Tuple
from pathlib import Path
from datetime import datetime
import shutil
import json

from fastapi import UploadFile

from app.core.config import settings, AppConstants
from app.core.logging import get_logger
from app.core.exceptions import (
    FileUploadException,
    DocumentNotFoundException,
    ValidationException
)
from app.models.schemas import DocumentInfo, DocumentStatus
from app.utils.helpers import (
    FileValidator,
    TextProcessor,
    IDGenerator,
    PathManager
)
from app.services.document_processor import DocumentProcessor

logger = get_logger(__name__)


class DocumentService:
    """Document management service"""
    
    def __init__(self):
        """Initialize document service"""
        self.upload_dir = settings.get_upload_path()
        self.metadata_file = self.upload_dir / "documents_metadata.json"
        self.file_validator = FileValidator()
        self.text_processor = TextProcessor()
        self.document_processor = DocumentProcessor()
        self._ensure_directories()
        self._load_metadata()
    
    def _ensure_directories(self) -> None:
        """Ensure upload directory exists"""
        PathManager.ensure_directory(self.upload_dir)
        logger.debug(f"Upload directory ready: {self.upload_dir}")
    
    def _load_metadata(self) -> None:
        """Load document metadata from file"""
        try:
            if self.metadata_file.exists():
                with open(self.metadata_file, 'r', encoding='utf-8') as f:
                    self._metadata = json.load(f)
                logger.info(f"Loaded metadata for {len(self._metadata)} documents")
            else:
                self._metadata = {}
                logger.info("No existing metadata found, starting fresh")
        except Exception as e:
            logger.error(f"Failed to load metadata: {str(e)}")
            self._metadata = {}
    
    def _save_metadata(self) -> None:
        """Save document metadata to file"""
        try:
            with open(self.metadata_file, 'w', encoding='utf-8') as f:
                json.dump(self._metadata, f, indent=2, default=str)
            logger.debug("Metadata saved successfully")
        except Exception as e:
            logger.error(f"Failed to save metadata: {str(e)}")
    
    async def upload_document(
        self,
        file: UploadFile
    ) -> DocumentInfo:
        """
        Upload a single document
        
        Args:
            file: Uploaded file
        
        Returns:
            DocumentInfo with upload details
        
        Raises:
            FileUploadException: If upload fails
            ValidationException: If validation fails
        """
        try:
            logger.info(f"Uploading document: {file.filename}")
            
            # Validate filename
            is_valid, error_msg = self.file_validator.validate_filename(file.filename)
            if not is_valid:
                raise ValidationException(error_msg, details={'filename': file.filename})
            
            # Validate file extension
            is_valid, error_msg = self.file_validator.validate_file_extension(file.filename)
            if not is_valid:
                raise FileUploadException(error_msg, details={'filename': file.filename})
            
            # Read file content
            content = await file.read()
            file_size = len(content)
            
            # Validate file size
            is_valid, error_msg = self.file_validator.validate_file_size(file_size)
            if not is_valid:
                raise FileUploadException(error_msg, details={'size': file_size})
            
            # Generate document ID
            doc_id = IDGenerator.generate_document_id(file.filename, content)
            
            # Check for duplicate
            if doc_id in self._metadata:
                logger.warning(f"Duplicate document detected: {file.filename}")
                raise FileUploadException(
                    f"Document already exists: {file.filename}",
                    error_code="DUPLICATE_DOCUMENT",
                    details={'doc_id': doc_id}
                )
            
            # Save file
            file_path = PathManager.get_upload_path(f"{doc_id}_{file.filename}")
            with open(file_path, 'wb') as f:
                f.write(content)
            
            # Extract text content for preview
            try:
                text_content = self.document_processor.extract_document_content(file_path)
                content_preview = self.text_processor.extract_preview(text_content)
                word_count = self.text_processor.count_words(text_content)
            except Exception as e:
                logger.warning(f"Failed to extract preview: {str(e)}")
                content_preview = None
                word_count = None
            
            # Create document info
            doc_info = DocumentInfo(
                doc_id=doc_id,
                filename=file.filename,
                file_size=file_size,
                upload_timestamp=datetime.utcnow(),
                status=DocumentStatus.UPLOADED,
                content_preview=content_preview,
                word_count=word_count
            )
            
            # Save metadata
            self._metadata[doc_id] = doc_info.dict()
            self._save_metadata()
            
            logger.info(f"Document uploaded successfully: {file.filename} (ID: {doc_id})")
            
            return doc_info
            
        except (FileUploadException, ValidationException):
            raise
        except Exception as e:
            logger.error(f"Upload failed: {str(e)}", exc_info=True)
            raise FileUploadException(
                f"Failed to upload document: {str(e)}",
                details={'filename': file.filename, 'error': str(e)}
            )
    
    async def upload_documents(
        self,
        files: List[UploadFile]
    ) -> Tuple[List[DocumentInfo], List[Dict[str, str]]]:
        """
        Upload multiple documents
        
        Args:
            files: List of uploaded files
        
        Returns:
            Tuple of (successful uploads, failed uploads)
        """
        if not files or len(files) == 0:
            raise ValidationException(
                "No files provided",
                error_code=AppConstants.ERR_NO_FILES
            )
        
        if len(files) > settings.max_files_per_upload:
            raise ValidationException(
                f"Too many files. Maximum: {settings.max_files_per_upload}",
                details={'provided': len(files), 'max': settings.max_files_per_upload}
            )
        
        logger.info(f"Uploading {len(files)} documents...")
        
        successful = []
        failed = []
        
        for file in files:
            try:
                doc_info = await self.upload_document(file)
                successful.append(doc_info)
            except Exception as e:
                logger.warning(f"Failed to upload {file.filename}: {str(e)}")
                failed.append({
                    'filename': file.filename,
                    'error': str(e)
                })
        
        logger.info(
            f"Upload completed: {len(successful)} successful, {len(failed)} failed"
        )
        
        return successful, failed
    
    def get_document(self, doc_id: str) -> DocumentInfo:
        """
        Get document information
        
        Args:
            doc_id: Document ID
        
        Returns:
            DocumentInfo
        
        Raises:
            DocumentNotFoundException: If document not found
        """
        if doc_id not in self._metadata:
            raise DocumentNotFoundException(
                f"Document not found: {doc_id}",
                document_id=doc_id
            )
        
        return DocumentInfo(**self._metadata[doc_id])
    
    def list_documents(self) -> List[DocumentInfo]:
        """
        List all documents
        
        Returns:
            List of DocumentInfo
        """
        documents = [
            DocumentInfo(**doc_data)
            for doc_data in self._metadata.values()
        ]
        
        # Sort by upload timestamp (newest first)
        documents.sort(key=lambda x: x.upload_timestamp, reverse=True)
        
        return documents
    
    def delete_document(self, doc_id: str) -> None:
        """
        Delete a document
        
        Args:
            doc_id: Document ID
        
        Raises:
            DocumentNotFoundException: If document not found
        """
        if doc_id not in self._metadata:
            raise DocumentNotFoundException(
                f"Document not found: {doc_id}",
                document_id=doc_id
            )
        
        doc_info = self._metadata[doc_id]
        filename = doc_info['filename']
        
        # Delete file
        file_path = PathManager.get_upload_path(f"{doc_id}_{filename}")
        if file_path.exists():
            file_path.unlink()
            logger.info(f"Deleted file: {file_path.name}")
        
        # Remove from metadata
        del self._metadata[doc_id]
        self._save_metadata()
        
        logger.info(f"Document deleted: {doc_id}")
    
    def delete_all_documents(self) -> int:
        """
        Delete all documents
        
        Returns:
            Number of documents deleted
        """
        count = len(self._metadata)
        
        # Delete all files
        for doc_id in list(self._metadata.keys()):
            try:
                self.delete_document(doc_id)
            except Exception as e:
                logger.error(f"Failed to delete {doc_id}: {str(e)}")
        
        logger.info(f"Deleted all documents: {count}")
        
        return count
    
    def get_document_count(self) -> int:
        """Get total document count"""
        return len(self._metadata)
    
    def get_documents_for_analysis(
        self,
        doc_ids: Optional[List[str]] = None
    ) -> List[Dict[str, any]]:
        """
        Get documents prepared for analysis
        
        Args:
            doc_ids: Specific document IDs (None for all)
        
        Returns:
            List of document dictionaries ready for processing
        
        Raises:
            DocumentNotFoundException: If any document not found
        """
        if doc_ids is None:
            # Use all documents
            doc_ids = list(self._metadata.keys())
        
        if len(doc_ids) < AppConstants.MIN_DOCUMENTS_FOR_ANALYSIS:
            from app.core.exceptions import InsufficientDocumentsException
            raise InsufficientDocumentsException(
                f"Need at least {AppConstants.MIN_DOCUMENTS_FOR_ANALYSIS} documents",
                required=AppConstants.MIN_DOCUMENTS_FOR_ANALYSIS,
                provided=len(doc_ids)
            )
        
        documents = []
        
        for doc_id in doc_ids:
            if doc_id not in self._metadata:
                raise DocumentNotFoundException(
                    f"Document not found: {doc_id}",
                    document_id=doc_id
                )
            
            doc_info = self._metadata[doc_id]
            filename = doc_info['filename']
            file_path = PathManager.get_upload_path(f"{doc_id}_{filename}")
            
            # Extract content
            try:
                content = self.document_processor.extract_document_content(file_path)
                
                # Handle upload_timestamp - could be string or datetime
                upload_ts = doc_info['upload_timestamp']
                if isinstance(upload_ts, str):
                    upload_ts = datetime.fromisoformat(upload_ts)
                elif not isinstance(upload_ts, datetime):
                    upload_ts = datetime.utcnow()
                
                documents.append({
                    'doc_id': doc_id,
                    'filename': filename,
                    'content': content,
                    'upload_timestamp': upload_ts
                })
            except Exception as e:
                logger.error(f"Failed to extract content from {filename}: {str(e)}")
                raise
        
        logger.info(f"Prepared {len(documents)} documents for analysis")
        
        return documents
    
    def cleanup_old_files(self) -> int:
        """
        Clean up old files
        
        Returns:
            Number of files cleaned up
        """
        deleted = PathManager.cleanup_old_files(
            self.upload_dir,
            settings.cleanup_after_hours
        )
        
        if deleted > 0:
            # Reload metadata to sync
            self._load_metadata()
            logger.info(f"Cleaned up {deleted} old files")
        
        return deleted


# Global service instance
document_service = DocumentService()


# Export
__all__ = ['DocumentService', 'document_service']
