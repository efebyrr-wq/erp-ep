import { Link, useLocation } from 'react-router-dom';
import styles from './Breadcrumbs.module.css';

function formatSegment(segment: string) {
  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const url = `/${segments.slice(0, index + 1).join('/')}`;
    return { label: formatSegment(segment), url };
  });

  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      <Link to="/">Dashboard</Link>
      {crumbs.map((crumb, index) => (
        <span key={crumb.url}>
          <span className={styles.separator}>/</span>
          {index === crumbs.length - 1 ? (
            <span className={styles.current}>{crumb.label}</span>
          ) : (
            <Link to={crumb.url}>{crumb.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}














