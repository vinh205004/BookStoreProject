import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../config/api';

interface ApiError extends Error {
  response?: {
    status?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
  };
}

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: AxiosError) => {
    const requestUrl = error.config?.url || '';
    const isLoginRequest = requestUrl.includes('/Auth/login');

    if (error.response?.status !== 401) {
      console.error('API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    } else if (!isLoginRequest) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    const apiError: ApiError = new Error(error.message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiError.response = {
      status: error.response?.status,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: (error.response?.data as any) || {}
    };

    return Promise.reject(apiError);
  }
);

export default axiosClient;
