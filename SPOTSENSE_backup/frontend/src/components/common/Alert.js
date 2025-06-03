import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Alert = ({
  children,
  title,
  variant = 'info',
  isDismissible = false,
  icon,
  className = '',
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Variant classes
  const variantClasses = {
    info: 'bg-primary-50 text-primary-800 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-800',
    success: 'bg-success-50 text-success-800 border-success-200 dark:bg-success-900/30 dark:text-success-300 dark:border-success-800',
    warning: 'bg-warning-50 text-warning-800 border-warning-200 dark:bg-warning-900/30 dark:text-warning-300 dark:border-warning-800',
    danger: 'bg-danger-50 text-danger-800 border-danger-200 dark:bg-danger-900/30 dark:text-danger-300 dark:border-danger-800',
    neutral: 'bg-neutral-50 text-neutral-800 border-neutral-200 dark:bg-neutral-900/30 dark:text-neutral-300 dark:border-neutral-800',
  };

  // Default icons based on variant
  const iconMap = {
    info: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
      </svg>
    ),
    success: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
      </svg>
    ),
    danger: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
      </svg>
    ),
    neutral: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
      </svg>
    ),
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={`border rounded-lg p-4 mb-4 ${variantClasses[variant] || variantClasses.info} ${className}`}
      role="alert"
    >
      <div className="flex">
        {(icon || iconMap[variant]) && (
          <div className="flex-shrink-0 mr-3">
            {icon || iconMap[variant]}
          </div>
        )}
        
        <div className="flex-1">
          {title && (
            <h3 className="text-base font-semibold mb-1">{title}</h3>
          )}
          <div className="text-sm">{children}</div>
        </div>
        
        {isDismissible && (
          <div className="ml-auto">
            <button
              type="button"
              className="bg-transparent text-current hover:bg-opacity-10 hover:bg-neutral-900 inline-flex rounded p-1"
              onClick={handleDismiss}
              aria-label="Dismiss"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert; 