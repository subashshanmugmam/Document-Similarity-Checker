/**
 * Similarity Matrix Component
 * Heatmap visualization of document similarities
 */

import { useMemo } from 'react';
import { getSimilarityColor, formatPercentage } from '../utils/helpers';

const SimilarityMatrix = ({ matrix, documentNames }) => {
  const { documentIds, matrixData } = useMemo(() => {
    console.log('SimilarityMatrix - matrix:', matrix);
    console.log('SimilarityMatrix - documentNames:', documentNames);
    
    // If matrix is in the old format (array of objects with doc_id and similarities)
    if (matrix && matrix.length > 0 && matrix[0]?.doc_id) {
      const ids = matrix.map((row) => row.doc_id);
      const data = matrix.map((row) => row.similarities);
      console.log('Old format detected - ids:', ids, 'data:', data);
      return { documentIds: ids, matrixData: data };
    }
    
    // New format: flat 2D array + separate document names
    if (matrix && Array.isArray(matrix) && matrix.length > 0) {
      // Check if matrix is a 2D array
      if (Array.isArray(matrix[0])) {
        const ids = documentNames && documentNames.length > 0 
          ? documentNames 
          : matrix.map((_, idx) => `Document ${idx + 1}`);
        console.log('2D array format detected - ids:', ids, 'matrix:', matrix);
        return { documentIds: ids, matrixData: matrix };
      }
    }
    
    console.log('No valid matrix data found');
    return { documentIds: [], matrixData: [] };
  }, [matrix, documentNames]);
  
  console.log('Processed data - documentIds:', documentIds, 'matrixData length:', matrixData.length);
  
  if (!matrixData || matrixData.length === 0 || !documentIds || documentIds.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="text-center py-8 text-gray-600">
          <p>No similarity matrix data available</p>
          <p className="text-xs mt-2 text-gray-400">
            Matrix: {matrix ? 'exists' : 'null'}, 
            DocumentNames: {documentNames ? documentNames.length : 'null'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="border-collapse w-full">
          <thead>
            <tr>
              <th className="border-2 border-gray-300 bg-gray-100 p-3 text-sm font-bold sticky left-0 z-10 min-w-[150px] max-w-[200px]">
                Document
              </th>
              {documentIds.map((id, idx) => (
                <th
                  key={idx}
                  className="border-2 border-gray-300 bg-gray-100 p-3 text-xs font-semibold text-gray-700"
                  style={{ minWidth: '120px', maxWidth: '150px' }}
                >
                  <div className="break-words" title={id || 'Unknown'}>
                    {id || `Doc ${idx + 1}`}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrixData.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td className="border-2 border-gray-300 bg-gray-100 p-3 text-xs font-semibold text-gray-700 sticky left-0 z-10 min-w-[150px] max-w-[200px]">
                  <div className="break-words" title={documentIds[rowIdx] || 'Unknown'}>
                    {documentIds[rowIdx] || `Doc ${rowIdx + 1}`}
                  </div>
                </td>
                {row.map((value, colIdx) => {
                  // Handle null, undefined, or NaN values
                  const numValue = typeof value === 'number' && !isNaN(value) ? value : 0;
                  const color = getSimilarityColor(numValue);
                  const isIdentical = rowIdx === colIdx;
                  const isDifferentBut100 = !isIdentical && numValue >= 0.99; // Different docs with 100% similarity
                  
                  console.log(`Cell [${rowIdx}][${colIdx}]: value=${value}, numValue=${numValue}, isIdentical=${isIdentical}`);
                  
                  // Determine text color
                  let textColor;
                  if (isIdentical) {
                    textColor = '#6b7280'; // Gray for diagonal
                  } else if (numValue >= 0.99) {
                    textColor = '#dc2626'; // Red for 100% similarity
                  } else if (numValue >= 0.7) {
                    textColor = 'white'; // White for high similarity
                  } else {
                    textColor = 'black'; // Black for low similarity
                  }
                  
                  return (
                    <td
                      key={colIdx}
                      className={`border-2 border-gray-300 p-3 text-center text-sm font-bold transition-all hover:scale-105 cursor-pointer ${
                        isDifferentBut100 ? 'ring-4 ring-red-500 ring-inset' : ''
                      }`}
                      style={{
                        backgroundColor: isIdentical ? '#e5e7eb' : color,
                        color: textColor,
                        minWidth: '120px',
                        maxWidth: '150px'
                      }}
                      title={`${documentIds[rowIdx]} ↔ ${documentIds[colIdx]}: ${formatPercentage(numValue)}`}
                    >
                      {isIdentical ? '—' : formatPercentage(numValue)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-700">
          <span className="text-gray-600 font-semibold">Similarity:</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 rounded" style={{ backgroundColor: getSimilarityColor(0) }} />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 rounded" style={{ backgroundColor: getSimilarityColor(0.5) }} />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 rounded" style={{ backgroundColor: getSimilarityColor(1) }} />
            <span>High</span>
          </div>
        </div>

        {/* Summary Report */}
        <div className="mt-6 pt-6 border-t-2 border-gray-200">
          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-red-600">⚠</span> High Similarity Summary Report
          </h4>
          
          {(() => {
            // Extract high similarity pairs (excluding diagonal)
            const highSimilarityPairs = [];
            const threshold = 0.7; // 70% threshold for high similarity
            
            matrixData.forEach((row, rowIdx) => {
              row.forEach((value, colIdx) => {
                if (rowIdx < colIdx && value >= threshold) { // Only count each pair once
                  highSimilarityPairs.push({
                    doc1: documentIds[rowIdx],
                    doc2: documentIds[colIdx],
                    similarity: value
                  });
                }
              });
            });

            // Sort by similarity (descending)
            highSimilarityPairs.sort((a, b) => b.similarity - a.similarity);

            if (highSimilarityPairs.length === 0) {
              return (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <p className="text-green-800 font-medium flex items-center gap-2">
                    <span className="text-2xl">✓</span>
                    No high similarity detected. All documents are sufficiently unique (below 70% similarity).
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-semibold text-sm">
                    <span className="text-lg">⚠</span> {highSimilarityPairs.length} document pair(s) detected with similarity ≥ 70%
                  </p>
                </div>

                <div className="grid gap-3">
                  {highSimilarityPairs.map((pair, idx) => (
                    <div 
                      key={idx}
                      className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-lg p-4 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full">
                              {idx + 1}
                            </span>
                            <span className="text-red-600 font-bold text-lg">
                              {formatPercentage(pair.similarity)} Similar
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-700">
                              <span className="font-semibold text-gray-900">Document 1:</span>{' '}
                              <span className="text-gray-800">{pair.doc1}</span>
                            </p>
                            <p className="text-gray-700">
                              <span className="font-semibold text-gray-900">Document 2:</span>{' '}
                              <span className="text-gray-800">{pair.doc2}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div 
                            className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                            style={{ 
                              backgroundColor: getSimilarityColor(pair.similarity),
                              fontSize: pair.similarity >= 0.995 ? '0.95rem' : '1.125rem'
                            }}
                          >
                            {formatPercentage(pair.similarity)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Severity indicator */}
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <p className="text-xs font-semibold">
                          {pair.similarity >= 0.9 ? (
                            <span className="text-red-700">🔴 CRITICAL - Potential duplicate or plagiarism</span>
                          ) : pair.similarity >= 0.8 ? (
                            <span className="text-orange-700">🟠 HIGH - Significant overlap detected</span>
                          ) : (
                            <span className="text-yellow-700">🟡 MODERATE - Notable similarity</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Statistics Summary */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white border-2 border-gray-300 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-800">
                      {highSimilarityPairs.filter(p => p.similarity >= 0.9).length}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">Critical (≥90%)</p>
                  </div>
                  <div className="bg-white border-2 border-gray-300 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-800">
                      {highSimilarityPairs.filter(p => p.similarity >= 0.8 && p.similarity < 0.9).length}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">High (80-89%)</p>
                  </div>
                  <div className="bg-white border-2 border-gray-300 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-800">
                      {highSimilarityPairs.filter(p => p.similarity >= 0.7 && p.similarity < 0.8).length}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">Moderate (70-79%)</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default SimilarityMatrix;
