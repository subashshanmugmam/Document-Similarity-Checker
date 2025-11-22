/**
 * Document List Component
 * Displays uploaded documents with delete functionality
 */

import { useEffect } from 'react';
import { FileText, Trash2, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import apiService from '../services/api';
import { formatFileSize, formatDate } from '../utils/helpers';
import SkeletonLoader from './SkeletonLoader';

const DocumentList = () => {
  const {
    documents,
    setDocuments,
    isLoadingDocuments,
    setIsLoadingDocuments,
    showError,
    showSuccess,
  } = useApp();
  
  useEffect(() => {
    console.log('DocumentList mounted, loading documents...');
    loadDocuments();
  }, []);
  
  const loadDocuments = async () => {
    console.log('Loading documents from API...');
    setIsLoadingDocuments(true);
    try {
      const response = await apiService.getDocuments();
      console.log('Documents loaded:', response);
      setDocuments(response.documents);
    } catch (error) {
      console.error('Error loading documents:', error);
      showError(error.message);
    } finally {
      setIsLoadingDocuments(false);
    }
  };
  
  const handleDelete = async (docId, filename) => {
    if (!confirm(`Delete "${filename}"?`)) return;
    
    try {
      await apiService.deleteDocument(docId);
      showSuccess('Document deleted');
      loadDocuments();
    } catch (error) {
      showError(error.message);
    }
  };
  
  const handleDeleteAll = async () => {
    if (!confirm(`Delete all ${documents.length} documents?`)) return;
    
    try {
      await apiService.deleteAllDocuments();
      showSuccess('All documents deleted');
      setDocuments([]);
    } catch (error) {
      showError(error.message);
    }
  };
  
  if (isLoadingDocuments) {
    return (
      <div className="glass-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-400" />
            Documents
            <span className="text-sm font-normal text-gray-400 ml-2 animate-pulse">
              Loading...
            </span>
          </h2>
        </div>
        <div className="space-y-3">
          <SkeletonLoader type="document-card" count={3} />
        </div>
      </div>
    );
  }
  
  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-7 h-7 text-blue-400" />
          Documents
          <span className="text-sm font-normal text-gray-400 ml-2">
            ({documents.length})
          </span>
        </h2>
        <div className="flex gap-3">
          <button
            onClick={loadDocuments}
            className="btn btn-secondary text-sm"
            disabled={isLoadingDocuments}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingDocuments ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {documents.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="btn btn-danger text-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All
            </button>
          )}
        </div>
      </div>
      
      {documents.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="inline-block p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl mb-4">
            <FileText className="w-20 h-20 text-blue-400" />
          </div>
          <p className="text-gray-300 font-semibold text-lg">No documents uploaded</p>
          <p className="text-gray-500 mt-2">
            Upload documents to analyze their similarity
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          {documents.map((doc, index) => (
            <div
              key={doc.doc_id}
              className="group relative bg-gradient-to-r from-white/5 to-white/10 backdrop-blur rounded-xl p-4 border-2 border-white/10 hover:border-purple-400/50 hover:from-white/10 hover:to-white/15 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1 animate-slide-in cursor-pointer"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-purple-500/50 transition-all duration-500 group-hover:rotate-3">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate text-lg">
                      {doc.filename}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                      <span className="flex items-center gap-1">
                        📊 {formatFileSize(doc.file_size)}
                      </span>
                      <span className="flex items-center gap-1">
                        📅 {formatDate(doc.upload_timestamp)}
                      </span>
                      {doc.word_count && (
                        <span className="flex items-center gap-1">
                          📝 {doc.word_count} words
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.doc_id, doc.filename)}
                  className="text-red-400 hover:text-red-300 p-3 ml-3 hover:bg-red-500/20 rounded-lg transition-all duration-500 group-hover:scale-110 hover:rotate-12 border-2 border-transparent hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/30"
                  title="Delete document"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
