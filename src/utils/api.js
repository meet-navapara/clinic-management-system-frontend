import axios from 'axios';
import { ROUTES } from '../constants/routes';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}${import.meta.env.VITE_API_BASE_URL}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const publicPaths = [ROUTES.home, ROUTES.login, ROUTES.register, ROUTES.doctorRegister];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = ROUTES.login;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
