import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface OrangeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  to?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export default function OrangeButton({
  children,
  to,
  className = '',
  size = 'md',
  type = 'button',
  ...buttonProps
}: OrangeButtonProps) {
  const sizeClassName = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm';
  const baseClassName =
    `inline-flex items-center justify-center bg-orange-500 font-bold uppercase whitespace-nowrap text-white transition hover:bg-orange-600 ${sizeClassName} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={baseClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={baseClassName} {...buttonProps}>
      {children}
    </button>
  );
}
