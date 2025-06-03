import React from 'react';

const Avatar = ({
  src,
  alt = 'User avatar',
  size = 'md',
  status = null,
  statusPosition = 'bottom-right',
  className = '',
  onClick,
  ...rest
}) => {
  // Size classes
  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
    '2xl': 'h-24 w-24'
  };

  // Status color classes
  const statusColorClasses = {
    online: 'bg-success-500',
    offline: 'bg-neutral-400',
    busy: 'bg-danger-500',
    away: 'bg-warning-500'
  };

  // Status position classes
  const statusPositionClasses = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1'
  };

  // Status size based on avatar size
  const statusSizeClasses = {
    xs: 'h-2 w-2',
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-3.5 w-3.5',
    xl: 'h-4 w-4',
    '2xl': 'h-5 w-5'
  };

  const avatarSize = sizeClasses[size] || sizeClasses.md;
  const statusSize = statusSizeClasses[size] || statusSizeClasses.md;
  const resolvedStatusPosition = statusPositionClasses[statusPosition] || statusPositionClasses['bottom-right'];

  // Determine if we're using an image or initials
  const isImage = src && src.trim() !== '';
  
  // Generate initials from alt text if no image
  const getInitials = () => {
    if (!alt) return '';
    return alt
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div 
      className={`relative inline-flex rounded-full ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...rest}
    >
      {isImage ? (
        <img 
          src={src} 
          alt={alt} 
          className={`${avatarSize} rounded-full object-cover border border-neutral-200 dark:border-neutral-700`}
        />
      ) : (
        <div 
          className={`${avatarSize} rounded-full flex items-center justify-center bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 border border-neutral-200 dark:border-neutral-700`}
          aria-label={alt}
        >
          <span className={`font-medium ${size === 'xs' || size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {getInitials()}
          </span>
        </div>
      )}

      {status && (
        <span 
          className={`absolute ${resolvedStatusPosition} ${statusSize} rounded-full ring-2 ring-white dark:ring-neutral-800 ${statusColorClasses[status] || 'bg-neutral-400'}`}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Avatar; 