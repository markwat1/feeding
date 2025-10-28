import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input: React.FC<InputProps> = ({ 
  error = false, 
  className = '', 
  ...props 
}) => {
  return (
    <input
      className={`input ${error ? 'input-error' : ''} ${className}`}
      {...props}
    />
  );
};