'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'gold',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B99A68]/40 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base font-semibold',
  };

  const variantStyles = {
    gold: 'bg-gradient-to-r from-[#B99A68] to-[#9E8050] text-[#0B0D11] font-bold hover:brightness-105 shadow-md shadow-[#B99A68]/20 active:scale-[0.98]',
    secondary: 'bg-stone-200 text-stone-900 hover:bg-stone-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 active:scale-[0.98]',
    outline: 'border border-[#B99A68]/60 text-stone-800 dark:text-[#E5CAA2] hover:bg-[#B99A68]/10 hover:border-[#B99A68] active:scale-[0.98]',
    danger: 'bg-red-100 text-red-900 border border-red-300 dark:bg-red-950/60 dark:border-red-500/40 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 active:scale-[0.98]',
    ghost: 'text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.98]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
