import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

const clearStoredAuth = () => {
  sessionStorage.removeItem('token');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const storeSession = (data) => {
  // Prefer httpOnly cookie; keep Bearer token only in sessionStorage as cross-origin fallback.
  if (data?.token) {
    sessionStorage.setItem('token', data.token);
    localStorage.removeItem('token');
  }
  if (data?.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }
};

const usersRoughlyEqual = (a, b) => {
  if (!a || !b) return a === b;
  return (
    String(a._id || a.id || '') === String(b._id || b.id || '') &&
    a.role === b.role &&
    a.approvalStatus === b.approvalStatus &&
    a.email === b.email &&
    a.name === b.name &&
    Boolean(a.loginEnabled) === Boolean(b.loginEnabled)
  );
};

let refreshInFlight = null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const hasTokenHint =
      Boolean(sessionStorage.getItem('token') || localStorage.getItem('token')) || Boolean(savedUser);

    if (!hasTokenHint) {
      setLoading(false);
      return;
    }

    let hasCachedUser = false;
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        hasCachedUser = true;
        // Paint the app immediately; refresh session in the background.
        setLoading(false);
      } catch {
        clearStoredAuth();
        setLoading(false);
        return;
      }
    }

    // Single session check on app load (deduped if Strict Mode double-invokes)
    const run = () => {
      if (!refreshInFlight) {
        refreshInFlight = api
          .get('/auth/me')
          .then((res) => {
            const next = res.data.user;
            setUser((prev) => (usersRoughlyEqual(prev, next) ? prev : next));
            if (next) localStorage.setItem('user', JSON.stringify(next));
            return next;
          })
          .catch(() => {
            clearStoredAuth();
            setUser(null);
            return null;
          })
          .finally(() => {
            refreshInFlight = null;
            if (!hasCachedUser) setLoading(false);
          });
      }
      return refreshInFlight;
    };
    run();
  }, []);

  const persistSession = useCallback((data) => {
    storeSession(data);
    setUser(data.user);
    return data;
  }, []);

  const login = useCallback(
    async (email, password, role) => {
      const payload = { email, password };
      if (role) payload.role = role;
      const res = await api.post('/auth/login', payload);
      return persistSession(res.data);
    },
    [persistSession]
  );

  const registerClinicAdmin = useCallback(
    async (userData) => {
      const res = await api.post('/auth/register/clinic-admin', userData);
      return persistSession(res.data);
    },
    [persistSession]
  );

  const registerDoctorAccount = useCallback(
    async (userData) => {
      const res = await api.post('/auth/register/doctor', userData);
      return persistSession(res.data);
    },
    [persistSession]
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Cookie clear may fail if already logged out — still wipe local state.
    }
    clearStoredAuth();
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  const refreshUser = useCallback(async () => {
    if (refreshInFlight) return refreshInFlight;
    refreshInFlight = api
      .get('/auth/me')
      .then((res) => {
        const next = res.data.user;
        if (next) {
          setUser((prev) => {
            if (usersRoughlyEqual(prev, next)) return prev;
            localStorage.setItem('user', JSON.stringify(next));
            return next;
          });
        }
        return next;
      })
      .finally(() => {
        refreshInFlight = null;
      });
    return refreshInFlight;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      registerClinicAdmin,
      registerDoctorAccount,
      logout,
      updateUser,
      refreshUser,
    }),
    [
      user,
      loading,
      login,
      registerClinicAdmin,
      registerDoctorAccount,
      logout,
      updateUser,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
