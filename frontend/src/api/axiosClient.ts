import axios, { AxiosError } from 'axios';

interface ApiError extends Error {
  response?: {
    status?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
  };
}

const axiosClient = axios.create({
  baseURL: 'https://localhost:7087/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Trước khi gửi request đi, tự động nhét Token vào Header
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Lấy token từ LocalStorage
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor: Xử lý lỗi trả về
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: AxiosError) => {
    // Log the full error for debugging
    if (error.response?.status !== 401) {
      console.error('API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    
    // Reject với error object có structure nhất quán
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