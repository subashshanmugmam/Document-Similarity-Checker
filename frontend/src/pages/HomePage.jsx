/**
 * Home Page Component
 * Main page with document upload and analysis
 */

import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAnimation } from '../context/AnimationContext';
import DocumentUploader from '../components/DocumentUploader';
import DocumentList from '../components/DocumentList';
import AnalysisButton from '../components/AnalysisButton';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import AnimationSettings from '../components/AnimationSettings';
import { CheckCircle, X, Sparkles, Zap } from 'lucide-react';
import { ScrollReveal } from '../hooks/useScrollReveal';

const HomePage = () => {
  const navigate = useNavigate();
  const { error, successMessage, isAnalyzing, currentJobId, setError, setSuccessMessage } = useApp();
  const { settings } = useAnimation();

  // Redirect to results page when analysis completes
  const handleAnalysisComplete = (jobId) => {
    if (jobId) {
      navigate(`/results?jobId=${jobId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Floating particles */}
        {settings.enableParticles && [...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>
      
      {/* Header */}
      <header className="relative backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-2xl">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-3 animate-slide-in">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg animate-pulse-glow">
              <Sparkles className="w-8 h-8 text-white animate-spin-slow" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
              Document Similarity Analyzer
            </h1>
          </div>
          <p className="text-gray-300 text-lg flex items-center gap-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
            Powered by PySpark • Advanced TF-IDF • Real-time Analysis
          </p>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Notifications */}
        <div className="mb-6 space-y-2">
          {error && (
            <ErrorMessage error={error} onClose={() => setError(null)} />
          )}
          
          {successMessage && (
            <div className="glass-card border-l-4 border-green-400 p-4 flex items-start justify-between animate-slide-in">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-100 font-medium">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-400 hover:text-green-300 ml-4 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
        
        {/* Analysis Loading Overlay */}
        {isAnalyzing && (
          <div className="glass-card mb-6 border-2 border-blue-400 animate-pulse-glow">
            <LoadingSpinner
              message="⚡ Analyzing documents with PySpark... Processing TF-IDF vectors and computing similarity matrix..."
              size="lg"
            />
          </div>
        )}
        
        {/* Upload Section */}
        <ScrollReveal animation="fade-up" delay={100}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <DocumentUploader />
            <AnalysisButton onComplete={handleAnalysisComplete} />
          </div>
        </ScrollReveal>
        
        {/* Documents List */}
        <ScrollReveal animation="fade-up" delay={200}>
          <div className="mb-6">
            <DocumentList />
          </div>
        </ScrollReveal>
      </main>
      
      {/* Footer */}
      <footer className="relative backdrop-blur-xl bg-white/5 border-t border-white/10 mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-gray-300 text-sm">
            Powered by <span className="font-semibold text-blue-400">PySpark 4.0</span> •{' '}
            <span className="font-semibold text-purple-400">FastAPI</span> •{' '}
            <span className="font-semibold text-pink-400">React</span>
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Advanced Document Analysis Platform
          </p>
        </div>
      </footer>
      
      {/* Animation Settings */}
      <AnimationSettings />
    </div>
  );
};

export default HomePage;
