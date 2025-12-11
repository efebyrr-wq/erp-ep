import styles from './ChartPlaceholder.module.css';

type ChartPlaceholderProps = {
  title: string;
  description?: string;
  variant?: 'bar' | 'line' | 'pie';
};

export function ChartPlaceholder({
  title,
  description,
  variant = 'bar',
}: ChartPlaceholderProps) {
  return (
    <div className={`${styles.card} ${styles[variant]}`}>
      <header>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </header>
      <div className={styles.canvas} />
    </div>
  );
}














