/**
 * Similar Pairs Component
 * List view of document pairs with similarity scores
 */

import { useState, useMemo } from 'react';
import { AlertTriangle, Search } from 'lucide-react';
import { formatPercentage, getSimilarityColor } from '../utils/helpers';

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
          pair.doc1_id.toLowerCase().includes(term) ||
          pair.doc2_id.toLowerCase().includes(term)
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
      <div className="text-center py-8 text-gray-500">
        No similar pairs found
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by document ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="similarity">Sort by Similarity</option>
            <option value="flagged">Sort by Flagged</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>
      
      {/* Pairs List */}
      <div className="space-y-2">
        {paginatedPairs.map((pair, idx) => (
          <div
            key={`${pair.doc1_id}-${pair.doc2_id}-${idx}`}
            className={`p-4 rounded-lg border-2 transition-all ${
              pair.flagged
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {pair.flagged && (
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {pair.doc1_id}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {pair.doc2_id}
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
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${pair.similarity * 100}%`,
                  backgroundColor: getSimilarityColor(pair.similarity),
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {startIdx + 1}-{Math.min(endIdx, filteredAndSortedPairs.length)} of{' '}
            {filteredAndSortedPairs.length} pairs
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
