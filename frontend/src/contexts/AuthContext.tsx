import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, ReactNode } from 'react';
import { apiPost } from '../lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 10 minutes in milliseconds
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 600,000ms

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check if user is already logged in (from localStorage)
    const stored = localStorage.getItem('isAuthenticated');
    const lastActivity = localStorage.getItem('lastActivity');
    
    if (stored === 'true' && lastActivity) {
      const timeSinceActivity = Date.now() - parseInt(lastActivity, 10);
      // If more than 10 minutes have passed, logout
      if (timeSinceActivity > INACTIVITY_TIMEOUT) {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('lastActivity');
        return false;
      }
    }
    
    return stored === 'true';
  });
  const [isLoading, setIsLoading] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Logout function (memoized with useCallback to prevent recreation)
  const logout = useCallback(() => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('lastActivity');
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    // Redirect to login if not already there
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }, []);

  // Update last activity timestamp
  const updateActivity = () => {
    const now = Date.now();
    lastActivityRef.current = now;
    if (isAuthenticated) {
      localStorage.setItem('lastActivity', now.toString());
    }
  };

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    if (isAuthenticated) {
      inactivityTimerRef.current = setTimeout(() => {
        console.log('⏰ Session timeout: 10 minutes of inactivity');
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  };

  // Handle user activity
  useEffect(() => {
    if (!isAuthenticated) return;

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
      resetInactivityTimer();
    };

    // Add event listeners for user activity
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, true);
    });

    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, check if we should logout when it becomes visible again
        updateActivity();
      } else {
        // Tab is visible again, check inactivity
        const lastActivity = localStorage.getItem('lastActivity');
        if (lastActivity) {
          const timeSinceActivity = Date.now() - parseInt(lastActivity, 10);
          if (timeSinceActivity > INACTIVITY_TIMEOUT) {
            console.log('⏰ Session expired while tab was hidden');
            logout();
          } else {
            updateActivity();
            resetInactivityTimer();
          }
        }
      }
    };

    // Handle tab close
    const handleBeforeUnload = () => {
      // Clear authentication on tab close
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('lastActivity');
    };

    // Handle page unload (browser close, navigation away)
    const handleUnload = () => {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('lastActivity');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    // Initialize activity tracking
    updateActivity();
    resetInactivityTimer();

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isAuthenticated, logout]);

  useEffect(() => {
    // Persist authentication state
    if (isAuthenticated) {
      localStorage.setItem('isAuthenticated', 'true');
      updateActivity();
      resetInactivityTimer();
    } else {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('lastActivity');
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    }
  }, [isAuthenticated]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiPost<{ username: string; password: string }, { success: boolean; message: string }>(
        '/auth/login',
        { username, password }
      );
      
      if (response?.success) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    isAuthenticated,
    login,
    logout,
    isLoading,
  }), [isAuthenticated, login, logout, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}






