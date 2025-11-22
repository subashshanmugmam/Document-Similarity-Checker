/**
 * API Service
 * Handles all communication with the backend API
 */

import axios from 'axios';

// Configure axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes for large file processing
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    // Extract error message
    const errorMessage = 
      error.response?.data?.error?.message ||
      error.response?.data?.detail ||
      error.message ||
      'An unexpected error occurred';
    
    return Promise.reject(new Error(errorMessage));
  }
);

/**
 * API Service Methods
 */
const apiService = {
  /**
   * Health check
   */
  async healthCheck() {
    const response = await api.get('/api/health');
    return response.data;
  },

  /**
   * Upload documents
   * @param {FileList} files - Files to upload
   * @param {Function} onProgress - Progress callback
   */
  async uploadDocuments(files, onProgress) {
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    
    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        if (onProgress) {
          onProgress(percentCompleted);
        }
      },
    });
    
    return response.data;
  },

  /**
   * Get list of documents
   */
  async getDocuments() {
    const response = await api.get('/api/documents');
    return response.data;
  },

  /**
   * Delete a specific document
   * @param {string} docId - Document ID
   */
  async deleteDocument(docId) {
    const response = await api.delete(`/api/documents/${docId}`);
    return response.data;
  },

  /**
   * Delete all documents
   */
  async deleteAllDocuments() {
    const response = await api.delete('/api/documents');
    return response.data;
  },

  /**
   * Start document analysis
   * @param {Object} config - Analysis configuration
   * @param {Array|null} config.document_ids - Specific document IDs or null for all
   * @param {number} config.threshold - Similarity threshold (0.5-1.0)
   * @param {boolean} config.include_all_pairs - Include all pairs or only flagged
   */
  async analyzeDocuments(config) {
    const payload = {
      document_ids: config.document_ids || null,
      config: {
        threshold: config.threshold || 0.7,
        include_all_pairs: config.include_all_pairs !== false,
      },
    };
    
    console.log('Sending analysis request:', payload);
    
    const response = await api.post('/api/analyze', payload);
    return response.data;
  },

  /**
   * Get analysis results
   * @param {string} jobId - Job ID
   */
  async getResults(jobId) {
    const response = await api.get(`/api/results/${jobId}`);
    return response.data;
  },

  /**
   * Get all jobs
   */
  async getJobs() {
    const response = await api.get('/api/jobs');
    return response.data;
  },

  /**
   * Poll for job completion
   * @param {string} jobId - Job ID
   * @param {number} interval - Polling interval in ms (default: 2000)
   * @param {number} maxAttempts - Maximum attempts (default: 150 = 5 minutes)
   */
  async pollJobResults(jobId, interval = 2000, maxAttempts = 150) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const result = await this.getResults(jobId);
      
      if (result.status === 'completed' || result.status === 'failed') {
        return result;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, interval));
      attempts++;
    }
    
    throw new Error('Analysis timeout - please try again');
  },
};

export default apiService;
