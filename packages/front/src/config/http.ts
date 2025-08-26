// src/lib/http.ts
import axios from 'axios';
import { env } from './env.validation';
import { DevMode } from './mode.enum';

export const http = axios.create({
  baseURL: env.API_URL,
  timeout: 10_000,
  withCredentials: false,
});

if (env.MODE === DevMode.DEVELOPMENT) {
  http.interceptors.request.use((config) => {
    if (!config.baseURL) {
      // eslint-disable-next-line no-console
      console.error('Base URL is not defined in the request config');
      return config;
    }

    if (!config.url) {
      // eslint-disable-next-line no-console
      console.error('URL is not defined in the request config');
      return config;
    }

    // eslint-disable-next-line no-console
    console.debug('[HTTP] Request:', config.method?.toUpperCase(), config.baseURL + config.url);
    return config;
  });
  http.interceptors.response.use(
    (res) => {
      // eslint-disable-next-line no-console
      console.debug('[HTTP] Response:', res.status, res.config.url);
      return res;
    },
    (err) => {
      // eslint-disable-next-line no-console
      console.debug('[HTTP] Error:', err?.response?.status, err?.config?.url);
      return Promise.reject(new Error(err));
    },
  );
}