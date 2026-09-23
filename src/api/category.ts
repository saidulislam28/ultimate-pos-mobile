import apiClient from './client';

export const fetchCategoriesApi = async (type: string = 'product', page: number = 1, perPage?: number) => {
  const params: Record<string, any> = { type, page };
  if (perPage) params.per_page = perPage;
  
  const response = await apiClient.get('/taxonomy', { params });
  return response.data;
};
