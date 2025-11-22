/**
 * App Context
 * Global state management using React Context API
 */

import { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // Documents state
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [results, setResults] = useState(null);
  
  // Configuration state
  const [config, setConfig] = useState({
    threshold: 0.7,
    includeAllPairs: true,
  });
  
  // Error state
  const [error, setError] = useState(null);
  
  // Upload progress
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Success message
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Update documents
  const updateDocuments = useCallback((newDocuments) => {
    setDocuments(newDocuments);
  }, []);
  
  // Update configuration
  const updateConfig = useCallback((newConfig) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);
  
  // Set error with auto-clear
  const showError = useCallback((errorMessage) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000); // Clear after 5 seconds
  }, []);
  
  // Set success with auto-clear
  const showSuccess = useCallback((message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000); // Clear after 3 seconds
  }, []);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Clear success
  const clearSuccess = useCallback(() => {
    setSuccessMessage(null);
  }, []);
  
  // Clear results
  const clearResults = useCallback(() => {
    setResults(null);
    setCurrentJobId(null);
  }, []);
  
  const value = {
    // State
    documents,
    isLoadingDocuments,
    isAnalyzing,
    currentJobId,
    results,
    config,
    error,
    uploadProgress,
    successMessage,
    
    // Actions
    setDocuments: updateDocuments,
    setIsLoadingDocuments,
    setIsAnalyzing,
    setCurrentJobId,
    setResults,
    setConfig: updateConfig,
    setUploadProgress,
    showError,
    showSuccess,
    clearError,
    clearSuccess,
    clearResults,
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
