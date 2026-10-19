import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

// Attach the saved login token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token expired, log the user out everywhere (a wrong password on the login form is not that)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginCall = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginCall) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

/** Turns any axios error into one readable sentence for the UI. */
export function getErrorMessage(error) {
  const data = error.response?.data;
  if (data?.errors?.length) return data.errors.join('. ');
  return data?.message || error.message || 'Something went wrong. Please try again.';
}

export default api;
