import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Topbar.module.css';

type TopbarProps = {
  onToggleSidebar: () => void;
};

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const { logout } = auth;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={styles.topbar}>
      <button
        className={styles.menuButton}
        type="button"
        aria-label="Toggle sidebar"
        onClick={onToggleSidebar}
      >
        ☰
      </button>
      <div className={styles.search}>
        <input placeholder="Search modules, records, or actions..." />
      </div>
      <div className={styles.actions}>
        <button type="button">Bildirimler</button>
        <button type="button" onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
        <div className={styles.userAvatar}>EB</div>
      </div>
    </header>
  );
}




