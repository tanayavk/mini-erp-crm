import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('erp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format Error Messages & Catch 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Handle Joi validation errors array (400)
      if (status === 400 && Array.isArray(data.error)) {
        error.customMessage = data.error.map((e) => e.message).join(', ');
      } else {
        error.customMessage = data.message || 'An unexpected error occurred.';
      }

      // Handle 401 Unauthorized
      if (status === 401) {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;