import axios from 'axios';
import toast from 'react-hot-toast';
import { ROUTES } from '../constants/routes';

// Full API base URL, e.g. http://localhost:5000/api — empty falls back to same-origin /api
const apiBaseURL = (import.meta.env.VITE_BACKEND_URL || '/api').replace(/\/$/, '');

const GET_CACHE_TTL_MS = 20_000;

/** @type {Map<string, { expires: number, response: import('axios').AxiosResponse }>} */
const getCache = new Map();
/** @type {Map<string, Promise<import('axios').AxiosResponse>>} */
const getInflight = new Map();

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
  // Branch scope changed — drop cached GETs
  clearApiGetCache();
}

export function clearApiGetCache() {
  getCache.clear();
  getInflight.clear();
}

function buildCacheKey(config) {
  const method = String(config.method || 'get').toLowerCase();
  const url = String(config.url || '');
  const params =
    config.params && typeof config.params === 'object' ? JSON.stringify(config.params) : '';
  const branch = branchHeader || config.headers?.['X-Branch-Id'] || '';
  return `${method}|${url}|${params}|b=${branch}`;
}

function shouldCacheGet(config) {
  if (String(config.method || 'get').toLowerCase() !== 'get') return false;
  if (config.skipCache || config.headers?.['X-Skip-Cache']) return false;
  const url = String(config.url || '');
  // Keep auth/session fresh (manual Check status / login flows)
  if (url.includes('/auth/')) return false;
  return true;
}

const defaultAdapter = axios.getAdapter(api.defaults.adapter);

api.defaults.adapter = async (config) => {
  const method = String(config.method || 'get').toLowerCase();

  if (shouldCacheGet(config)) {
    const key = buildCacheKey(config);
    const cached = getCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return {
        ...cached.response,
        config,
        request: cached.response.request || {},
      };
    }
    if (getInflight.has(key)) {
      return getInflight.get(key);
    }
    const pending = Promise.resolve(defaultAdapter(config))
      .then((response) => {
        getCache.set(key, { expires: Date.now() + GET_CACHE_TTL_MS, response });
        getInflight.delete(key);
        return response;
      })
      .catch((err) => {
        getInflight.delete(key);
        throw err;
      });
    getInflight.set(key, pending);
    return pending;
  }

  const response = await defaultAdapter(config);
  // Mutations invalidate GET cache so lists stay correct after create/update/delete
  if (method !== 'get' && method !== 'head' && method !== 'options') {
    clearApiGetCache();
  }
  return response;
};

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
      clearApiGetCache();
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
