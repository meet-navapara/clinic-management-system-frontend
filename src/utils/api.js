import axios from 'axios';
import toast from 'react-hot-toast';
import { ROUTES } from '../constants/routes';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}${import.meta.env.VITE_API_BASE_URL}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

let branchHeader = localStorage.getItem('branchId') || '';

export function setBranchHeader(id) {
  branchHeader = id || '';
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (branchHeader) {
    config.headers['X-Branch-Id'] = branchHeader;
  }
  return config;
});

let lastStatusToastAt = 0;
const toastStatusOnce = (message) => {
  const now = Date.now();
  if (now - lastStatusToastAt < 1500) return;
  lastStatusToastAt = now;
  toast.error(message);
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const publicPaths = [
        ROUTES.home,
        ROUTES.login,
        ROUTES.doctorSignup,
        ROUTES.doctorLogin,
        ROUTES.doctorPending,
        ROUTES.clinicAdminRegister,
        ROUTES.clinicAdminLogin,
      ];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = ROUTES.login;
      }
    } else if (status === 429) {
      toastStatusOnce(
        error.response?.data?.message || 'Too many requests. Please try again later.'
      );
    }
    return Promise.reject(error);
  }
);

export default api;
