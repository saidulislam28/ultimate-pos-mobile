import apiClient from './client';

export const fetchProductsApi = async (page: number = 1, searchQuery: string = '') => {
  let url = `/product?page=${page}`;
  
  if (searchQuery) {
    url += `&name=${encodeURIComponent(searchQuery)}`;
  }
  
  const response = await apiClient.get(url);
  return response.data;
};
