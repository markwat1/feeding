import React from 'react';
import './Textarea.css';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  error = false,
  className = '',
  ...props
}) => {
  return (
    <textarea
      className={`textarea ${error ? 'textarea-error' : ''} ${className}`}
      {...props}
    />
  );
};