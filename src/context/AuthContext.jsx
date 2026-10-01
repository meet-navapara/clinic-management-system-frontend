import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api, { clearBranchHeader, syncBranchHeaderForUser } from '../utils/api';

const AuthContext = createContext(null);

const AUTH_TOKEN_KEY = 'token';
const AUTH_USER_KEY = 'user';

const clearStoredAuth = () => {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  clearBranchHeader();
};

const storeSession = (data) => {
  // localStorage (not sessionStorage) so every browser tab shares the same session.
  // sessionStorage is tab-scoped — that caused "logged in here, logged out in other tab"
  // on live when the httpOnly cookie is not sent cross-origin.
  if (data?.token) {
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  }
  if (data?.user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
  }
};

const readStoredToken = () =>
  localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY) || '';

const usersRoughlyEqual = (a, b) => {
  if (!a || !b) return a === b;
  return (
    String(a._id || a.id || '') === String(b._id || b.id || '') &&
    a.role === b.role &&
    a.approvalStatus === b.approvalStatus &&
    a.clinicWideAccess === b.clinicWideAccess &&
    a.email === b.email &&
    a.name === b.name &&
    a.phone === b.phone &&
    a.profilePhoto === b.profilePhoto &&
    String(a.updatedAt || '') === String(b.updatedAt || '') &&
    Boolean(a.loginEnabled) === Boolean(b.loginEnabled)
  );
};

let refreshInFlight = null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem(AUTH_USER_KEY);
    const hasTokenHint = Boolean(readStoredToken() || savedUser);

    if (!hasTokenHint) {
      setLoading(false);
      return;
    }

    // Migrate any leftover sessionStorage token into localStorage (older builds).
    const sessionToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (sessionToken && !localStorage.getItem(AUTH_TOKEN_KEY)) {
      localStorage.setItem(AUTH_TOKEN_KEY, sessionToken);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
    }

    let hasCachedUser = false;
    if (savedUser) {
      try {
        const cached = JSON.parse(savedUser);
        syncBranchHeaderForUser(cached);
        setUser(cached);
        hasCachedUser = true;
        setLoading(false);
      } catch {
        clearStoredAuth();
        setLoading(false);
        return;
      }
    }

    const run = () => {
      if (!refreshInFlight) {
        refreshInFlight = api
          .get('/auth/me')
          .then((res) => {
            const next = res.data.user;
            if (next) syncBranchHeaderForUser(next);
            setUser((prev) => (usersRoughlyEqual(prev, next) ? prev : next));
            if (next) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(next));
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

  // Keep tabs in sync when login/logout happens in another tab.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.storageArea !== localStorage) return;
      if (e.key !== AUTH_TOKEN_KEY && e.key !== AUTH_USER_KEY) return;

      if (!localStorage.getItem(AUTH_TOKEN_KEY) && !localStorage.getItem(AUTH_USER_KEY)) {
        setUser(null);
        return;
      }

      const raw = localStorage.getItem(AUTH_USER_KEY);
      if (!raw) {
        setUser(null);
        return;
      }
      try {
        const next = JSON.parse(raw);
        syncBranchHeaderForUser(next);
        setUser((prev) => (usersRoughlyEqual(prev, next) ? prev : next));
      } catch {
        setUser(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persistSession = useCallback((data) => {
    syncBranchHeaderForUser(data?.user);
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
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
  }, []);

  const refreshUser = useCallback(async () => {
    if (refreshInFlight) return refreshInFlight;
    refreshInFlight = api
      .get('/auth/me')
      .then((res) => {
        const next = res.data.user;
        if (next) {
          syncBranchHeaderForUser(next);
          setUser((prev) => {
            if (usersRoughlyEqual(prev, next)) return prev;
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(next));
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
