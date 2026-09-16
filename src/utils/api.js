import axios from 'axios';
import toast from 'react-hot-toast';
import { ROUTES } from '../constants/routes';

// Full API base URL, e.g. http://localhost:5000/api — empty falls back to same-origin /api
const apiBaseURL = (import.meta.env.VITE_BACKEND_URL || '/api').replace(/\/$/, '');

const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let branchHeader = localStorage.getItem('branchId') || '';

export function setBranchHeader(id) {
  branchHeader = id || '';
}

api.interceptors.request.use((config) => {
  // Prefer httpOnly cookie; Bearer is a fallback for cross-origin / API clients.
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (branchHeader) {
    config.headers['X-Branch-Id'] = branchHeader;
  }
  // Let the browser set multipart boundary for FormData uploads.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    const headers = config.headers;
    if (headers) {
      if (typeof headers.set === 'function') {
        headers.set('Content-Type', false);
      } else {
        delete headers['Content-Type'];
      }
    }
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
      sessionStorage.removeItem('token');
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
        ROUTES.forgotPassword,
        ROUTES.resetPassword,
      ].filter(Boolean);
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
