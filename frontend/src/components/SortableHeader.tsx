import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc';

type SortableHeaderProps = {
  children: ReactNode;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
  className?: string;
};

export default function SortableHeader({
  children,
  active,
  direction,
  onClick,
  className = ''
}: SortableHeaderProps) {
  const Icon = active ? (direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th className={`p-3 sm:p-4 font-semibold ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1.5 hover:text-orange-600 transition-colors"
      >
        <span>{children}</span>
        <Icon size={14} />
      </button>
    </th>
  );
}
