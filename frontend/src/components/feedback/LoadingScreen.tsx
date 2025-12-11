import styles from './LoadingScreen.module.css';

export function LoadingScreen() {
  return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <p>Loading module…</p>
    </div>
  );
}














