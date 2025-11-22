/**
 * Similarity Distribution Chart Component
 * Bar chart showing distribution of similarity scores
 */

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const SimilarityDistributionChart = ({ pairs }) => {
  const distributionData = useMemo(() => {
    if (!pairs || pairs.length === 0) return [];

    // Create similarity ranges
    const ranges = [
      { range: '0-20%', min: 0, max: 0.2, count: 0, color: '#10b981' },
      { range: '20-40%', min: 0.2, max: 0.4, count: 0, color: '#3b82f6' },
      { range: '40-60%', min: 0.4, max: 0.6, count: 0, color: '#f59e0b' },
      { range: '60-80%', min: 0.6, max: 0.8, count: 0, color: '#f97316' },
      { range: '80-100%', min: 0.8, max: 1.0, count: 0, color: '#ef4444' }
    ];

    // Count pairs in each range
    pairs.forEach(pair => {
      const sim = pair.similarity;
      for (let range of ranges) {
        if (sim >= range.min && sim < range.max) {
          range.count++;
          break;
        }
        if (sim === 1.0 && range.max === 1.0) {
          range.count++;
          break;
        }
      }
    });

    return ranges;
  }, [pairs]);

  if (!pairs || pairs.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="text-center py-8 text-gray-600">
          No data available for distribution chart
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-80 bg-white rounded-xl p-6 shadow-lg">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={distributionData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="range" 
            stroke="#374151"
            tick={{ fill: '#374151' }}
          />
          <YAxis 
            stroke="#374151"
            tick={{ fill: '#374151' }}
            label={{ value: 'Number of Pairs', angle: -90, position: 'insideLeft', fill: '#374151' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              color: '#1f2937'
            }}
          />
          <Legend wrapperStyle={{ color: '#374151' }} />
          <Bar dataKey="count" name="Document Pairs" radius={[8, 8, 0, 0]}>
            {distributionData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SimilarityDistributionChart;
