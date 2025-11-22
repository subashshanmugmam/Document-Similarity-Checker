"""
Utility Functions Module
Common helper functions used across the application
"""

from typing import Optional, List, Tuple
from pathlib import Path
import hashlib
import re
import unicodedata
from datetime import datetime, timedelta
import mimetypes

from app.core.config import settings, AppConstants
from app.core.exceptions import ValidationException


class FileValidator:
    """File validation utilities"""
    
    @staticmethod
    def validate_file_extension(filename: str) -> Tuple[bool, Optional[str]]:
        """
        Validate file extension
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        ext = Path(filename).suffix.lower()
        
        if not ext:
            return False, "File has no extension"
        
        if ext not in settings.allowed_extensions:
            allowed = ', '.join(settings.allowed_extensions)
            return False, f"Invalid file type. Allowed: {allowed}"
        
        return True, None
    
    @staticmethod
    def validate_file_size(size: int) -> Tuple[bool, Optional[str]]:
        """
        Validate file size
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if size <= 0:
            return False, "File is empty"
        
        if size > settings.max_upload_size:
            max_mb = settings.max_upload_size / (1024 * 1024)
            return False, f"File too large. Maximum: {max_mb:.1f}MB"
        
        return True, None
    
    @staticmethod
    def validate_filename(filename: str) -> Tuple[bool, Optional[str]]:
        """
        Validate filename
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not filename or len(filename.strip()) == 0:
            return False, "Filename is empty"
        
        if len(filename) > AppConstants.MAX_FILENAME_LENGTH:
            return False, f"Filename too long (max {AppConstants.MAX_FILENAME_LENGTH} chars)"
        
        # Check for invalid characters
        invalid_chars = r'[<>:"|?*\0]'
        if re.search(invalid_chars, filename):
            return False, "Filename contains invalid characters"
        
        return True, None
    
    @staticmethod
    def get_mime_type(filename: str) -> str:
        """Get MIME type from filename"""
        mime_type, _ = mimetypes.guess_type(filename)
        return mime_type or "application/octet-stream"


class TextProcessor:
    """Text processing utilities"""
    
    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        
        # Normalize unicode characters
        text = unicodedata.normalize('NFKD', text)
        
        # Remove null bytes
        text = text.replace('\x00', '')
        
        # Normalize whitespace
        text = ' '.join(text.split())
        
        return text.strip()
    
    @staticmethod
    def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
        """Truncate text to maximum length"""
        if not text or len(text) <= max_length:
            return text
        
        return text[:max_length - len(suffix)].rsplit(' ', 1)[0] + suffix
    
    @staticmethod
    def count_words(text: str) -> int:
        """Count words in text"""
        if not text:
            return 0
        return len(text.split())
    
    @staticmethod
    def extract_preview(text: str, length: int = 100) -> str:
        """Extract text preview"""
        cleaned = TextProcessor.clean_text(text)
        return TextProcessor.truncate_text(cleaned, length)


class IDGenerator:
    """ID generation utilities"""
    
    @staticmethod
    def generate_document_id(filename: str, content: bytes) -> str:
        """Generate unique document ID from filename and content"""
        timestamp = datetime.utcnow().isoformat()
        data = f"{filename}{timestamp}{len(content)}".encode('utf-8')
        hash_obj = hashlib.sha256(data + content[:1024])  # Include first 1KB of content
        return hash_obj.hexdigest()[:16]
    
    @staticmethod
    def generate_job_id() -> str:
        """Generate unique job ID"""
        timestamp = datetime.utcnow().isoformat()
        random_data = hashlib.sha256(timestamp.encode('utf-8')).hexdigest()
        return f"job_{random_data[:12]}"


class TimeFormatter:
    """Time formatting utilities"""
    
    @staticmethod
    def format_duration(seconds: float) -> str:
        """Format duration in human-readable format"""
        if seconds < 1:
            return f"{seconds*1000:.0f}ms"
        elif seconds < 60:
            return f"{seconds:.1f}s"
        elif seconds < 3600:
            minutes = seconds / 60
            return f"{minutes:.1f}m"
        else:
            hours = seconds / 3600
            return f"{hours:.1f}h"
    
    @staticmethod
    def format_timestamp(dt: datetime) -> str:
        """Format timestamp in ISO format"""
        return dt.isoformat() if dt else None
    
    @staticmethod
    def calculate_uptime(start_time: datetime) -> str:
        """Calculate uptime from start time"""
        delta = datetime.utcnow() - start_time
        return TimeFormatter.format_duration(delta.total_seconds())


class PathManager:
    """Path management utilities"""
    
    @staticmethod
    def get_upload_path(filename: str) -> Path:
        """Get full upload path for a file"""
        safe_filename = PathManager.sanitize_filename(filename)
        upload_dir = settings.get_upload_path()
        return upload_dir / safe_filename
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize filename for safe storage"""
        # Remove path components
        filename = Path(filename).name
        
        # Remove dangerous characters
        filename = re.sub(r'[^\w\s.-]', '', filename)
        
        # Limit length
        name_part = Path(filename).stem[:200]
        ext_part = Path(filename).suffix
        
        return f"{name_part}{ext_part}"
    
    @staticmethod
    def ensure_directory(path: Path) -> None:
        """Ensure directory exists"""
        path.mkdir(parents=True, exist_ok=True)
    
    @staticmethod
    def cleanup_old_files(directory: Path, hours: int) -> int:
        """
        Clean up files older than specified hours
        
        Returns:
            Number of files deleted
        """
        if not directory.exists():
            return 0
        
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        deleted = 0
        
        for file_path in directory.glob('*'):
            if file_path.is_file():
                file_time = datetime.fromtimestamp(file_path.stat().st_mtime)
                if file_time < cutoff:
                    try:
                        file_path.unlink()
                        deleted += 1
                    except Exception:
                        pass
        
        return deleted


class DataFormatter:
    """Data formatting utilities"""
    
    @staticmethod
    def format_file_size(size_bytes: int) -> str:
        """Format file size in human-readable format"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f}{unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f}TB"
    
    @staticmethod
    def format_percentage(value: float) -> str:
        """Format value as percentage"""
        return f"{value*100:.1f}%"
    
    @staticmethod
    def round_similarity(similarity: float, decimals: int = 4) -> float:
        """Round similarity score"""
        return round(similarity, decimals)


class ValidationHelper:
    """Validation helper functions"""
    
    @staticmethod
    def validate_threshold(threshold: float) -> None:
        """Validate similarity threshold"""
        if threshold < settings.min_similarity_threshold:
            raise ValidationException(
                f"Threshold too low. Minimum: {settings.min_similarity_threshold}",
                error_code=AppConstants.ERR_INVALID_THRESHOLD,
                details={'threshold': threshold, 'min': settings.min_similarity_threshold}
            )
        
        if threshold > settings.max_similarity_threshold:
            raise ValidationException(
                f"Threshold too high. Maximum: {settings.max_similarity_threshold}",
                error_code=AppConstants.ERR_INVALID_THRESHOLD,
                details={'threshold': threshold, 'max': settings.max_similarity_threshold}
            )
    
    @staticmethod
    def validate_document_count(count: int, min_count: int = 2) -> None:
        """Validate document count for analysis"""
        from app.core.exceptions import InsufficientDocumentsException
        
        if count < min_count:
            raise InsufficientDocumentsException(
                f"Need at least {min_count} documents for analysis",
                required=min_count,
                provided=count
            )


# Export utilities
__all__ = [
    'FileValidator',
    'TextProcessor',
    'IDGenerator',
    'TimeFormatter',
    'PathManager',
    'DataFormatter',
    'ValidationHelper',
]
