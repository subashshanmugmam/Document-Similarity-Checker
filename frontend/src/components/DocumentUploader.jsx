/**
 * Document Uploader Component
 * Drag-and-drop file upload interface
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import apiService from '../services/api';
import { formatFileSize, validateFile } from '../utils/helpers';

const DocumentUploader = () => {
  const {
    setDocuments,
    setUploadProgress,
    showError,
    showSuccess,
    setIsLoadingDocuments,
  } = useApp();
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const onDrop = useCallback((acceptedFiles) => {
    // Validate files
    const validFiles = [];
    const errors = [];
    
    acceptedFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });
    
    if (errors.length > 0) {
      showError(errors.join('\n'));
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, [showError]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
    },
    multiple: true,
  });
  
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    console.log('Uploading files:', selectedFiles);
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const result = await apiService.uploadDocuments(
        selectedFiles,
        (progress) => {
          console.log('Upload progress:', progress);
          setUploadProgress(progress);
        }
      );
      
      console.log('Upload result:', result);
      showSuccess(`Uploaded ${result.total_uploaded} document(s) successfully`);
      
      // Refresh document list
      setIsLoadingDocuments(true);
      const docsResponse = await apiService.getDocuments();
      console.log('Documents after upload:', docsResponse);
      setDocuments(docsResponse.documents);
      
      // Clear selected files
      setSelectedFiles([]);
      setUploadProgress(0);
    } catch (error) {
      console.error('Upload error:', error);
      showError(error.message);
    } finally {
      setIsUploading(false);
      setIsLoadingDocuments(false);
    }
  };
  
  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Upload Documents</h2>
      
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop files here...</p>
        ) : (
          <>
            <p className="text-gray-600 font-medium mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports .txt and .pdf files (max 50MB each)
            </p>
          </>
        )}
      </div>
      
      {/* Selected files list */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold text-gray-700 mb-2">
            Selected Files ({selectedFiles.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                  disabled={isUploading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Upload button */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || isUploading}
          className="btn btn-primary flex-1"
        >
          {isUploading ? (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              Uploading...
            </>
          ) : (
            `Upload ${selectedFiles.length} File(s)`
          )}
        </button>
        
        {selectedFiles.length > 0 && !isUploading && (
          <button
            onClick={() => setSelectedFiles([])}
            className="btn btn-secondary"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentUploader;
