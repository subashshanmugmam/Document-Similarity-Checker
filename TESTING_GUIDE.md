# Document Similarity Checker - Testing Guide

## Prerequisites Check

Before starting, verify all prerequisites:

```bash
# Check Python version (must be 3.10.x)
python --version

# Run backend verification script
cd backend
python verify_setup.py
```

## Backend Testing

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the Backend Server

```bash
python main.py
```

Expected output:
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 3. Test API Endpoints

#### Health Check
```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "spark_status": "active",
  "timestamp": "2024-..."
}
```

#### API Documentation
Visit: http://localhost:8000/docs

This opens the interactive Swagger UI where you can test all endpoints.

### 4. Manual API Testing

#### Upload Documents
```bash
curl -X POST "http://localhost:8000/api/upload" \
  -F "files=@document1.pdf" \
  -F "files=@document2.txt"
```

#### Get Documents
```bash
curl http://localhost:8000/api/documents
```

#### Analyze Documents
```bash
curl -X POST "http://localhost:8000/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "document_ids": null,
    "threshold": 0.7,
    "include_all_pairs": true
  }'
```

#### Get Results
```bash
curl http://localhost:8000/api/results/{job_id}
```

## Frontend Testing

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Expected output:
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 3. Access Application

Open browser: http://localhost:5173

## Full Integration Testing

### Test Scenario 1: Basic Similarity Check

1. **Upload Documents**
   - Click upload area or drag-drop 2-3 PDF/TXT files
   - Verify files appear in document list
   - Check file sizes and upload times

2. **Configure Analysis**
   - Click "Configure" button
   - Set threshold to 70%
   - Enable "Include all document pairs"

3. **Run Analysis**
   - Click "Analyze Documents"
   - Wait for processing (spinner appears)
   - Verify success notification

4. **View Results**
   - Check "Similar Pairs" tab
   - Verify flagged pairs (>70% similarity)
   - Use search and sort features
   
5. **View Matrix**
   - Switch to "Similarity Matrix" tab
   - Hover over cells to see values
   - Verify color coding

6. **View Statistics**
   - Switch to "Statistics" tab
   - Check total pairs count
   - Verify processing time

7. **Export Results**
   - Click "JSON" button → downloads results.json
   - Click "CSV" button → downloads results.csv
   - Open files to verify data

### Test Scenario 2: Document Management

1. **Upload Multiple Documents**
   - Upload 5+ documents
   - Verify all appear in list

2. **Delete Individual Document**
   - Click trash icon on one document
   - Confirm deletion
   - Verify document removed

3. **Refresh Document List**
   - Click "Refresh" button
   - Verify list updates

4. **Delete All Documents**
   - Click "Delete All" button
   - Confirm deletion
   - Verify empty state message

### Test Scenario 3: Error Handling

1. **Upload Invalid File**
   - Try uploading .exe or .zip file
   - Verify error message appears

2. **Upload Oversized File**
   - Try uploading >10MB file
   - Verify size limit error

3. **Analyze Without Documents**
   - Click "Analyze" with no documents
   - Verify warning message

4. **Analyze With One Document**
   - Upload only 1 document
   - Try to analyze
   - Verify "need 2 documents" error

## Performance Testing

### Backend Performance

Test with large documents:

```bash
# Generate test files (Linux/Mac)
for i in {1..10}; do
  echo "Test content for document $i" > test_doc_$i.txt
  # Repeat content 1000 times
  for j in {1..1000}; do
    echo "Lorem ipsum dolor sit amet..." >> test_doc_$i.txt
  done
done

# Upload all files
for file in test_doc_*.txt; do
  curl -X POST "http://localhost:8000/api/upload" -F "files=@$file"
done

# Analyze and measure time
time curl -X POST "http://localhost:8000/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{"document_ids": null, "threshold": 0.7}'
```

Expected performance:
- 10 documents: 5-15 seconds
- 20 documents: 15-30 seconds
- 50 documents: 1-2 minutes

### Frontend Performance

1. **Load Time**
   - Initial page load: <2 seconds
   - Document list rendering: <500ms

2. **Responsiveness**
   - Upload feedback: Immediate
   - Analysis status updates: Real-time
   - Results rendering: <1 second

## Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8000
kill -9 <PID>
```

**Spark session fails:**
- Check Java installation: `java -version`
- Verify JAVA_HOME environment variable
- Check available memory (need 2GB+)

**Module import errors:**
```bash
pip install --upgrade -r requirements.txt
```

### Frontend Issues

**Port 5173 already in use:**
```bash
# Kill process and restart
npm run dev -- --port 3000
```

**API connection errors:**
- Verify backend is running on port 8000
- Check proxy configuration in `vite.config.js`
- Check browser console for CORS errors

**Build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Automated Testing

### Backend Unit Tests (Future)

```python
# tests/test_document_processor.py
import pytest
from app.services.document_processor import DocumentProcessor

def test_read_pdf():
    processor = DocumentProcessor()
    content = processor.read_pdf_file("test.pdf")
    assert len(content) > 0

def test_tfidf_pipeline():
    processor = DocumentProcessor()
    df = processor.build_tfidf_pipeline([
        ("doc1", "test content"),
        ("doc2", "test data")
    ])
    assert df.count() == 2
```

Run tests:
```bash
pytest tests/ -v
```

### Frontend Tests (Future)

```javascript
// tests/App.test.jsx
import { render, screen } from '@testing-library/react';
import App from '../src/App';

test('renders header', () => {
  render(<App />);
  expect(screen.getByText(/Document Similarity Checker/i)).toBeInTheDocument();
});
```

Run tests:
```bash
npm test
```

## Load Testing

Use Apache Bench for load testing:

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test upload endpoint
ab -n 100 -c 10 -p test.json -T application/json \
  http://localhost:8000/api/analyze
```

## CI/CD Testing (Future)

GitHub Actions workflow:

```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      - run: pip install -r backend/requirements.txt
      - run: pytest backend/tests/
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
        working-directory: frontend
      - run: npm test
        working-directory: frontend
```

## Success Criteria

✅ Backend starts without errors
✅ All API endpoints return 200 status
✅ Frontend loads without console errors
✅ Documents upload successfully
✅ Analysis completes without errors
✅ Results display correctly
✅ Export functionality works
✅ Error handling works as expected
✅ Performance meets benchmarks

## Next Steps

After successful testing:

1. **Production Deployment**
   - Configure production environment variables
   - Set up reverse proxy (nginx)
   - Enable HTTPS
   - Configure log aggregation

2. **Monitoring**
   - Set up application monitoring (Prometheus, Grafana)
   - Configure error tracking (Sentry)
   - Set up uptime monitoring

3. **Optimization**
   - Profile slow endpoints
   - Optimize Spark configuration
   - Add database for metadata (currently JSON)
   - Implement caching (Redis)

4. **Features**
   - Add user authentication
   - Support more file formats (DOCX, HTML)
   - Add batch processing
   - Implement scheduled analysis
