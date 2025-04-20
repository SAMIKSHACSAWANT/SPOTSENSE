import React from 'react';

const Toggle = ({
  isChecked = false,
  onChange,
  disabled = false,
  label,
  size = 'md',
  labelPosition = 'right',
  className = '',
  id,
}) => {
  // Generate a random ID if none is provided
  const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;
  
  // Size variants
  const sizeVariants = {
    sm: {
      switch: 'w-9 h-5',
      dot: 'h-3.5 w-3.5 translate-x-0.5',
      translate: 'translate-x-4',
    },
    md: {
      switch: 'w-11 h-6',
      dot: 'h-4.5 w-4.5 translate-x-0.5',
      translate: 'translate-x-5',
    },
    lg: {
      switch: 'w-14 h-7',
      dot: 'h-5.5 w-5.5 translate-x-1',
      translate: 'translate-x-7',
    },
  };
  
  const sizeClasses = sizeVariants[size] || sizeVariants.md;
  
  return (
    <div className={`flex items-center ${className}`}>
      {label && labelPosition === 'left' && (
        <label
          htmlFor={toggleId}
          className={`mr-2 text-sm font-medium text-gray-700 dark:text-gray-300 ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          {label}
        </label>
      )}
      
      <div className="relative inline-block">
        <input
          type="checkbox"
          id={toggleId}
          checked={isChecked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
        />
        <div
          onClick={!disabled ? onChange : undefined}
          className={`${sizeClasses.switch} ${
            isChecked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
          } rounded-full cursor-pointer transition-colors ease-in-out duration-200 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div
            className={`${sizeClasses.dot} bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${
              isChecked ? sizeClasses.translate : ''
            }`}
          />
        </div>
      </div>
      
      {label && labelPosition === 'right' && (
        <label
          htmlFor={toggleId}
          className={`ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Toggle; 