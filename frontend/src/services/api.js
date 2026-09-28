import axios from 'axios';

export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
    ? 'https://akksys.onrender.com/api'
    : typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? 'https://chandanserverless.vercel.app/api' // Default vercel backend URL (can be overridden by VITE_API_URL)
    : '/api');

export const BACKEND_URL = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Stable per-browser visitor id, used by the backend to count unique scans/clicks
const getVisitorId = () => {
  try {
    let id = localStorage.getItem('akksys_visitor_id');
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem('akksys_visitor_id', id);
    }
    return id;
  } catch {
    return null;
  }
};

api.interceptors.request.use((config) => {
  const visitorId = getVisitorId();
  if (visitorId) {
    config.headers['X-Session-Id'] = visitorId;
  }
  const token = localStorage.getItem('akksys_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('akksys_token');
      localStorage.removeItem('akksys_user');
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
