import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

export type HeaderDropdownItem = {
  key: string;
  label: string;
  to?: string;
  onClick?: () => void;
  bordered?: boolean;
};

interface HeaderDropdownProps {
  trigger: ReactNode;
  items: HeaderDropdownItem[];
  triggerClassName?: string;
  panelClassName?: string;
  itemClassName?: string;
  align?: 'left' | 'right';
  widthClassName?: string;
}

export default function HeaderDropdown({
  trigger,
  items,
  triggerClassName = '',
  panelClassName = '',
  itemClassName = '',
  align = 'left',
  widthClassName = 'w-52',
}: HeaderDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const defaultTriggerClassName =
    'flex items-center gap-2 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-white transition whitespace-nowrap hover:bg-orange-700';
  const defaultPanelClassName =
    'absolute top-full z-50 mt-0 overflow-hidden border border-orange-600 bg-orange-500 shadow-2xl';
  const defaultItemClassName =
    'block w-full px-4 py-3 text-left text-sm font-semibold uppercase text-white transition hover:bg-white hover:text-orange-600';

  return (
    <div className="relative">
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen((current) => !current)}
        className={`${defaultTriggerClassName} ${triggerClassName}`.trim()}
      >
        {trigger}
      </button>

      <div
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={`${isOpen ? 'block' : 'hidden'} ${defaultPanelClassName} ${align === 'right' ? 'right-0' : 'left-0'} ${widthClassName} ${panelClassName}`.trim()}
      >
        {items.map((item) => {
          const className = `${defaultItemClassName} ${item.bordered ? 'border-b border-orange-400/60' : ''} ${itemClassName}`.trim();

          if (item.to) {
            return (
              <Link key={item.key} to={item.to} onClick={() => setIsOpen(false)} className={className}>
                {item.label}
              </Link>
            );
          }

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                item.onClick?.();
                setIsOpen(false);
              }}
              className={className}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
