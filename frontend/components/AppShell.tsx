'use client';

import { useEffect, Suspense, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { moduleForPath } from '@/lib/accessMap';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ChatWidget from '@/components/ChatWidget';

const PUBLIC_PATHS = ['/login', '/unauthorized'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, canAccess } = useAuth();
  const pathname = usePathname();
  const router   = useRouter();
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored === 'true') setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  // 1. Redirect to login if unauthenticated
  useEffect(() => {
    if (!isLoading && !user && !isPublic) {
      router.replace('/login');
    }
  }, [user, isLoading, isPublic, router]);

  // 2. Redirect to /unauthorized if authenticated but no view access for this route
  useEffect(() => {
    if (isLoading || !user || isPublic) return;
    const module = moduleForPath(pathname);
    if (module && !canAccess(module, 'view')) {
      router.replace('/unauthorized');
    }
  }, [pathname, isLoading, user, isPublic, canAccess]);

  // Show public pages (login, unauthorized) without sidebar
  if (isPublic) return <>{children}</>;

  // Loading splash
  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-6 h-6 rounded-lg bg-white/20" />
          </div>
          <p className="text-neutral-400 text-sm font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-25">
      <Suspense fallback={<div className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-neutral-200 flex-shrink-0`} />}>
        <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
      </Suspense>
      {/* Fixed top bar — sits above main content, respects sidebar width */}
      <TopBar collapsed={collapsed} />
      {/* Main content: offset left for sidebar, top for the TopBar (h-14 = 56px) */}
      <main className={`flex-1 overflow-y-auto pt-14 transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
        {children}
      </main>
      <ChatWidget />
    </div>
  );
}
