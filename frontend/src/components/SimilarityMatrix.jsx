/**
 * Similarity Matrix Component
 * Heatmap visualization of document similarities
 */

import { useMemo } from 'react';
import { getSimilarityColor, formatPercentage } from '../utils/helpers';

const SimilarityMatrix = ({ matrix, documentNames }) => {
  const { documentIds, matrixData } = useMemo(() => {
    // If matrix is in the old format (array of objects with doc_id and similarities)
    if (matrix && matrix.length > 0 && matrix[0]?.doc_id) {
      const ids = matrix.map((row) => row.doc_id);
      const data = matrix.map((row) => row.similarities);
      return { documentIds: ids, matrixData: data };
    }
    
    // New format: flat 2D array + separate document names
    if (matrix && matrix.length > 0 && documentNames && documentNames.length > 0) {
      return { documentIds: documentNames, matrixData: matrix };
    }
    
    return { documentIds: [], matrixData: [] };
  }, [matrix, documentNames]);
  
  if (!matrix || matrix.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No similarity matrix data available
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-100 p-2 text-xs font-medium sticky left-0 z-10">
                Document
              </th>
              {documentIds.map((id, idx) => (
                <th
                  key={idx}
                  className="border border-gray-300 bg-gray-100 p-2 text-xs font-medium"
                  style={{ minWidth: '60px' }}
                >
                  <div className="truncate" title={id || 'Unknown'}>
                    {id ? `${id.substring(0, 8)}...` : 'Doc ' + (idx + 1)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrixData.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td className="border border-gray-300 bg-gray-100 p-2 text-xs font-medium sticky left-0 z-10">
                  <div className="truncate" title={documentIds[rowIdx] || 'Unknown'}>
                    {documentIds[rowIdx] ? `${documentIds[rowIdx].substring(0, 8)}...` : `Doc ${rowIdx + 1}`}
                  </div>
                </td>
                {row.map((value, colIdx) => {
                  const color = getSimilarityColor(value);
                  const isIdentical = rowIdx === colIdx;
                  
                  return (
                    <td
                      key={colIdx}
                      className="border border-gray-300 p-2 text-center text-xs font-medium transition-all hover:scale-110 cursor-pointer"
                      style={{
                        backgroundColor: isIdentical ? '#e5e7eb' : color,
                        color: value > 0.7 ? 'white' : 'black',
                      }}
                      title={`${documentIds[rowIdx]} ↔ ${documentIds[colIdx]}: ${formatPercentage(value)}`}
                    >
                      {isIdentical ? '—' : formatPercentage(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <span className="text-gray-600">Similarity:</span>
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
    </div>
  );
};

export default SimilarityMatrix;
