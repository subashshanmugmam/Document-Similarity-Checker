/**
 * Similar Pairs Component
 * List view of document pairs with similarity scores
 */

import { useState, useMemo } from 'react';
import { AlertTriangle, Search } from 'lucide-react';
import { formatPercentage, getSimilarityColor } from '../utils/helpers';
import SkeletonLoader from './SkeletonLoader';

const SimilarPairs = ({ pairs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('similarity');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const filteredAndSortedPairs = useMemo(() => {
    if (!pairs || pairs.length === 0) return [];
    
    // Filter
    let filtered = pairs;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = pairs.filter(
        (pair) =>
          (pair.doc1_name || pair.doc1_id).toLowerCase().includes(term) ||
          (pair.doc2_name || pair.doc2_id).toLowerCase().includes(term)
      );
    }
    
    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'similarity') {
        comparison = a.similarity - b.similarity;
      } else if (sortBy === 'flagged') {
        comparison = (a.flagged ? 1 : 0) - (b.flagged ? 1 : 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [pairs, searchTerm, sortBy, sortOrder]);
  
  const totalPages = Math.ceil(filteredAndSortedPairs.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedPairs = filteredAndSortedPairs.slice(startIdx, endIdx);
  
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  if (!pairs || pairs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-300">
        No similar pairs found
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-300" />
          <input
            type="text"
            placeholder="Search by document name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-500 hover:border-purple-300 bg-white text-gray-900 shadow-sm hover:shadow-lg focus:shadow-xl focus:shadow-purple-500/20 focus:-translate-y-0.5"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 cursor-pointer transition-all duration-500 hover:border-purple-300 shadow-sm hover:shadow-lg font-medium"
          >
            <option value="similarity">Sort by Similarity</option>
            <option value="flagged">Sort by Flagged</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-3 border-2 border-purple-300 rounded-xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50 hover:border-purple-400 transition-all duration-500 hover:shadow-lg hover:-translate-y-0.5 font-bold text-lg text-gray-900"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>
      
      {/* Pairs List */}
      <div className="space-y-2">
        {paginatedPairs.map((pair, idx) => {
          const similarity = pair.similarity;
          const getBorderColor = () => {
            if (similarity >= 0.8) return 'border-red-400 hover:border-red-500 hover:shadow-red-400/30';
            if (similarity >= 0.6) return 'border-orange-400 hover:border-orange-500 hover:shadow-orange-400/30';
            if (similarity >= 0.4) return 'border-yellow-400 hover:border-yellow-500 hover:shadow-yellow-400/30';
            if (similarity >= 0.2) return 'border-blue-400 hover:border-blue-500 hover:shadow-blue-400/30';
            return 'border-green-400 hover:border-green-500 hover:shadow-green-400/30';
          };
          
          return (
          <div
            key={`${pair.doc1_id}-${pair.doc2_id}-${idx}`}
            className={`p-4 rounded-xl border-3 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl cursor-pointer ${
              pair.flagged
                ? 'border-red-400 bg-gradient-to-br from-red-50 to-pink-50 hover:border-red-500 hover:shadow-red-500/30'
                : `bg-gradient-to-br from-white to-gray-50 ${getBorderColor()}`
            }`}
            style={{
              borderWidth: '3px'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {pair.flagged && (
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate" title={pair.doc1_name || pair.doc1_id}>
                    {pair.doc1_name || pair.doc1_id}
                  </p>
                  <p className="text-sm text-gray-600 truncate" title={pair.doc2_name || pair.doc2_id}>
                    {pair.doc2_name || pair.doc2_id}
                  </p>
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="text-lg font-bold" style={{ color: getSimilarityColor(pair.similarity) }}>
                  {formatPercentage(pair.similarity)}
                </p>
                {pair.flagged && (
                  <span className="text-xs text-red-600 font-medium">
                    Flagged
                  </span>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="h-3 rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${pair.similarity * 100}%`,
                  background: `linear-gradient(90deg, ${getSimilarityColor(pair.similarity)}, ${getSimilarityColor(pair.similarity)}dd)`,
                  boxShadow: `0 0 10px ${getSimilarityColor(pair.similarity)}66`
                }}
              />
            </div>
          </div>
          );
        })}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-300">
            Showing {startIdx + 1}-{Math.min(endIdx, filteredAndSortedPairs.length)} of{' '}
            {filteredAndSortedPairs.length} pairs
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border-2 border-purple-300 rounded-lg hover:bg-purple-50 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 font-medium"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-white bg-white/50 backdrop-blur rounded-lg border-2 border-gray-200 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border-2 border-purple-300 rounded-lg hover:bg-purple-50 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimilarPairs;
