import type { ReactNode } from 'react';
import styles from './Modal.module.css';

type ModalProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: 'sm' | 'md' | 'lg';
};

export function Modal({
  title,
  open,
  onClose,
  children,
  width = 'md',
}: ModalProps) {
  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={`${styles.modal} ${styles[width]}`}>
        <header>
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}

