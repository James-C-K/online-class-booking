'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function DashboardShell({ user, profile, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      <Sidebar
        user={user}
        profile={profile}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      <main className="dashboard-main">
        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            ☰
          </button>
          <span className="mobile-logo">Class-Booking</span>
        </div>

        <div className="dashboard-page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
