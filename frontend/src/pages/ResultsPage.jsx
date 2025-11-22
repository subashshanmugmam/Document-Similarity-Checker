/**
 * Results Page Component
 * Dedicated page for displaying analysis results
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, TrendingUp, BarChart3, FileText, PieChart, Network } from 'lucide-react';
import SimilarityMatrix from '../components/SimilarityMatrix';
import SimilarPairs from '../components/SimilarPairs';
import SimilarityDistributionChart from '../components/SimilarityDistributionChart';
import TopSimilaritiesChart from '../components/TopSimilaritiesChart';
import DocumentNetworkGraph from '../components/DocumentNetworkGraph';
import { formatPercentage, downloadJSON, downloadCSV } from '../utils/helpers';
import { ScrollReveal } from '../hooks/useScrollReveal';
import apiService from '../services/api';

const ResultsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pairs');

  useEffect(() => {
    const fetchResults = async () => {
      if (!jobId) {
        setError('No job ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await apiService.getJobResults(jobId);
        
        if (data.status === 'completed') {
          setResults(data);
        } else if (data.status === 'failed') {
          setError(data.error_message || 'Analysis failed');
        } else {
          setError('Analysis is still in progress');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [jobId]);

  const tabs = [
    { id: 'pairs', label: 'Similar Pairs', icon: TrendingUp },
    { id: 'matrix', label: 'Similarity Matrix', icon: BarChart3 },
    { id: 'distribution', label: 'Distribution', icon: PieChart },
    { id: 'topSimilar', label: 'Top Similarities', icon: BarChart3 },
    { id: 'network', label: 'Network Graph', icon: Network },
    { id: 'stats', label: 'Statistics', icon: FileText },
  ];

  const handleExport = (format) => {
    if (format === 'json') {
      downloadJSON(results, `similarity-results-${jobId}.json`);
    } else if (format === 'csv') {
      const csvData = results.similar_pairs.map(pair => ({
        'Document 1': pair.doc1_id,
        'Document 2': pair.doc2_id,
        'Similarity': pair.similarity,
        'Flagged': pair.flagged ? 'Yes' : 'No',
      }));
      downloadCSV(csvData, `similarity-results-${jobId}.csv`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="glass-card max-w-md w-full text-center animate-pulse-glow">
          <div className="inline-block p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl mb-4">
            <BarChart3 className="w-20 h-20 text-blue-400 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Results...</h2>
          <p className="text-gray-400">Fetching analysis results</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full text-center">
          <div className="inline-block p-6 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-3xl mb-4">
            <FileText className="w-20 h-20 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Results</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!results || results.status !== 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-white mb-2">No Results Available</h2>
          <p className="text-gray-400 mb-6">Analysis results are not ready yet</p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-2xl">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary mb-4 animate-slide-in"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </button>
          <div className="flex items-center justify-between">
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-white mb-2">Analysis Results</h1>
              <p className="text-gray-400">Job ID: {jobId}</p>
            </div>
            <div className="flex gap-2 animate-slide-in" style={{ animationDelay: '0.1s' }}>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        <ScrollReveal animation="fade-up" delay={100}>
          <div className="glass-card mb-6">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-500
                      ${activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="animate-fade-in">
              {activeTab === 'pairs' && (
                <SimilarPairs pairs={results.similar_pairs} />
              )}
              
              {activeTab === 'matrix' && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Similarity Matrix Heatmap</h3>
                  <p className="text-gray-300 mb-4 text-sm">
                    Interactive heatmap showing similarity scores between all document pairs. 
                    Hover over cells to see detailed similarity values.
                  </p>
                  <SimilarityMatrix 
                    matrix={results.similarity_matrix} 
                    documentNames={results.document_names || results.document_ids}
                  />
                </div>
              )}
              
              {activeTab === 'distribution' && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Similarity Distribution</h3>
                  <p className="text-gray-300 mb-4 text-sm">
                    Distribution of document pairs across different similarity ranges.
                  </p>
                  <SimilarityDistributionChart pairs={results.similar_pairs} />
                </div>
              )}
              
              {activeTab === 'topSimilar' && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Top 10 Most Similar Pairs</h3>
                  <p className="text-gray-300 mb-4 text-sm">
                    Ranking of document pairs with highest similarity scores. Red borders indicate flagged pairs.
                  </p>
                  <TopSimilaritiesChart pairs={results.similar_pairs} topN={10} />
                </div>
              )}
              
              {activeTab === 'network' && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Document Network Graph</h3>
                  <p className="text-gray-300 mb-4 text-sm">
                    Visual representation of document relationships. Node size shows connection count, color indicates similarity strength.
                  </p>
                  <DocumentNetworkGraph 
                    pairs={results.similar_pairs} 
                    threshold={results.threshold || 0.5}
                  />
                </div>
              )}
              
              {activeTab === 'stats' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur rounded-xl p-6 border-2 border-blue-400/30 hover:border-blue-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1">
                      <p className="text-blue-300 text-sm font-medium mb-2">Total Pairs</p>
                      <p className="text-4xl font-bold text-white">{results.similar_pairs.length}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur rounded-xl p-6 border-2 border-purple-400/30 hover:border-purple-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1">
                      <p className="text-purple-300 text-sm font-medium mb-2">Documents</p>
                      <p className="text-4xl font-bold text-white">{results.document_ids?.length || 0}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur rounded-xl p-6 border-2 border-green-400/30 hover:border-green-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/20 hover:-translate-y-1">
                      <p className="text-green-300 text-sm font-medium mb-2">Avg Similarity</p>
                      <p className="text-4xl font-bold text-white">
                        {formatPercentage(
                          results.similar_pairs.reduce((sum, p) => sum + p.similarity, 0) / 
                          results.similar_pairs.length
                        )}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur rounded-xl p-6 border-2 border-red-400/30 hover:border-red-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/20 hover:-translate-y-1">
                      <p className="text-red-300 text-sm font-medium mb-2">Flagged Pairs</p>
                      <p className="text-4xl font-bold text-white">
                        {results.similar_pairs.filter(p => p.flagged).length}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur rounded-xl p-6 border-2 border-white/10">
                    <h3 className="text-xl font-bold text-white mb-4">Analysis Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Job ID</p>
                        <p className="text-white font-mono">{results.job_id}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Status</p>
                        <p className="text-green-400 font-semibold uppercase">{results.status}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Threshold</p>
                        <p className="text-white font-semibold">{formatPercentage(results.threshold || 0.8)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Processing Time</p>
                        <p className="text-white font-semibold">{results.processing_time || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>
      </main>
    </div>
  );
};

export default ResultsPage;
