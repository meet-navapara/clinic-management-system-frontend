import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
        return;
      }
      api
        .get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const persistSession = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const login = async (email, password, role) => {
    const payload = { email, password };
    if (role) payload.role = role;
    const res = await api.post('/auth/login', payload);
    return persistSession(res.data);
  };

  const registerClinicAdmin = async (userData) => {
    const res = await api.post('/auth/register/clinic-admin', userData);
    return persistSession(res.data);
  };

  const registerDoctorAccount = async (userData) => {
    const res = await api.post('/auth/register/doctor', userData);
    return persistSession(res.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const refreshUser = useCallback(async () => {
    const res = await api.get('/auth/me');
    const next = res.data.user;
    if (next) {
      setUser(next);
      localStorage.setItem('user', JSON.stringify(next));
    }
    return next;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registerClinicAdmin,
        registerDoctorAccount,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
