import apiClient from './client';

export const fetchUsersApi = async (page: number = 1, perPage?: number) => {
  const params: Record<string, any> = { page };
  if (perPage) params.per_page = perPage;
  
  const response = await apiClient.get('/user', { params });
  return response.data;
};
