/**
 * Analysis Button Component
 * Configure and trigger document analysis
 */

import { useState } from 'react';
import { Play, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import apiService from '../services/api';

const AnalysisButton = () => {
  const {
    documents,
    config,
    setConfig,
    setIsAnalyzing,
    setCurrentJobId,
    setResults,
    showError,
    showSuccess,
  } = useApp();
  
  const [showConfig, setShowConfig] = useState(false);
  const [threshold, setThreshold] = useState(config.threshold);
  const [includeAllPairs, setIncludeAllPairs] = useState(config.includeAllPairs);
  
  const handleAnalyze = async () => {
    console.log('Analyze clicked, documents count:', documents.length);
    console.log('Documents:', documents);
    
    if (documents.length < 2) {
      showError('Need at least 2 documents for analysis');
      return;
    }
    
    setIsAnalyzing(true);
    setResults(null);
    
    try {
      // Update config
      setConfig({ threshold, includeAllPairs });
      
      // Start analysis
      const response = await apiService.analyzeDocuments({
        document_ids: null,
        threshold,
        include_all_pairs: includeAllPairs,
      });
      
      setCurrentJobId(response.job_id);
      showSuccess('Analysis started! Checking results...');
      
      // Poll for results
      const results = await apiService.pollJobResults(response.job_id);
      
      if (results.status === 'completed') {
        setResults(results);
        showSuccess('Analysis completed!');
      } else if (results.status === 'failed') {
        showError(results.error_message || 'Analysis failed');
      }
    } catch (error) {
      showError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Analysis</h2>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="btn btn-secondary text-sm"
        >
          <Settings className="w-4 h-4 mr-1" />
          Configure
        </button>
      </div>
      
      {showConfig && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Similarity Threshold: {(threshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Documents with similarity above this threshold will be flagged
            </p>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeAllPairs"
              checked={includeAllPairs}
              onChange={(e) => setIncludeAllPairs(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="includeAllPairs" className="text-sm text-gray-700">
              Include all document pairs in results
            </label>
          </div>
        </div>
      )}
      
      <button
        onClick={handleAnalyze}
        disabled={documents.length < 2}
        className="btn btn-primary w-full py-3 text-lg"
        title={documents.length < 2 ? `Need ${2 - documents.length} more document(s)` : 'Start analysis'}
      >
        <Play className="w-5 h-5 mr-2 inline" />
        Analyze Documents ({documents.length})
      </button>
      
      {documents.length < 2 && (
        <p className="text-sm text-red-500 mt-2 text-center">
          Upload at least 2 documents to start analysis
        </p>
      )}
    </div>
  );
};

export default AnalysisButton;
