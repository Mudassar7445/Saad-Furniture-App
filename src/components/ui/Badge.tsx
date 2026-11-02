import React from 'react';

interface BadgeProps {
  variant?: 'gold' | 'blue' | 'green' | 'amber' | 'red' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
}) => {
  const styles = {
    gold: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-[#c5a880]/20 dark:text-[#f3dfc5] dark:border-[#c5a880]/40',
    blue: 'bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40',
    green: 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40',
    amber: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40',
    red: 'bg-red-100 text-red-950 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40',
    neutral: 'bg-stone-200 text-stone-900 border-stone-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
