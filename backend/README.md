# Document Similarity Checker - Backend

A robust, production-ready PySpark-based document similarity detection system with FastAPI REST API.

## 🏗️ Architecture Overview

```
backend/
├── app/
│   ├── api/                    # API endpoints
│   ├── core/                   # Core configuration and logging
│   │   ├── config.py          # Settings management
│   │   ├── logging.py         # Advanced logging
│   │   └── exceptions.py      # Custom exceptions
│   ├── models/                 # Pydantic models
│   │   └── schemas.py         # Request/response schemas
│   ├── services/               # Business logic
│   │   ├── document_service.py    # Document management
│   │   ├── spark_service.py       # PySpark processing
│   │   └── similarity_service.py  # Similarity computation
│   └── utils/                  # Utility functions
│       └── helpers.py         # Helper utilities
├── uploads/                    # Temporary file storage
├── logs/                       # Application logs
├── tests/                      # Unit and integration tests
├── requirements.txt            # Python dependencies
├── verify_setup.py            # Prerequisites checker
├── .env.example               # Environment template
└── main.py                    # Application entry point
```

## ✨ Key Features

### Robust Architecture
- **Modular Design**: Clean separation of concerns (API, Services, Models, Utils)
- **Type Safety**: Full Pydantic validation for all inputs/outputs
- **Error Handling**: Comprehensive exception hierarchy with proper HTTP status codes
- **Logging**: Structured logging with rotation, colors, and JSON formatting

### Enhanced Error Handling
- Custom exception classes for every error scenario
- Detailed error messages with context
- Automatic error logging and tracking
- User-friendly error responses

### Configuration Management
- Environment-based configuration with `.env` support
- Type-safe settings with Pydantic validation
- Auto-creation of required directories
- Configurable Spark parameters

### Production-Ready
- Logging with rotation (file size and backup count)
- Resource cleanup mechanisms
- Health check endpoints
- Performance monitoring ready

## 🚀 Getting Started

### Prerequisites

- **Python 3.10.x** (required)
- **Java 8 or 11** (required for PySpark)
- **4GB+ RAM** (recommended)
- **1GB+ disk space**

### 1. Verify Prerequisites

```powershell
# Run the verification script
python verify_setup.py
```

This will check:
- Python version (must be 3.10.x)
- Java installation (required for Spark)
- Available disk space and memory
- Required Python packages

### 2. Install Dependencies

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

```powershell
# Copy environment template
Copy-Item .env.example .env

# Edit .env file with your settings
notepad .env
```

Key settings in `.env`:
```env
DEBUG=True
PORT=8000
MAX_UPLOAD_SIZE=52428800  # 50MB
DEFAULT_SIMILARITY_THRESHOLD=0.7
LOG_LEVEL=INFO
```

### 4. Run the Application

```powershell
# Development mode
python main.py

# Or with uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

## 📚 API Documentation

Once running, access interactive API docs:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Available Endpoints

#### Health Check
```http
GET /api/health
```
Returns service status, version, and Spark status.

#### Upload Documents
```http
POST /api/upload
Content-Type: multipart/form-data

files: [file1.txt, file2.pdf, ...]
```
Upload one or more documents (.txt, .pdf).

#### List Documents
```http
GET /api/documents
```
Get list of all uploaded documents.

#### Delete Document
```http
DELETE /api/documents/{doc_id}
```
Delete a specific document.

#### Delete All Documents
```http
DELETE /api/documents
```
Remove all uploaded documents.

#### Analyze Documents
```http
POST /api/analyze
Content-Type: application/json

{
  "document_ids": null,  // null for all documents
  "config": {
    "threshold": 0.7,
    "include_all_pairs": true
  }
}
```
Trigger similarity analysis.

#### Get Results
```http
GET /api/results/{job_id}
```
Retrieve analysis results by job ID.

## 🔧 Configuration Options

### Spark Settings

```env
SPARK_APP_NAME=DocumentSimilarity
SPARK_MASTER=local[*]              # Use all CPU cores
SPARK_DRIVER_MEMORY=4g             # Driver memory
SPARK_EXECUTOR_MEMORY=4g           # Executor memory
SPARK_MAX_RESULT_SIZE=2g           # Max result size
```

### File Upload Settings

```env
MAX_UPLOAD_SIZE=52428800           # 50MB (in bytes)
ALLOWED_EXTENSIONS=[".txt", ".pdf"]
MAX_FILES_PER_UPLOAD=50
```

### Similarity Analysis

```env
DEFAULT_SIMILARITY_THRESHOLD=0.7    # Default threshold
MIN_SIMILARITY_THRESHOLD=0.5        # Minimum allowed
MAX_SIMILARITY_THRESHOLD=1.0        # Maximum allowed
```

### Logging

```env
LOG_LEVEL=INFO                      # DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_FILE=logs/app.log              # Log file path
LOG_MAX_BYTES=10485760             # 10MB per log file
LOG_BACKUP_COUNT=5                 # Keep 5 backup files
```

## 🧪 Testing

```powershell
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_document_service.py
```

## 📊 Logging

Logs are written to:
- **Console**: Colored output for development
- **File**: `logs/app.log` (with rotation)
- **Error File**: `logs/error.log` (errors only)

Log format (file):
```
2024-01-01 12:00:00 | INFO     | app.services.document_service | upload_document | Document uploaded: file1.txt
```

## 🔒 Security Considerations

- File type validation (only .txt and .pdf)
- File size limits enforced
- Filename sanitization to prevent path traversal
- CORS configuration for frontend domains
- Optional API key authentication

## 🐛 Troubleshooting

### Java Not Found
```
Error: Java not found
Solution: Install Java 8 or 11 from https://adoptium.net/
```

### Permission Denied (uploads directory)
```
Error: Permission denied: 'uploads'
Solution: Ensure the directory has write permissions
```

### Out of Memory
```
Error: OutOfMemoryError
Solution: Increase Spark memory in .env:
  SPARK_DRIVER_MEMORY=8g
  SPARK_EXECUTOR_MEMORY=8g
```

### Import Errors
```
Error: ModuleNotFoundError: No module named 'pydantic_settings'
Solution: Reinstall dependencies:
  pip install -r requirements.txt --force-reinstall
```

## 📈 Performance Tips

1. **Memory**: Allocate more RAM for large document sets
   ```env
   SPARK_DRIVER_MEMORY=8g
   SPARK_EXECUTOR_MEMORY=8g
   ```

2. **CPU**: Adjust Spark parallelism
   ```env
   SPARK_MASTER=local[4]  # Use 4 cores
   ```

3. **File Cleanup**: Enable automatic cleanup
   ```env
   CLEANUP_AFTER_HOURS=24
   ```

## 🔄 Development Workflow

1. **Make Changes**: Edit code in `app/` directory
2. **Check Errors**: Run `python verify_setup.py`
3. **Test**: Run `pytest` to ensure tests pass
4. **Format**: Use Black for code formatting
   ```powershell
   pip install black
   black app/
   ```
5. **Run**: Start server with `python main.py`

## 📝 Code Style

This project follows:
- **PEP 8**: Python style guide
- **Type Hints**: Python 3.10+ type annotations
- **Docstrings**: Google-style docstrings
- **Error Handling**: Explicit exception handling

## 🚧 Project Status

**Current Phase**: Phase 1 - Architecture & Configuration ✅

- [x] Project structure created
- [x] Core configuration module
- [x] Advanced logging system
- [x] Custom exception hierarchy
- [x] Data models (Pydantic schemas)
- [x] Utility helpers
- [x] Prerequisites verification
- [ ] Document service implementation (Next)
- [ ] PySpark processing pipeline (Next)
- [ ] REST API endpoints (Next)

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Use type hints
5. Handle errors properly

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs in `logs/app.log`
3. Run `python verify_setup.py` to check setup
4. Ensure Python 3.10.x is being used

---

**Built with ❤️ using PySpark, FastAPI, and Python 3.10**
