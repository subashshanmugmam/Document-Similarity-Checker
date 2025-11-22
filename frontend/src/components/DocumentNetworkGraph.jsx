/**
 * Document Network Graph Component
 * Shows relationships between documents based on similarity
 */

import { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis } from 'recharts';

const DocumentNetworkGraph = ({ pairs, threshold = 0.5 }) => {
  const networkData = useMemo(() => {
    if (!pairs || pairs.length === 0) return [];

    // Get unique documents
    const docSet = new Set();
    pairs.forEach(pair => {
      if (pair.similarity >= threshold) {
        docSet.add(pair.doc1_id);
        docSet.add(pair.doc2_id);
      }
    });
    
    const docs = Array.from(docSet);
    
    // Create nodes with positions (simple circular layout)
    const nodes = docs.map((doc, idx) => {
      const angle = (idx / docs.length) * 2 * Math.PI;
      const radius = 40;
      return {
        id: doc,
        name: doc?.substring(0, 15) || `Doc ${idx}`,
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
        connections: pairs.filter(p => 
          (p.doc1_id === doc || p.doc2_id === doc) && p.similarity >= threshold
        ).length,
        maxSimilarity: Math.max(
          ...pairs
            .filter(p => p.doc1_id === doc || p.doc2_id === doc)
            .map(p => p.similarity),
          0
        )
      };
    });

    return nodes;
  }, [pairs, threshold]);

  if (!pairs || pairs.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="text-center py-8 text-gray-600">
          No data available for network graph
        </div>
      </div>
    );
  }

  const getNodeColor = (similarity) => {
    if (similarity >= 0.8) return '#ef4444';
    if (similarity >= 0.6) return '#f97316';
    if (similarity >= 0.4) return '#f59e0b';
    return '#3b82f6';
  };

  return (
    <div className="w-full h-96 bg-white rounded-xl p-6 shadow-lg">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            type="number" 
            dataKey="x" 
            domain={[0, 100]}
            hide
          />
          <YAxis 
            type="number" 
            dataKey="y"
            domain={[0, 100]}
            hide
          />
          <ZAxis type="number" dataKey="connections" range={[200, 1000]} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              color: '#1f2937'
            }}
            formatter={(value, name) => {
              if (name === 'connections') return [`${value} connections`, 'Connections'];
              if (name === 'maxSimilarity') return [`${(value * 100).toFixed(0)}%`, 'Max Similarity'];
              return [value, name];
            }}
          />
          <Scatter data={networkData}>
            {networkData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getNodeColor(entry.maxSimilarity)}
                fillOpacity={0.8}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="text-center mt-4 text-gray-300 text-xs">
        <p>Node size represents number of connections • Color indicates max similarity</p>
      </div>
    </div>
  );
};

export default DocumentNetworkGraph;
