import axios from 'axios';

// baseURL is '/api' — the Vite dev server proxies it to Express :4000.
const api = axios.create({ baseURL: '/api' });

// Attach the stored JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;