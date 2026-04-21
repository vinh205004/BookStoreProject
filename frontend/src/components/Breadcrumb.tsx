import { Link } from 'react-router-dom';

type BreadcrumbItem = {
  label: string;
  to?: string;
};

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={`mb-6 text-sm italic text-orange-600 ${className}`.trim()}>
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.to && !isLast ? (
                <Link to={item.to} className="transition-colors hover:text-orange-700">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-medium text-orange-700' : ''}>{item.label}</span>
              )}
              {!isLast && <span className="text-orange-400">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
