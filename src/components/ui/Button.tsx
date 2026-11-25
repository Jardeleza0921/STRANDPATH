import React from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost' | 'quiet';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  full?: boolean;
  type?: 'button' | 'submit';
  ariaLabel?: string;
}

const variants: Record<Variant, string> = {
  primary: 'sp-btn-primary disabled:opacity-50 disabled:saturate-50',
  secondary: 'sp-btn-secondary disabled:opacity-50',
  ghost: 'bg-transparent text-brand border border-transparent hover:bg-brand-soft',
  quiet: 'bg-brand-soft text-brand-dark border border-transparent hover:bg-brand-edge'
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-[52px] px-7 text-[15px]'
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  to,
  onClick,
  disabled,
  full,
  type = 'button',
  ariaLabel
}: ButtonProps) {
  const className = [
  'inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-[-0.01em]',
  'transition-[background-color,border-color,color,transform] duration-150 ease-out',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
  'active:translate-y-px disabled:cursor-not-allowed',
  variants[variant],
  sizes[size],
  full ? 'w-full' : ''].
  join(' ');

  if (to && !disabled) {
    return (
      <Link to={to} className={className} aria-label={ariaLabel}>
        {children}
      </Link>);

  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className} aria-label={ariaLabel}>
      {children}
    </button>);

}