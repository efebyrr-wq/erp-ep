import type { ReactNode } from 'react';
import clsx from 'clsx';
import styles from './Tabs.module.css';

export type TabItem<T extends string = string> = {
  id: T;
  label: string;
  badge?: string;
  badgeClassName?: string;
};

type TabsProps<T extends string = string> = {
  tabs: TabItem<T>[];
  active: T;
  onChange: (tab: T) => void;
  children: ReactNode;
  actions?: ReactNode;
};

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  children,
  actions,
}: TabsProps<T>) {
  return (
    <div className={styles.tabs}>
      <div className={styles.list}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={clsx(styles.tab, active === tab.id && styles.active)}
            onClick={() => onChange(tab.id)}
          >
            <span>{tab.label}</span>
            {tab.badge && <small className={clsx(tab.badgeClassName)}>{tab.badge}</small>}
          </button>
        ))}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <div className={styles.panel}>{children}</div>
    </div>
  );
}

