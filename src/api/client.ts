import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

// In Expo, variables prefixed with EXPO_PUBLIC_ are available inline
const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/connector/api';

const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers.Accept = 'application/json';
      console.log(`[API Request] ${config.baseURL}${config.url}`);
      console.log(`[API Request Headers]`, config.headers);
    } catch (error) {
      console.error('Error fetching token from SecureStore', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired
      try {
        await SecureStore.deleteItemAsync('access_token');
      } catch (e) {
        console.error('Error deleting token from SecureStore', e);
      }
      
      // Redirect to login (Note: Login page will be created in Phase 3)
      console.warn('Unauthorized - Redirecting to Login');
      
      // If we're not already on the login page, redirect
      // This is a safety catch for Phase 3 where we implement auth
      router.replace('/auth/login'); 
    }
    return Promise.reject(error);
  }
);

export default apiClient;
