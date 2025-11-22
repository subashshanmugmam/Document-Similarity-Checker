/**
 * Main App Component
 */

import { AppProvider, useApp } from './context/AppContext';
import DocumentUploader from './components/DocumentUploader';
import DocumentList from './components/DocumentList';
import AnalysisButton from './components/AnalysisButton';
import ResultsDisplay from './components/ResultsDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { CheckCircle, X } from 'lucide-react';

function AppContent() {
  const { error, successMessage, isAnalyzing, setError, setSuccessMessage } = useApp();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Document Similarity Checker
          </h1>
          <p className="text-gray-600 mt-2">
            Upload documents and analyze their similarity using advanced TF-IDF algorithms
          </p>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Notifications */}
        <div className="mb-6 space-y-2">
          {error && (
            <ErrorMessage error={error} onClose={() => setError(null)} />
          )}
          
          {successMessage && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start justify-between">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-500 hover:text-green-700 ml-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
        
        {/* Analysis Loading Overlay */}
        {isAnalyzing && (
          <div className="card mb-6 bg-blue-50 border-2 border-blue-300">
            <LoadingSpinner
              message="Analyzing documents with PySpark... This may take a few moments."
              size="lg"
            />
          </div>
        )}
        
        {/* Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <DocumentUploader />
          <AnalysisButton />
        </div>
        
        {/* Documents List */}
        <div className="mb-6">
          <DocumentList />
        </div>
        
        {/* Results */}
        <ResultsDisplay />
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          <p>
            Powered by <span className="font-medium">PySpark</span> and{' '}
            <span className="font-medium">FastAPI</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
