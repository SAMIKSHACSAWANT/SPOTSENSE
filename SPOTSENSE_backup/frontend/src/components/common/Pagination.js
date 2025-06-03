import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className = '',
}) => {
  // Helper function to generate page numbers
  const generatePageNumbers = () => {
    const pageNumbers = [];
    
    // Always include first page
    pageNumbers.push(1);
    
    // Calculate range of visible page numbers
    const leftSiblingIndex = Math.max(2, currentPage - siblingCount);
    const rightSiblingIndex = Math.min(totalPages - 1, currentPage + siblingCount);
    
    // Show dots only if there's more than 1 page number to be hidden
    const showLeftDots = leftSiblingIndex > 2;
    const showRightDots = rightSiblingIndex < totalPages - 1;
    
    if (showLeftDots) {
      pageNumbers.push('...');
    }
    
    // Add all sibling page numbers
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== 1 && i !== totalPages) {
        pageNumbers.push(i);
      }
    }
    
    if (showRightDots) {
      pageNumbers.push('...');
    }
    
    // Always include last page if it's not the same as first
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };
  
  // Don't render pagination if there's only 1 page
  if (totalPages <= 1) {
    return null;
  }
  
  const pageNumbers = generatePageNumbers();
  
  // Style for page number buttons
  const getButtonStyles = (pageNumber) => {
    const baseStyles = 'relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium';
    const activeStyles = 'z-10 bg-primary-50 border-primary-500 text-primary-600 dark:bg-primary-900/30 dark:border-primary-500 dark:text-primary-400';
    const inactiveStyles = 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700';
    
    return `${baseStyles} ${pageNumber === currentPage ? activeStyles : inactiveStyles}`;
  };
  
  return (
    <nav className={`flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6 ${className}`}>
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`relative inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium ${
            currentPage === 1
              ? 'cursor-not-allowed opacity-50 bg-gray-100 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`relative ml-3 inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium ${
            currentPage === totalPages
              ? 'cursor-not-allowed opacity-50 bg-gray-100 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          Next
        </button>
      </div>
      
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            {/* Previous button */}
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-l-md border px-2 py-2 text-sm font-medium ${
                currentPage === 1
                  ? 'cursor-not-allowed opacity-50 bg-gray-100 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            
            {/* Page numbers */}
            {pageNumbers.map((pageNumber, index) => (
              <React.Fragment key={index}>
                {pageNumber === '...' ? (
                  <span className="relative inline-flex items-center justify-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300">
                    ...
                  </span>
                ) : (
                  <button
                    onClick={() => onPageChange(pageNumber)}
                    className={`relative inline-flex items-center border ${getButtonStyles(pageNumber)}`}
                    aria-current={pageNumber === currentPage ? 'page' : undefined}
                  >
                    {pageNumber}
                  </button>
                )}
              </React.Fragment>
            ))}
            
            {/* Next button */}
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center rounded-r-md border px-2 py-2 text-sm font-medium ${
                currentPage === totalPages
                  ? 'cursor-not-allowed opacity-50 bg-gray-100 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <span className="sr-only">Next</span>
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </nav>
  );
};

export default Pagination; 