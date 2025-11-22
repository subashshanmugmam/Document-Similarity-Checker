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
      <h2 className="text-2xl font-bold mb-4 text-white">Upload Documents</h2>
      
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`
          border-3 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-500 transform
          ${isDragActive 
            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 scale-105 shadow-2xl shadow-blue-500/30' 
            : 'border-gray-300 hover:border-purple-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-purple-50/30 hover:scale-102 hover:shadow-xl'
          }
        `}
        style={{
          borderWidth: '3px'
        }}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        
        {isDragActive ? (
          <p className="text-blue-200 font-medium">Drop files here...</p>
        ) : (
          <>
            <p className="text-white font-medium mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-300">
              Supports .txt and .pdf files (max 50MB each)
            </p>
          </>
        )}
      </div>
      
      {/* Selected files list */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold text-white mb-2">
            Selected Files ({selectedFiles.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-purple-50/30 rounded-lg border-2 border-transparent hover:border-purple-300 transition-all duration-500 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-300">
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
          className="btn btn-primary flex-1 relative overflow-hidden group"
        >
          {/* Accent glow effect */}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></span>
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
