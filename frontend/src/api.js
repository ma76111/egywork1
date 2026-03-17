import axios from 'axios';

// في Railway: VITE_API_URL = رابط الـ backend مثل https://egywork-backend.up.railway.app
// في local: /api (عبر vite proxy)
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
