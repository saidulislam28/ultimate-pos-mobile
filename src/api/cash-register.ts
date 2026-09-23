import apiClient from './client';

export const fetchCashRegistersApi = async (page: number = 1, status?: string) => {
  const params: Record<string, any> = { page };
  if (status) params.status = status;
  
  const response = await apiClient.get('/cash-register', { params });
  return response.data;
};
