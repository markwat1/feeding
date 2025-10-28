import React from 'react';
import './Select.css';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  error?: boolean;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  error = false,
  placeholder,
  className = '',
  ...props
}) => {
  return (
    <select
      className={`select ${error ? 'select-error' : ''} ${className}`}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};