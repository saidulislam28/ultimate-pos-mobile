import axios from 'axios';
import apiClient from './client';

export const loginApi = async (credentials: any) => {
  // Extract the root URL to hit the /oauth/token endpoint
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/connector/api';
  const rootUrl = apiUrl.replace('/connector/api', '');

  const payload = {
    grant_type: 'password',
    client_id: process.env.EXPO_PUBLIC_CLIENT_ID,
    client_secret: process.env.EXPO_PUBLIC_CLIENT_SECRET,
    username: credentials.username,
    password: credentials.password,
  };

  // We use standard axios instead of apiClient so it doesn't trigger the interceptors
  // (which would instantly try to redirect us if the login failed)
  const response = await axios.post(`${rootUrl}/oauth/token`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  });

  return response.data;
};

export const fetchProfileApi = async () => {
  const response = await apiClient.get('/user/loggedin');
  return response.data;
};
