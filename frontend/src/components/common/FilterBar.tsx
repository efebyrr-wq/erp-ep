import type { ReactNode } from 'react';
import styles from './FilterBar.module.css';

type FilterBarProps = {
  children: ReactNode;
  actions?: ReactNode;
};

export function FilterBar({ children, actions }: FilterBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.filters}>{children}</div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

