/**
 * Results Display Component
 * Displays analysis results with tabs for different views
 */

import { useState } from 'react';
import { Download, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SimilarityMatrix from './SimilarityMatrix';
import SimilarPairs from './SimilarPairs';
import { formatPercentage, downloadJSON, downloadCSV } from '../utils/helpers';

const ResultsDisplay = () => {
  const { results } = useApp();
  const [activeTab, setActiveTab] = useState('pairs');
  
  if (!results || results.status !== 'completed') {
    return null;
  }
  
  const tabs = [
    { id: 'pairs', label: 'Similar Pairs', icon: TrendingUp },
    { id: 'matrix', label: 'Similarity Matrix', icon: TrendingUp },
    { id: 'stats', label: 'Statistics', icon: TrendingUp },
  ];
  
  const handleExport = (format) => {
    if (format === 'json') {
      downloadJSON(results, `similarity-results-${Date.now()}.json`);
    } else if (format === 'csv') {
      const csvData = results.similar_pairs.map(pair => ({
        'Document 1': pair.doc1_id,
        'Document 2': pair.doc2_id,
        'Similarity': pair.similarity,
        'Flagged': pair.flagged ? 'Yes' : 'No',
      }));
      downloadCSV(csvData, `similarity-results-${Date.now()}.csv`);
    }
  };
  
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Results</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('json')}
            className="btn btn-secondary text-sm"
          >
            <Download className="w-4 h-4 mr-1" />
            JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="btn btn-secondary text-sm"
          >
            <Download className="w-4 h-4 mr-1" />
            CSV
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>
      
      {/* Tab Content */}
      {activeTab === 'pairs' && <SimilarPairs pairs={results.similar_pairs} />}
      
      {activeTab === 'matrix' && (
        <SimilarityMatrix 
          matrix={results.similarity_matrix} 
          documentNames={results.document_names}
        />
      )}
      
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Pairs</p>
              <p className="text-2xl font-bold text-blue-600">
                {results.statistics.total_comparisons}
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Flagged Pairs</p>
              <p className="text-2xl font-bold text-green-600">
                {results.statistics.flagged_pairs}
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Avg Similarity</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatPercentage(results.statistics.avg_similarity)}
              </p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Max Similarity</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatPercentage(results.statistics.max_similarity)}
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-gray-800 mb-2">Analysis Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Documents Analyzed:</span>
                <span className="ml-2 font-medium">
                  {results.statistics.total_documents}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Processing Time:</span>
                <span className="ml-2 font-medium">
                  {results.statistics.processing_time || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Threshold:</span>
                <span className="ml-2 font-medium">
                  {results.statistics.threshold ? formatPercentage(results.statistics.threshold) : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Min Similarity:</span>
                <span className="ml-2 font-medium">
                  {formatPercentage(results.statistics.min_similarity)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
