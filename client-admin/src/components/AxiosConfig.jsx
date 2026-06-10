'use client';

import { useEffect } from 'react';
import axios from 'axios';

export default function AxiosConfig() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      const requestInterceptor = axios.interceptors.request.use(
        (config) => {
          const currentToken = localStorage.getItem('token');
          if (currentToken) {
            config.headers['Authorization'] = `Bearer ${currentToken}`;
          }
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      return () => {
        axios.interceptors.request.eject(requestInterceptor);
      };
    }
  }, []);

  return null;
}
