import styles from './StatCard.module.css';

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  accent?: 'blue' | 'teal' | 'amber' | 'rose';
};

export function StatCard({
  title,
  value,
  subtitle,
  accent = 'blue',
}: StatCardProps) {
  return (
    <div className={`${styles.card} ${styles[accent]}`}>
      <header>
        <p>{title}</p>
        {subtitle && <span>{subtitle}</span>}
      </header>
      <strong>{value}</strong>
    </div>
  );
}














