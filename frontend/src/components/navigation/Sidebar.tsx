import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  Boxes,
  Building2,
  Calculator,
  Factory,
  FileText,
  Handshake,
  LayoutDashboard,
  Landmark,
  Receipt,
  Users,
  UserCircle,
  Wallet,
  Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import styles from './Sidebar.module.css';

type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Kontrol Paneli', to: '/', icon: LayoutDashboard },
  { label: 'Müşteriler & Şantiyeler', to: '/customers', icon: Users },
  { label: 'Tedarikçiler & Malzemeler', to: '/suppliers', icon: Building2 },
  { label: 'Taşeronlar', to: '/outsourcers', icon: Handshake },
  { label: 'Envanter', to: '/inventory', icon: Boxes },
  { label: 'Makine Parkı', to: '/machinery', icon: Factory },
  { label: 'Operasyonlar', to: '/operations', icon: Workflow },
  { label: 'Faturalama & Faturalar', to: '/billing', icon: Receipt },
  { label: 'Tahsilat & Ödemeler', to: '/collections', icon: Wallet },
  { label: 'Hesaplar', to: '/accounts', icon: Landmark },
  { label: 'Personel', to: '/personel', icon: UserCircle },
  { label: 'Vergi Hesaplama', to: '/tax-calculation', icon: Calculator },
  { label: 'PDF Oluşturma', to: '/pdf-generation', icon: FileText },
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      aria-label="Primary navigation"
      className={clsx(styles.sidebar, collapsed && styles.collapsed)}
    >
      <div className={styles.brand}>
        <button
          className={styles.toggle}
          type="button"
          onClick={onToggle}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <span className={styles.logo}>Efeler Platform</span>
      </div>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            title={item.label}
            className={({ isActive }) =>
              clsx(styles.link, isActive && styles.active)
            }
          >
            <span className={styles.iconWrapper} aria-hidden="true">
              <item.icon size={18} strokeWidth={2} />
            </span>
            <span className={styles.label}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

