import React from 'react';

const Loading = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <svg 
        className={`animate-spin text-primary-600 dark:text-primary-400 ${sizeClasses[size] || sizeClasses.md}`} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        ></circle>
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
  );
};

// Loading with full screen overlay
export const LoadingOverlay = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-neutral-800/50 dark:bg-neutral-900/80 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-lg flex flex-col items-center">
        <Loading size="lg" className="mb-4" />
        <p className="text-neutral-700 dark:text-neutral-300 font-medium">{message}</p>
      </div>
    </div>
  );
};

export default Loading; 