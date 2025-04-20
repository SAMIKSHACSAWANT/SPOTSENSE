import React, { useState } from 'react';

const Tabs = ({
  tabs,
  defaultTab = 0,
  onChange,
  variant = 'default',
  fullWidth = false,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabClick = (index) => {
    setActiveTab(index);
    if (onChange) {
      onChange(index);
    }
  };

  // Variant styles
  const variantStyles = {
    default: {
      container: 'border-b border-gray-200 dark:border-gray-700',
      tab: {
        active: 'border-primary-500 text-primary-600 dark:text-primary-400',
        inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600',
        base: 'py-2 px-4 text-center border-b-2 font-medium text-sm'
      }
    },
    pills: {
      container: 'flex space-x-1',
      tab: {
        active: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
        inactive: 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800',
        base: 'py-2 px-4 rounded-md text-sm font-medium'
      }
    },
    underline: {
      container: 'border-b border-gray-200 dark:border-gray-700',
      tab: {
        active: 'text-primary-600 border-b-2 border-primary-500 dark:text-primary-400',
        inactive: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
        base: 'py-2 px-1 text-center text-sm font-medium border-b-2 border-transparent mx-3'
      }
    },
    boxed: {
      container: 'flex',
      tab: {
        active: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 border-b-white dark:border-b-gray-800 text-gray-800 dark:text-white',
        inactive: 'bg-gray-50 dark:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
        base: 'py-2 px-4 text-sm font-medium border border-b-0 rounded-t-md'
      }
    }
  };

  const style = variantStyles[variant] || variantStyles.default;
  const containerClasses = style.container;
  const tabBaseClasses = style.tab.base;

  return (
    <div className={className}>
      {/* Tab navigation */}
      <div className={containerClasses}>
        <nav className={`flex ${fullWidth ? 'w-full' : ''}`}>
          {tabs.map((tab, index) => (
            <button
              key={index}
              className={`
                ${tabBaseClasses}
                ${activeTab === index ? style.tab.active : style.tab.inactive}
                ${fullWidth ? 'flex-1' : ''}
              `}
              onClick={() => handleTabClick(index)}
              aria-current={activeTab === index ? 'page' : undefined}
              role="tab"
              aria-selected={activeTab === index}
            >
              {typeof tab === 'string' ? tab : tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="py-4">
        {tabs.map((tab, index) => (
          <div 
            key={index} 
            className={activeTab === index ? 'block' : 'hidden'}
            role="tabpanel"
            aria-labelledby={`tab-${index}`}
          >
            {typeof tab === 'string' ? null : tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tabs; 