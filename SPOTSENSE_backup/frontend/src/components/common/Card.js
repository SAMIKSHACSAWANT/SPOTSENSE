import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  footer,
  image,
  variant = 'default',
  hover = false,
  className = '',
  onClick,
  ...rest
}) => {
  // Base classes for all cards
  const baseClasses = 'overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-md transition-all';
  
  // Variant classes
  const variantClasses = {
    default: 'border border-gray-200 dark:border-gray-700',
    elevated: 'shadow-lg',
    outlined: 'border-2 border-gray-200 dark:border-gray-700 shadow-none',
    flat: 'shadow-none border border-gray-200 dark:border-gray-700',
  };
  
  // Hover effect
  const hoverClasses = hover ? 'hover:shadow-lg transform hover:-translate-y-1 cursor-pointer' : '';
  
  // Generate final combined classes
  const cardClasses = [
    baseClasses,
    variantClasses[variant] || variantClasses.default,
    hoverClasses,
    className
  ].join(' ');
  
  return (
    <div 
      className={cardClasses} 
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...rest}
    >
      {image && (
        <div className="relative">
          <img
            src={image}
            alt={title || "Card image"}
            className="w-full h-auto object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        )}
        
        {subtitle && (
          <h4 className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {subtitle}
          </h4>
        )}
        
        {children && (
          <div className={`${title || subtitle ? 'mt-4' : ''}`}>
            {children}
          </div>
        )}
      </div>
      
      {footer && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card; 