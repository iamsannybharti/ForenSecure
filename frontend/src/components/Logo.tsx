import React from 'react';
const logoGraphic = '/company-logo.png';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'auto';
}

export function LogoMark({ className = 'w-9 h-9', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <img
      src={logoGraphic}
      alt="ForenSecure Shield Emblem"
      className={`object-contain select-none ${className}`}
      style={style}
    />
  );
}

export default function Logo({ className = '', iconOnly = false, size = 'md', variant = 'auto' }: LogoProps) {
  const sizeClasses = {
    sm: { icon: 'h-7 w-auto', text: 'text-base' },
    md: { icon: 'h-9 w-auto', text: 'text-xl' },
    lg: { icon: 'h-11 w-auto', text: 'text-2xl' },
    xl: { icon: 'h-14 w-auto', text: 'text-3xl' }
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  const textColorClass = 
    variant === 'dark' 
      ? 'text-white' 
      : variant === 'light' 
      ? 'text-slate-950' 
      : 'text-slate-950 dark:text-white';

  const accentColorClass = 'text-blue-600 dark:text-brand-glowCyan';

  return (
    <div className={`flex items-center gap-2.5 font-display font-bold ${textColorClass} ${className}`}>
      <LogoMark className={`${currentSize.icon} flex-shrink-0 transition-transform duration-200 hover:scale-105`} />
      {!iconOnly && (
        <span className={`${currentSize.text} tracking-tight leading-none`}>
          Foren<span className={accentColorClass}>Secure</span>
        </span>
      )}
    </div>
  );
}
