"""
API Package
Exports API components
"""

from app.api.routes import router
from app.api.middleware import setup_middleware, setup_cors

__all__ = ['router', 'setup_middleware', 'setup_cors']
