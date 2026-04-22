const defaultApiBaseUrl = 'https://localhost:7087/api';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || defaultApiBaseUrl;

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/i, '');
