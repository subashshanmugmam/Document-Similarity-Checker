# 🚀 Quick Start Guide - Document Similarity Checker

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Python 3.10.x** installed (NOT 3.11, 3.12, or 3.13)
- [ ] **Java 8 or 11** installed (required for PySpark)
- [ ] **4GB+ RAM** available
- [ ] **1GB+ disk space** free
- [ ] **PowerShell** or **Command Prompt** (Windows)

## ⚡ Quick Setup (5 Minutes)

### Step 1: Verify Your System

```powershell
# Navigate to backend directory
cd "s:\Program File\Snew\backend"

# Check Python version (should be 3.10.x)
python --version

# Check Java (required for Spark)
java -version

# Run comprehensive verification
python verify_setup.py
```

**Expected Output**:
```
=== Document Similarity Checker - Prerequisites Check ===

Python Version       Python 3.10.x ✓
Java Runtime         Java installed ✓ (1.8.0_xxx)
Disk Space          X.XX GB available ✓
Memory              X.XX/X.XX GB available ✓

✓ All prerequisites met! Ready to proceed.
```

### Step 2: Install Dependencies

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment (PowerShell)
.\venv\Scripts\Activate.ps1

# If execution policy error, run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install dependencies (this may take 5-10 minutes)
pip install -r requirements.txt
```

**Watch for**:
- `pyspark` installation (largest package)
- `fastapi` and `uvicorn` for API server
- `PyPDF2` for PDF processing

### Step 3: Configure Environment

```powershell
# Copy environment template
Copy-Item .env.example .env

# Edit configuration (optional - defaults work fine)
notepad .env
```

**Key Settings** (can use defaults):
- `PORT=8000` - API server port
- `MAX_UPLOAD_SIZE=52428800` - 50MB max file size
- `DEFAULT_SIMILARITY_THRESHOLD=0.7` - 70% similarity threshold

### Step 4: Test the Setup

```powershell
# Re-run verification to check installations
python verify_setup.py
```

All packages should now show ✓ (checkmark).

## 🎯 What You Have Now

### ✅ Completed Components

1. **Robust Architecture** 
   - Clean separation of concerns
   - Modular design
   - Type-safe with Pydantic

2. **Core Configuration**
   - Environment-based settings
   - Automatic validation
   - Production-ready

3. **Advanced Logging**
   - Console with colors
   - File with rotation
   - Structured JSON for production

4. **Exception Handling**
   - 10+ custom exception types
   - Proper HTTP status codes
   - Detailed error context

5. **Data Models**
   - Request/Response schemas
   - Automatic validation
   - API documentation ready

6. **PySpark Services**
   - Spark session manager (singleton)
   - Document processor (PDF + TXT)
   - TF-IDF pipeline
   - Similarity computation (cosine)

7. **Utility Helpers**
   - File validation
   - Text processing
   - ID generation
   - Time formatting

### 📂 Project Structure

```
backend/
├── app/
│   ├── core/          ✅ Config, Logging, Exceptions
│   ├── models/        ✅ Pydantic schemas
│   ├── services/      ✅ Spark, Processing, Similarity
│   ├── utils/         ✅ Helper functions
│   └── api/           ⏳ Next: REST endpoints
├── uploads/           ✅ File storage
├── logs/              ✅ Application logs
├── tests/             ⏳ Next: Unit tests
├── requirements.txt   ✅ Dependencies
├── verify_setup.py    ✅ Prerequisites checker
└── .env.example       ✅ Config template
```

## 🔄 Next Phase: API Endpoints & Main App

### What Needs to Be Built

1. **Document Service** (`app/services/document_service.py`)
   - Save uploaded files
   - List documents
   - Delete documents
   - Manage document metadata

2. **API Routes** (`app/api/routes.py`)
   - `POST /api/upload` - Upload documents
   - `GET /api/documents` - List documents
   - `DELETE /api/documents/:id` - Delete document
   - `POST /api/analyze` - Trigger analysis
   - `GET /api/results/:job_id` - Get results
   - `GET /api/health` - Health check

3. **Main Application** (`main.py`)
   - FastAPI app initialization
   - CORS configuration
   - Exception handlers
   - Startup/shutdown events

4. **Job Manager** (for async processing)
   - Track analysis jobs
   - Store results
   - Job status updates

## 🧪 Testing Your Setup

### Manual Test: Run Python Interactive Shell

```powershell
# Activate venv
.\venv\Scripts\Activate.ps1

# Start Python
python

# Test imports
>>> from app.core.config import settings
>>> from app.core.logging import get_logger
>>> from app.services.spark_service import spark_service

# Test Spark
>>> spark = spark_service.get_session()
>>> print(spark.version)
# Should print: 3.5.0

>>> info = spark_service.get_spark_info()
>>> print(info)
# Should show: {'status': 'running', 'version': '3.5.0', ...}

# Exit
>>> exit()
```

### Test Document Processing

```python
# Create test script: test_processing.py
from pathlib import Path
from datetime import datetime
from app.services.document_processor import DocumentProcessor

processor = DocumentProcessor()

# Test data
documents = [
    {
        'doc_id': 'test1',
        'filename': 'doc1.txt',
        'content': 'This is a test document about machine learning.',
        'upload_timestamp': datetime.utcnow()
    },
    {
        'doc_id': 'test2',
        'filename': 'doc2.txt',
        'content': 'This document discusses artificial intelligence and machine learning.',
        'upload_timestamp': datetime.utcnow()
    }
]

# Process
features_df, model = processor.process_documents(documents)
print(f"Processed {features_df.count()} documents")
features_df.show()
```

Run it:
```powershell
python test_processing.py
```

## 📊 Understanding the Architecture

### Data Flow

```
User Upload (files)
    ↓
API Endpoint (/api/upload)
    ↓
File Validation (FileValidator)
    ↓
Document Service (save to uploads/)
    ↓
Analysis Trigger (/api/analyze)
    ↓
Document Processor (extract text, create DataFrame)
    ↓
Text Preprocessing (lowercase, remove punctuation)
    ↓
TF-IDF Pipeline (tokenize → remove stop words → vectorize)
    ↓
Similarity Computer (cosine similarity)
    ↓
Results Formatting (SimilarPair objects)
    ↓
API Response (JSON)
    ↓
Frontend Display
```

### Spark Pipeline

```
Raw Text
    ↓
[Tokenizer] → words: ["this", "is", "test"]
    ↓
[StopWordsRemover] → filtered: ["test"]
    ↓
[CountVectorizer] → term frequencies
    ↓
[IDF] → TF-IDF vectors
    ↓
Features (ready for similarity)
```

## 🔍 Troubleshooting

### Issue: Python 3.11+ installed

**Problem**: Pydantic compatibility issues

**Solution**:
```powershell
# Install Python 3.10 from python.org
# Then create venv with specific version
py -3.10 -m venv venv
```

### Issue: Java not found

**Problem**: Spark requires Java

**Solution**:
1. Download Java 11 from https://adoptium.net/
2. Install and restart terminal
3. Verify: `java -version`

### Issue: Import errors

**Problem**: Dependencies not installed

**Solution**:
```powershell
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Issue: Permission denied (logs/)

**Problem**: Can't create log directory

**Solution**:
```powershell
# Create directories manually
mkdir logs
mkdir uploads
```

## 📚 Learning Resources

### Key Files to Understand

1. **`app/core/config.py`** - How configuration works
2. **`app/core/exceptions.py`** - Error handling patterns
3. **`app/services/spark_service.py`** - Spark session management
4. **`app/services/document_processor.py`** - Processing pipeline
5. **`app/services/similarity_service.py`** - Similarity computation

### Code Examples

All services include:
- Comprehensive docstrings
- Type hints
- Error handling
- Logging statements
- Usage examples in comments

## 🎓 Development Workflow

### Making Changes

1. **Activate environment**
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

2. **Make your changes**
   ```powershell
   notepad app\services\my_service.py
   ```

3. **Test changes**
   ```powershell
   python test_script.py
   ```

4. **Check logs**
   ```powershell
   type logs\app.log
   ```

### Best Practices

- ✅ Use type hints for all functions
- ✅ Add docstrings (Google style)
- ✅ Handle exceptions properly
- ✅ Log important operations
- ✅ Validate inputs
- ✅ Use existing utilities from `app/utils/helpers.py`

## 🚀 What's Next?

### Immediate Next Steps

1. **Create Document Service**
   - File upload handling
   - Document metadata storage
   - List/delete operations

2. **Create API Endpoints**
   - FastAPI routes
   - Request validation
   - Response formatting

3. **Create Main Application**
   - App initialization
   - CORS setup
   - Exception handlers

4. **Add Job Management**
   - Track analysis jobs
   - Store results
   - Query results

5. **Write Tests**
   - Unit tests for services
   - Integration tests
   - API endpoint tests

### Then: Frontend Development

After backend is complete:
1. Initialize React + Vite
2. Set up Tailwind CSS
3. Create components
4. Connect to backend API
5. Add visualizations

## 📞 Getting Help

### Check These First

1. **Run verification**: `python verify_setup.py`
2. **Check logs**: `type logs\app.log`
3. **Review structure**: Read `PROJECT_STRUCTURE.md`
4. **Check examples**: Look at service files for patterns

### Common Questions

**Q: Which Python version exactly?**
A: Python 3.10.x (3.10.0 through 3.10.11). NOT 3.11+

**Q: Do I need to install Spark separately?**
A: No, PySpark includes Spark. Just need Java.

**Q: How do I know it's working?**
A: Run `python verify_setup.py` - all items should have ✓

**Q: Can I change the configuration?**
A: Yes, edit `.env` file. All settings are documented.

---

## ✨ You're Ready!

You now have a **robust, production-ready architecture** for your Document Similarity Checker!

**What you've built**:
- ✅ Type-safe configuration system
- ✅ Advanced logging with rotation
- ✅ Comprehensive error handling
- ✅ Complete PySpark processing pipeline
- ✅ Cosine similarity computation
- ✅ Validated data models

**Next**: Build the API layer and connect everything together!

**Estimated time to complete backend**: 2-3 hours
**Estimated time for frontend**: 4-5 hours
**Total project**: 6-8 hours

---

**Happy Coding! 🎉**

For questions or issues, check:
- `PROJECT_STRUCTURE.md` - Detailed architecture
- `README.md` - Comprehensive documentation
- Code comments - Every service is well-documented
