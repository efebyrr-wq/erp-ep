import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/navigation/Sidebar';
import { Topbar } from '../components/navigation/Topbar';
import styles from './DashboardLayout.module.css';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={`${styles.shell} erp-shell`}>
      <Sidebar
        collapsed={!sidebarOpen}
        onToggle={() => setSidebarOpen((open) => !open)}
      />
      <div className={styles.main}>
        <Topbar onToggleSidebar={() => setSidebarOpen((open) => !open)} />
        <div className={styles.content}>
          <div className={styles.outlet}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

