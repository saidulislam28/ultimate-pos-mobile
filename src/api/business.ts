import apiClient from './client';

export const fetchBusinessLocations = async (perPage?: number) => {
  const params: Record<string, any> = {};
  if (perPage) params.per_page = perPage;
  
  const response = await apiClient.get('/business-location', { params });
  return response.data;
};

export const fetchBusinessLocation = async (id: string | number) => {
  const response = await apiClient.get(`/business-location/${id}`);
  return response.data;
};
