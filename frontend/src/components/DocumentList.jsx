/**
 * Document List Component
 * Displays uploaded documents with delete functionality
 */

import { useEffect } from 'react';
import { FileText, Trash2, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import apiService from '../services/api';
import { formatFileSize, formatDate } from '../utils/helpers';

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
      <div className="card">
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Documents ({documents.length})
        </h2>
        <div className="flex gap-2">
          <button
            onClick={loadDocuments}
            className="btn btn-secondary text-sm"
            disabled={isLoadingDocuments}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </button>
          {documents.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="btn btn-danger text-sm"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete All
            </button>
          )}
        </div>
      </div>
      
      {documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No documents uploaded</p>
          <p className="text-sm text-gray-400 mt-2">
            Upload documents to get started
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {documents.map((doc) => (
            <div
              key={doc.doc_id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {doc.filename}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span>{formatFileSize(doc.file_size)}</span>
                    <span>{formatDate(doc.upload_timestamp)}</span>
                    {doc.word_count && (
                      <span>{doc.word_count} words</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(doc.doc_id, doc.filename)}
                className="text-red-500 hover:text-red-700 p-2 ml-2"
                title="Delete document"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
