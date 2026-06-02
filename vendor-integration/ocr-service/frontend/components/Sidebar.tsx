'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, FileSearch, ScanLine } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  {
    label: 'Integration',
    href: '/integration',
    icon: Settings,
    description: 'Configure SFTP, email & OCR settings',
  },
  {
    label: 'OCR Review',
    href: '/ocr-review',
    icon: FileSearch,
    description: 'Review & manage processed documents',
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
          <ScanLine className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">OCR Reader</p>
          <p className="text-xs text-gray-500">Invoice Processing</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon
                className={clsx(
                  'h-5 w-5 flex-shrink-0',
                  isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'
                )}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-4">
        <p className="text-xs text-gray-400">OCR Reader v1.0.0</p>
        <p className="text-xs text-gray-400">Powered by Tesseract</p>
      </div>
    </aside>
  );
}
