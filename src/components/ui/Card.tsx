import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle' | 'accent';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  ...props
}) => {
  let variantStyles = 'bg-white border border-slate-200/80 shadow-card';

  if (variant === 'elevated') {
    variantStyles = 'bg-white border border-slate-200 shadow-card-hover';
  } else if (variant === 'subtle') {
    variantStyles = 'bg-slate-50/80 border border-slate-200/60 shadow-none';
  } else if (variant === 'accent') {
    variantStyles = 'bg-brand-50/50 border border-brand-200 shadow-card';
  }

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 transition-all duration-200 ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
