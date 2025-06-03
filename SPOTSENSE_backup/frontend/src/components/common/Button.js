import React from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className = '',
  leftIcon = null,
  rightIcon = null,
  isLoading = false,
  loadingText = 'Loading...',
  ...rest
}) => {
  // Base classes for all buttons
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500',
    info: 'bg-sky-500 hover:bg-sky-600 text-white focus:ring-sky-500',
    outline: 'bg-transparent border border-gray-300 hover:bg-gray-100 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white dark:hover:text-white focus:ring-gray-500',
    link: 'bg-transparent text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300 focus:ring-blue-500 p-0',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-800 dark:text-gray-300 focus:ring-gray-500',
  };
  
  // Size classes
  const sizeClasses = {
    xs: 'text-xs px-2 py-1',
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5',
    xl: 'text-lg px-6 py-3',
  };
  
  // Disabled classes
  const disabledClasses = 'opacity-60 cursor-not-allowed';
  
  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // Generate final combined classes
  const buttonClasses = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    disabled || isLoading ? disabledClasses : '',
    widthClasses,
    variant !== 'link' ? 'shadow-sm' : '',
    className
  ].join(' ');
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingText}
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button; 