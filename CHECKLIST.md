# 🚀 Pre-Flight Checklist

Use this checklist before running the application for the first time.

---

## ✅ System Prerequisites

### Required Software
- [ ] **Python 3.10.x** installed (check: `python --version`)
  - ⚠️ Must be 3.10.x - NOT 3.11, 3.12, or 3.13
- [ ] **Node.js 18+** installed (check: `node --version`)
- [ ] **Java 8 or 11** installed (check: `java -version`)
  - Required for PySpark
- [ ] **npm** package manager (check: `npm --version`)

### System Requirements
- [ ] At least **2GB RAM** available
- [ ] At least **1GB free disk space**
- [ ] **Ports 8000 and 5173** available
  - Check: `netstat -ano | findstr :8000`
  - Check: `netstat -ano | findstr :5173`

---

## ✅ Backend Verification

### File Structure
Navigate to `backend/` and verify these files exist:

- [ ] `main.py` - FastAPI application entry point
- [ ] `requirements.txt` - Python dependencies
- [ ] `verify_setup.py` - Prerequisites checker
- [ ] `.env.example` - Environment template
- [ ] `README.md` - Backend documentation

### Directories
- [ ] `app/` - Application code
  - [ ] `api/` - Routes and middleware
  - [ ] `core/` - Config, logging, exceptions
  - [ ] `models/` - Pydantic schemas
  - [ ] `services/` - Business logic
  - [ ] `utils/` - Helper functions

### Installation Test
```bash
cd backend
python verify_setup.py
```
Expected: ✅ All checks pass

### Dependencies Test
```bash
pip install -r requirements.txt
```
Expected: All packages install without errors

### Server Test
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

### API Test
While server is running, open browser:
- [ ] http://localhost:8000/api/health returns JSON
- [ ] http://localhost:8000/docs shows Swagger UI

---

## ✅ Frontend Verification

### File Structure
Navigate to `frontend/` and verify these files exist:

- [ ] `package.json` - Dependencies
- [ ] `vite.config.js` - Vite configuration
- [ ] `tailwind.config.js` - Tailwind setup
- [ ] `index.html` - HTML template

### Source Files
- [ ] `src/main.jsx` - React entry point
- [ ] `src/App.jsx` - Main component
- [ ] `src/index.css` - Global styles

### Directories
- [ ] `src/components/` - React components (7 files)
- [ ] `src/services/` - API client
- [ ] `src/context/` - State management
- [ ] `src/utils/` - Helper functions

### Dependencies Test
```bash
cd frontend
npm install
```
Expected: All packages install without errors

### Development Server Test
```bash
npm run dev
```
Expected output:
```
VITE v5.0.8  ready in 500 ms
➜  Local:   http://localhost:5173/
```

### Build Test
```bash
npm run build
```
Expected: Builds successfully, creates `dist/` folder

---

## ✅ Integration Test

### Start Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
```
Wait for: "Uvicorn running on http://0.0.0.0:8000"

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Wait for: "Local: http://localhost:5173/"

### Browser Test
Open http://localhost:5173 and verify:

- [ ] Page loads without errors
- [ ] No console errors (press F12 → Console)
- [ ] Header displays "Document Similarity Checker"
- [ ] Upload area is visible
- [ ] "Analyze Documents" button is visible

### Upload Test
- [ ] Click upload area or drag a file
- [ ] File appears in document list
- [ ] File size and upload time are shown
- [ ] Can delete file

### Analysis Test (need 2+ documents)
- [ ] Upload at least 2 files
- [ ] "Analyze Documents" button becomes enabled
- [ ] Click "Analyze Documents"
- [ ] Loading spinner appears
- [ ] Success message displays
- [ ] Results appear in tabs

### Results Test
- [ ] "Similar Pairs" tab shows pairs
- [ ] "Similarity Matrix" tab shows heatmap
- [ ] "Statistics" tab shows metrics
- [ ] Can export to JSON
- [ ] Can export to CSV

---

## ✅ Documentation Verification

Verify these files exist in project root:

- [ ] `README.md` - Project overview
- [ ] `QUICK_START.md` - Setup guide
- [ ] `TESTING_GUIDE.md` - Testing instructions
- [ ] `COMPLETE_DOCUMENTATION.md` - Full reference
- [ ] `PROJECT_STRUCTURE.md` - Architecture
- [ ] `COMPLETION_SUMMARY.md` - Implementation summary
- [ ] `CHECKLIST.md` - This file
- [ ] `setup.ps1` - Automated setup script

---

## ✅ Code Quality Checks

### Backend Code
- [ ] All Python files have docstrings
- [ ] Type hints are used throughout
- [ ] No syntax errors (run: `python -m py_compile main.py`)
- [ ] Imports resolve correctly

### Frontend Code
- [ ] All components are properly formatted
- [ ] No JSX syntax errors
- [ ] All imports resolve correctly
- [ ] No console warnings

### Configuration Files
- [ ] `.env` file exists (copy from `.env.example`)
- [ ] All paths in `.env` are correct
- [ ] `vite.config.js` proxy points to backend
- [ ] `tailwind.config.js` content paths are correct

---

## ✅ Common Issues

### Python Version Error
**Problem**: "Python 3.10 required" error
**Solution**: 
```bash
# Check version
python --version

# If wrong version, install Python 3.10.x specifically
# Download from: https://www.python.org/downloads/
```

### Port Already in Use
**Problem**: "Address already in use" error
**Solution**:
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or change port in backend/.env
PORT=8001
```

### Spark Session Error
**Problem**: "Failed to initialize Spark session"
**Solution**:
- Check Java installation: `java -version`
- Set JAVA_HOME environment variable
- Ensure 2GB+ RAM available

### Module Not Found
**Problem**: "ModuleNotFoundError: No module named 'X'"
**Solution**:
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

### CORS Error
**Problem**: "CORS policy" error in browser console
**Solution**:
- Verify backend is running
- Check `CORS_ORIGINS` in `.env`
- Ensure frontend proxy is configured

---

## ✅ Performance Benchmarks

After setup, verify performance meets expectations:

### Backend
- [ ] Health check responds in <100ms
- [ ] Document upload completes in <500ms
- [ ] 10 documents analyze in 5-15 seconds

### Frontend
- [ ] Initial page load <3 seconds
- [ ] Component interactions feel responsive
- [ ] No lag when typing or clicking

---

## ✅ Final Checklist

Before considering setup complete:

- [ ] Both servers start without errors
- [ ] Can upload documents successfully
- [ ] Can run analysis on 2+ documents
- [ ] Results display in all three tabs
- [ ] Can export results (JSON and CSV)
- [ ] No errors in browser console
- [ ] No errors in backend logs
- [ ] Documentation is accessible
- [ ] Performance is acceptable

---

## 🎉 Success!

If all checks pass, your Document Similarity Checker is ready to use!

### Next Steps:
1. Read `TESTING_GUIDE.md` for comprehensive testing
2. Review `COMPLETE_DOCUMENTATION.md` for full features
3. Explore the code in `PROJECT_STRUCTURE.md`

### Need Help?
- Check `TESTING_GUIDE.md` troubleshooting section
- Review `QUICK_START.md` for setup details
- Look for error messages in backend logs (`backend/logs/`)

---

## 📊 Quick Reference

### Backend Commands
```bash
cd backend
python verify_setup.py      # Check prerequisites
pip install -r requirements.txt  # Install dependencies
python main.py              # Start server
```

### Frontend Commands
```bash
cd frontend
npm install                 # Install dependencies
npm run dev                 # Start dev server
npm run build              # Build for production
```

### API Endpoints
- Health: http://localhost:8000/api/health
- Docs: http://localhost:8000/docs
- Upload: POST http://localhost:8000/api/upload
- Analyze: POST http://localhost:8000/api/analyze

### Frontend URLs
- Dev: http://localhost:5173
- After build: Serve `dist/` folder

---

*Last updated: Project completion*
*Version: 1.0.0*
