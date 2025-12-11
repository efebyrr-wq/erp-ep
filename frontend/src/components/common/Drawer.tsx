import type { ReactNode } from 'react';
import styles from './Drawer.module.css';

type DrawerProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: 'sm' | 'md' | 'lg';
};

export function Drawer({ title, open, onClose, children, width = 'md' }: DrawerProps) {
    if (!open) return null;

    return (
      <div className={styles.overlay}>
        <aside className={`${styles.drawer} ${styles[width]}`}>
          <header>
            <h2>{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close drawer">
              ×
            </button>
          </header>
          <div className={styles.body}>{children}</div>
        </aside>
      </div>
    );
}

