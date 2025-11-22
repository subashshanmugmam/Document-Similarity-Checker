"""
Advanced Logging Configuration
Provides structured logging with rotation, multiple handlers, and context tracking
"""

import logging
import logging.handlers
from typing import Any, Dict
from pathlib import Path
import json
from datetime import datetime
import sys
import traceback

from app.core.config import settings


class CustomJsonFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': traceback.format_exception(*record.exc_info)
            }
        
        # Add extra fields if present
        if hasattr(record, 'extra_data'):
            log_data['extra'] = record.extra_data
        
        return json.dumps(log_data, default=str)


class ColoredConsoleFormatter(logging.Formatter):
    """Colored console formatter for better readability"""
    
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
    }
    RESET = '\033[0m'
    BOLD = '\033[1m'
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record with colors"""
        color = self.COLORS.get(record.levelname, self.RESET)
        record.levelname = f"{color}{self.BOLD}{record.levelname}{self.RESET}"
        record.name = f"{self.BOLD}{record.name}{self.RESET}"
        return super().format(record)


class LoggerManager:
    """Centralized logger management"""
    
    _loggers: Dict[str, logging.Logger] = {}
    _initialized = False
    
    @classmethod
    def setup_logging(cls) -> None:
        """Initialize logging configuration"""
        if cls._initialized:
            return
        
        # Create logs directory
        log_path = settings.get_log_path()
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Get root logger
        root_logger = logging.getLogger()
        root_logger.setLevel(getattr(logging, settings.log_level.upper()))
        
        # Remove existing handlers
        root_logger.handlers.clear()
        
        # Console handler with colored output
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG if settings.debug else logging.INFO)
        console_formatter = ColoredConsoleFormatter(
            '%(asctime)s | %(levelname)s | %(name)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        console_handler.setFormatter(console_formatter)
        root_logger.addHandler(console_handler)
        
        # File handler with rotation
        file_handler = logging.handlers.RotatingFileHandler(
            filename=str(log_path),
            maxBytes=settings.log_max_bytes,
            backupCount=settings.log_backup_count,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.DEBUG)
        
        # Use JSON formatter for file logs in production
        if settings.is_production():
            file_formatter = CustomJsonFormatter()
        else:
            file_formatter = logging.Formatter(
                '%(asctime)s | %(levelname)-8s | %(name)-20s | %(funcName)-20s | %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
        file_handler.setFormatter(file_formatter)
        root_logger.addHandler(file_handler)
        
        # Error file handler for errors and above
        error_log_path = log_path.parent / 'error.log'
        error_handler = logging.handlers.RotatingFileHandler(
            filename=str(error_log_path),
            maxBytes=settings.log_max_bytes,
            backupCount=settings.log_backup_count,
            encoding='utf-8'
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(file_formatter)
        root_logger.addHandler(error_handler)
        
        cls._initialized = True
        
        # Log initialization
        logger = cls.get_logger(__name__)
        logger.info(
            f"Logging initialized: level={settings.log_level}, "
            f"file={log_path}, debug={settings.debug}"
        )
    
    @classmethod
    def get_logger(cls, name: str) -> logging.Logger:
        """Get or create a logger instance"""
        if not cls._initialized:
            cls.setup_logging()
        
        if name not in cls._loggers:
            logger = logging.getLogger(name)
            cls._loggers[name] = logger
        
        return cls._loggers[name]
    
    @classmethod
    def log_with_context(cls, logger: logging.Logger, level: int, 
                        message: str, **context: Any) -> None:
        """Log message with additional context"""
        extra_data = {'extra_data': context}
        logger.log(level, message, extra=extra_data)


# Convenience function
def get_logger(name: str = None) -> logging.Logger:
    """Get logger instance (convenience function)"""
    if name is None:
        # Get caller's module name
        import inspect
        frame = inspect.currentframe().f_back
        name = frame.f_globals['__name__']
    
    return LoggerManager.get_logger(name)


# Initialize logging on module import
LoggerManager.setup_logging()


# Export
__all__ = ['get_logger', 'LoggerManager']
