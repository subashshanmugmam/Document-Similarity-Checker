/**
 * Utility Helper Functions
 */

/**
 * Format file size to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format date to readable string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format percentage
 * @param {number} value - Value between 0 and 1
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value) => {
  return `${(value * 100).toFixed(1)}%`;
};

/**
 * Get color based on similarity score
 * @param {number} similarity - Similarity score (0-1)
 * @returns {string} Tailwind color class
 */
export const getSimilarityColor = (similarity) => {
  if (similarity >= 0.8) return 'text-red-600';
  if (similarity >= 0.6) return 'text-orange-600';
  if (similarity >= 0.4) return 'text-yellow-600';
  return 'text-green-600';
};

/**
 * Get background color based on similarity score
 * @param {number} similarity - Similarity score (0-1)
 * @returns {string} Tailwind background color class
 */
export const getSimilarityBgColor = (similarity) => {
  if (similarity >= 0.8) return 'bg-red-100';
  if (similarity >= 0.6) return 'bg-orange-100';
  if (similarity >= 0.4) return 'bg-yellow-100';
  return 'bg-green-100';
};

/**
 * Truncate text
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Download data as JSON file
 * @param {Object} data - Data to download
 * @param {string} filename - Filename
 */
export const downloadJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Download data as CSV file
 * @param {Array} data - Array of objects
 * @param {string} filename - Filename
 */
export const downloadCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  
  // Get headers
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value).replace(/"/g, '""');
        return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
      }).join(',')
    ),
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Validate file
 * @param {File} file - File to validate
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateFile = (file) => {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = ['.txt', '.pdf', 'text/plain', 'application/pdf'];
  
  // Check size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large: ${formatFileSize(file.size)} (max 50MB)`,
    };
  }
  
  // Check type
  const fileExt = '.' + file.name.split('.').pop().toLowerCase();
  const isValidType = allowedTypes.some(type => 
    file.type === type || fileExt === type
  );
  
  if (!isValidType) {
    return {
      valid: false,
      error: 'Invalid file type. Only .txt and .pdf files are allowed.',
    };
  }
  
  return { valid: true, error: null };
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Combine class names
 * @param  {...any} classes - Class names
 * @returns {string} Combined class names
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};
