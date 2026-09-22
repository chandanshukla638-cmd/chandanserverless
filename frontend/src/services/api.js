import axios from 'axios';

export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
    ? 'https://akksys.onrender.com/api'
    : typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? 'https://akksys-backend.vercel.app/api' // Default vercel backend URL (can be overridden by VITE_API_URL)
    : '/api');

export const BACKEND_URL = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
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
