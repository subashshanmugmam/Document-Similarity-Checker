/**
 * Top Similarities Chart Component
 * Horizontal bar chart showing top similar document pairs
 */

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getSimilarityColor } from '../utils/helpers';

const TopSimilaritiesChart = ({ pairs, topN = 10 }) => {
  const topPairs = useMemo(() => {
    if (!pairs || pairs.length === 0) return [];

    // Sort by similarity (descending) and take top N
    const sorted = [...pairs]
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topN);

    // Format for chart
    return sorted.map((pair, idx) => ({
      name: `${pair.doc1_name || pair.doc1_id || 'Doc1'} vs ${pair.doc2_name || pair.doc2_id || 'Doc2'}`,
      doc1: pair.doc1_name || pair.doc1_id || 'Document 1',
      doc2: pair.doc2_name || pair.doc2_id || 'Document 2',
      similarity: parseFloat((pair.similarity * 100).toFixed(1)),
      color: getSimilarityColor(pair.similarity),
      flagged: pair.flagged
    }));
  }, [pairs, topN]);

  if (!pairs || pairs.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="text-center py-8 text-gray-600">
          No data available for top similarities
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 bg-white rounded-xl p-6 shadow-lg">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={topPairs} 
          layout="vertical"
          margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            type="number" 
            domain={[0, 100]}
            stroke="#374151"
            tick={{ fill: '#374151' }}
            label={{ value: 'Similarity (%)', position: 'insideBottom', offset: -5, fill: '#374151' }}
          />
          <YAxis 
            type="category" 
            dataKey="name"
            stroke="#374151"
            tick={{ fill: '#374151', fontSize: 10 }}
            width={190}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              color: '#1f2937',
              maxWidth: '400px'
            }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                    <p className="font-semibold text-gray-800 mb-2">Document Pair</p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Doc 1:</span> {data.doc1}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Doc 2:</span> {data.doc2}
                    </p>
                    <p className="text-sm font-semibold text-blue-600">
                      Similarity: {data.similarity}%
                    </p>
                    {data.flagged && (
                      <p className="text-xs text-red-600 mt-1 font-medium">⚠ Flagged</p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="similarity" radius={[0, 8, 8, 0]}>
            {topPairs.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke={entry.flagged ? '#ef4444' : 'transparent'}
                strokeWidth={entry.flagged ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopSimilaritiesChart;
