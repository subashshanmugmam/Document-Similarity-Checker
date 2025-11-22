/**
 * Error Message Component
 * Reusable error display
 */

import { AlertCircle, X } from 'lucide-react';

const ErrorMessage = ({ error, onClose }) => {
  if (!error) return null;
  
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start justify-between">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-red-800">Error</p>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-red-500 hover:text-red-700 ml-4"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
