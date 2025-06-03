import React from 'react';

const Select = ({
  label,
  id,
  name,
  options = [],
  value,
  onChange,
  required = false,
  error = null,
  placeholder = 'Select an option',
  className = '',
  selectClassName = '',
  ...props
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="text-danger-600 ml-1">*</span>}
        </label>
      )}
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`form-input ${error ? 'border-danger-500 focus:ring-danger-500' : ''} ${selectClassName}`}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};

export default Select; 