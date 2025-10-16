'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';
import MobileTabBar from '@/components/dashboard/MobileTabBar';
import { useSocket } from '@/contexts/SocketContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { isConnected } = useSocket();
  const [user, setUser] = useState<any>(null);
  const [lastSync, setLastSync] = useState<Date | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setUser(d?.user || null);
        setLastSync(new Date());
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    if (isConnected) {
      setLastSync(new Date());
    }
  }, [isConnected]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar - Hidden on mobile */}
      <Sidebar
        isConnected={isConnected}
        lastSync={lastSync}
        collapsed={sidebarCollapsed}
        onCollapseChange={setSidebarCollapsed}
        mobileOpen={sidebarMobileOpen}
        onMobileOpenChange={setSidebarMobileOpen}
      />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Topbar - Desktop and Mobile */}
        <Topbar
          user={user}
          onLogout={handleLogout}
          sidebarCollapsed={sidebarCollapsed}
          onOpenMobileSidebar={() => setSidebarMobileOpen(true)}
        />

        {/* Page Content */}
        <main className="min-h-screen pb-20 pt-16 lg:pb-6">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        {/* Footer / Status Bar - Desktop only */}
        <footer className="hidden border-t border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900 lg:block">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-4">
              <span>© 2025 QR Menu Manager</span>
              <span className="text-slate-400">|</span>
              <span className="flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {isConnected ? 'Live connection' : 'Offline'}
              </span>
            </div>
            <div>
              {lastSync ? (
                <span suppressHydrationWarning>
                  Last sync: {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : (
                <span>Last sync: --:--</span>
              )}
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar />
    </div>
  );
}
