/**
 * Loading Spinner Component
 * Reusable loading indicator
 */

import { RefreshCw } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };
  
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <RefreshCw className={`${sizeClasses[size]} animate-spin text-blue-500 mb-2`} />
      <p className="text-gray-600">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
