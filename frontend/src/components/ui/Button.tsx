import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'font-medium transition-colors flex items-center gap-2 justify-center';

  const variantStyles = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-black disabled:bg-orange-300',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:bg-slate-50',
    danger: 'bg-red-500 hover:bg-red-600 text-white disabled:bg-red-300',
    success: 'bg-green-100 text-green-700 hover:bg-green-200 disabled:bg-green-50',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:bg-slate-50'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
