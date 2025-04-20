import React, { useState } from 'react';

const Tooltip = ({
  children,
  content,
  position = 'top',
  delay = 0,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Position classes for the tooltip
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };
  
  // Arrow classes for the tooltip
  const arrowClasses = {
    top: 'bottom-0 left-1/2 transform translate-x-[-50%] translate-y-[100%] border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-neutral-800 dark:border-t-neutral-600',
    bottom: 'top-0 left-1/2 transform translate-x-[-50%] translate-y-[-100%] border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-neutral-800 dark:border-b-neutral-600',
    left: 'right-0 top-1/2 transform translate-x-[100%] translate-y-[-50%] border-l-4 border-t-4 border-b-4 border-l-neutral-800 border-t-transparent border-b-transparent dark:border-l-neutral-600',
    right: 'left-0 top-1/2 transform translate-x-[-100%] translate-y-[-50%] border-r-4 border-t-4 border-b-4 border-r-neutral-800 border-t-transparent border-b-transparent dark:border-r-neutral-600',
  };
  
  const handleMouseEnter = () => {
    if (delay > 0) {
      setTimeout(() => setIsVisible(true), delay);
    } else {
      setIsVisible(true);
    }
  };
  
  const handleMouseLeave = () => {
    setIsVisible(false);
  };
  
  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {isVisible && (
        <div
          className={`absolute z-50 w-max max-w-xs px-3 py-2 text-sm font-medium text-white bg-neutral-800 dark:bg-neutral-600 rounded shadow-lg ${
            positionClasses[position] || positionClasses.top
          } ${className}`}
          role="tooltip"
        >
          {content}
          <span className={`absolute h-0 w-0 ${arrowClasses[position] || arrowClasses.top}`} />
        </div>
      )}
      {children}
    </div>
  );
};

export default Tooltip;