import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="面包屑导航" className="mb-6">
      <ol className="flex items-center gap-2 text-sm text-gray-600">
        {/* 首页 */}
        <li>
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-blue-500 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>首页</span>
          </Link>
        </li>

        {/* 面包屑项 */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-blue-500 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-gray-900 font-medium' : ''}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
