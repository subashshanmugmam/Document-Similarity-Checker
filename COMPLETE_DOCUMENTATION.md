# Complete Project Documentation

## Project Structure

```
Snew/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── middleware.py          # Request logging, error handling, CORS
│   │   │   └── routes.py              # 8 REST API endpoints
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py              # Pydantic settings management
│   │   │   ├── exceptions.py          # 10+ custom exception classes
│   │   │   └── logging.py             # Multi-handler logging with rotation
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py             # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── analysis_service.py    # Job management & coordination
│   │   │   ├── document_processor.py  # PDF/TXT extraction, TF-IDF
│   │   │   ├── document_service.py    # Document CRUD operations
│   │   │   ├── similarity_service.py  # Cosine similarity computation
│   │   │   └── spark_service.py       # Spark session manager (singleton)
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── helpers.py             # 7 utility classes
│   ├── data/
│   │   ├── uploads/                   # Uploaded documents
│   │   ├── metadata/                  # Document metadata (JSON)
│   │   └── results/                   # Analysis results (JSON)
│   ├── logs/                          # Application logs
│   ├── .env                           # Environment configuration
│   ├── .env.example                   # Environment template
│   ├── main.py                        # FastAPI application entry point
│   ├── requirements.txt               # Python 3.10 dependencies
│   ├── verify_setup.py                # Prerequisites checker
│   └── README.md                      # Backend documentation
│
├── frontend/
│   ├── public/                        # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnalysisButton.jsx     # Analysis trigger & configuration
│   │   │   ├── DocumentList.jsx       # Document list with CRUD
│   │   │   ├── DocumentUploader.jsx   # Drag-drop file upload
│   │   │   ├── ErrorMessage.jsx       # Reusable error display
│   │   │   ├── LoadingSpinner.jsx     # Reusable loading indicator
│   │   │   ├── ResultsDisplay.jsx     # Tabbed results interface
│   │   │   ├── SimilarityMatrix.jsx   # Heatmap visualization
│   │   │   └── SimilarPairs.jsx       # Sorted pairs list
│   │   ├── context/
│   │   │   └── AppContext.jsx         # Global state management
│   │   ├── services/
│   │   │   └── api.js                 # Axios API client (8 methods)
│   │   ├── utils/
│   │   │   └── helpers.js             # 13+ utility functions
│   │   ├── App.jsx                    # Main application component
│   │   ├── index.css                  # Tailwind styles
│   │   └── main.jsx                   # React entry point
│   ├── index.html                     # HTML template
│   ├── package.json                   # Dependencies
│   ├── postcss.config.js              # PostCSS configuration
│   ├── tailwind.config.js             # Tailwind theming
│   └── vite.config.js                 # Vite configuration
│
├── PROJECT_STRUCTURE.md               # Architecture documentation
├── QUICK_START.md                     # Setup guide
├── TESTING_GUIDE.md                   # Comprehensive testing guide
└── Readme.md                          # Project overview
```

## Technology Stack

### Backend
- **Python 3.10.x** - Required version (NOT 3.11, 3.12, or 3.13)
- **PySpark 3.5.0** - Distributed document processing
- **FastAPI 0.104.1** - Modern REST API framework
- **Pydantic 2.5.0** - Type-safe validation
- **Uvicorn 0.24.0** - ASGI server
- **PyPDF2 3.0.1** - PDF text extraction
- **NumPy 1.24.3** - Numerical computing
- **Pandas 2.0.3** - Data manipulation

### Frontend
- **React 18.2.0** - UI library
- **Vite 5.0.8** - Build tool and dev server
- **Tailwind CSS 3.3.6** - Utility-first CSS
- **Axios 1.6.2** - HTTP client
- **Recharts 2.10.3** - Data visualization
- **React Dropzone 14.2.3** - File uploads
- **Lucide React** - Icon library

## Architecture Overview

### Backend Architecture

```
API Layer (FastAPI)
    ↓
Middleware Layer (Logging, CORS, Error Handling)
    ↓
Service Layer
    ├── DocumentService (CRUD operations)
    ├── AnalysisService (Job coordination)
    ├── DocumentProcessor (TF-IDF pipeline)
    └── SimilarityService (Cosine similarity)
    ↓
Core Layer
    ├── SparkService (Session management)
    ├── Configuration (Settings)
    └── Logging (Multi-handler)
```

### Frontend Architecture

```
App Component
    ↓
AppContext (Global State)
    ↓
Components
    ├── DocumentUploader
    ├── DocumentList
    ├── AnalysisButton
    └── ResultsDisplay
        ├── SimilarPairs
        └── SimilarityMatrix
    ↓
API Service (Axios)
    ↓
Backend REST API
```

## Key Features

### Document Processing
1. **File Upload**
   - Supports PDF and TXT files
   - Max size: 10MB per file
   - Multiple file upload
   - Validation: file type, size, content

2. **Text Extraction**
   - PDF: PyPDF2 library
   - TXT: Direct reading
   - Error handling for corrupted files

3. **Preprocessing**
   - Tokenization
   - Stop word removal (English)
   - Lowercase conversion
   - Special character removal

4. **Feature Extraction**
   - TF-IDF (Term Frequency-Inverse Document Frequency)
   - 4-stage Spark ML pipeline:
     1. Tokenizer
     2. StopWordsRemover
     3. CountVectorizer
     4. IDF

### Similarity Analysis
1. **Cosine Similarity**
   - Formula: cos(θ) = (A · B) / (||A|| × ||B||)
   - Range: 0.0 (completely different) to 1.0 (identical)
   - O(n²) complexity for n documents

2. **Configurable Threshold**
   - Default: 0.7 (70% similarity)
   - Range: 0.5 to 1.0
   - Pairs above threshold are flagged

3. **Results**
   - Similar pairs list (sorted by similarity)
   - Similarity matrix (heatmap)
   - Statistics (avg, min, max)

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload one or more documents |
| GET | `/api/documents` | Get all uploaded documents |
| GET | `/api/documents/{id}` | Get specific document metadata |
| DELETE | `/api/documents/{id}` | Delete a document |
| DELETE | `/api/documents` | Delete all documents |
| POST | `/api/analyze` | Start similarity analysis |
| GET | `/api/results/{job_id}` | Get analysis results |
| GET | `/api/health` | Health check |

### Frontend Features

1. **Document Upload**
   - Drag-and-drop interface
   - File browser fallback
   - Progress tracking
   - Multi-file support

2. **Document Management**
   - List view with metadata
   - Individual/bulk deletion
   - Refresh functionality
   - Document count

3. **Analysis Configuration**
   - Threshold slider (50%-100%)
   - Include all pairs toggle
   - Real-time updates

4. **Results Visualization**
   - **Similar Pairs Tab**
     - Sorted list
     - Search/filter
     - Pagination
     - Color-coded similarity
   
   - **Similarity Matrix Tab**
     - Interactive heatmap
     - Hover tooltips
     - Color gradient
   
   - **Statistics Tab**
     - Total pairs
     - Flagged pairs
     - Avg/min/max similarity
     - Processing time

5. **Export Functionality**
   - JSON export (full results)
   - CSV export (pairs list)
   - Downloadable files

## Configuration

### Backend Environment Variables

```bash
# Application Settings
APP_NAME="Document Similarity API"
APP_VERSION="1.0.0"
DEBUG=true
LOG_LEVEL="INFO"

# Server Settings
HOST="0.0.0.0"
PORT=8000
RELOAD=true

# CORS Settings
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"

# File Upload Settings
MAX_UPLOAD_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=".pdf,.txt"

# Spark Settings
SPARK_APP_NAME="DocumentSimilarity"
SPARK_MASTER="local[*]"
SPARK_DRIVER_MEMORY="2g"
SPARK_EXECUTOR_MEMORY="2g"

# Paths
UPLOAD_DIR="data/uploads"
METADATA_DIR="data/metadata"
RESULTS_DIR="data/results"
LOG_DIR="logs"

# Analysis Settings
DEFAULT_SIMILARITY_THRESHOLD=0.7
DEFAULT_INCLUDE_ALL_PAIRS=true
```

### Frontend API Configuration

```javascript
// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

## Error Handling

### Backend Exceptions

| Exception | HTTP Code | Usage |
|-----------|-----------|-------|
| `DocumentNotFoundError` | 404 | Document doesn't exist |
| `InvalidDocumentError` | 400 | Invalid file format/content |
| `DocumentProcessingError` | 500 | Processing failed |
| `FileTooLargeError` | 413 | File exceeds size limit |
| `InvalidFileTypeError` | 400 | Unsupported file type |
| `SparkSessionError` | 500 | Spark initialization failed |
| `AnalysisJobNotFoundError` | 404 | Job ID doesn't exist |
| `AnalysisJobFailedError` | 500 | Analysis failed |

### Frontend Error Handling

- Global error context
- Error message component
- Toast notifications
- Automatic error clearing
- User-friendly messages

## Performance Considerations

### Backend Optimization
- Singleton Spark session (avoid recreation)
- Async job processing (ThreadPoolExecutor)
- Efficient file I/O (streaming)
- JSON caching for results
- Proper logging levels

### Frontend Optimization
- Code splitting (lazy loading)
- Memoization (useMemo, useCallback)
- Virtual scrolling for large lists
- Debounced search
- Optimistic UI updates

## Security Considerations

### Backend Security
- File type validation
- File size limits
- Path traversal prevention
- Input sanitization
- CORS configuration
- Rate limiting (TODO)

### Frontend Security
- XSS prevention (React default)
- CSRF tokens (TODO)
- Input validation
- Secure API calls
- Environment variables

## Deployment

### Backend Deployment

**Development:**
```bash
cd backend
python main.py
```

**Production:**
```bash
# Using Gunicorn
pip install gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Using systemd service
sudo systemctl enable doc-similarity.service
sudo systemctl start doc-similarity.service
```

### Frontend Deployment

**Development:**
```bash
cd frontend
npm run dev
```

**Production Build:**
```bash
npm run build
# Output: dist/ folder

# Serve with nginx
sudo cp -r dist/* /var/www/html/
```

### Docker Deployment (TODO)

```dockerfile
# Backend Dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
```

## Monitoring and Logging

### Backend Logging
- **Console Handler**: Development (colorized)
- **File Handler**: Production (JSON format)
- **Rotating File Handler**: Auto-rotation at 10MB
- **Log Levels**: DEBUG, INFO, WARNING, ERROR, CRITICAL

### Log Locations
- Application logs: `backend/logs/app.log`
- Error logs: `backend/logs/error.log`
- Access logs: Uvicorn console output

### Metrics (TODO)
- Request count/rate
- Response times
- Error rates
- Document processing times
- Spark job durations

## Future Enhancements

### Backend
- [ ] Database integration (PostgreSQL)
- [ ] User authentication (JWT)
- [ ] API rate limiting
- [ ] Caching layer (Redis)
- [ ] Support for DOCX, HTML, Markdown
- [ ] Scheduled batch processing
- [ ] Advanced NLP (LSA, Word2Vec)
- [ ] Language detection
- [ ] Multi-language support

### Frontend
- [ ] User dashboard
- [ ] Document comparison view
- [ ] Text highlighting
- [ ] Real-time collaboration
- [ ] Mobile responsive design
- [ ] Dark mode
- [ ] Advanced filters
- [ ] Saved searches
- [ ] Export to PDF report

## Troubleshooting

See `TESTING_GUIDE.md` for detailed troubleshooting steps.

### Common Issues

1. **Python version mismatch**
   - Solution: Install Python 3.10.x specifically

2. **Spark session fails**
   - Check Java installation
   - Verify available memory (2GB+)

3. **Port conflicts**
   - Backend: Change `PORT` in `.env`
   - Frontend: Use `--port` flag with Vite

4. **CORS errors**
   - Verify `CORS_ORIGINS` in `.env`
   - Check proxy in `vite.config.js`

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

### Code Style
- **Backend**: PEP 8, type hints, docstrings
- **Frontend**: ESLint, Prettier
- **Commits**: Conventional Commits format

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [repository]/issues
- Documentation: See all .md files in project root
- Email: [your-email]

## Acknowledgments

- PySpark community
- FastAPI framework
- React team
- Tailwind CSS
- All open-source contributors
