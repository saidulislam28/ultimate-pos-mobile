import apiClient from './client';

export interface ProductFilters {
  category_id?: string;
  brand_id?: string;
}

export const fetchProductsApi = async (page: number = 1, searchQuery: string = '', filters?: ProductFilters) => {
  let url = `/product?page=${page}`;
  
  if (searchQuery) {
    url += `&name=${encodeURIComponent(searchQuery)}`;
  }
  
  if (filters?.category_id) {
    url += `&category_id=${filters.category_id}`;
  }
  
  if (filters?.brand_id) {
    url += `&brand_id=${filters.brand_id}`;
  }
  
  const response = await apiClient.get(url);
  return response.data;
};

export const fetchCategoriesApi = async () => {
  const response = await apiClient.get('/taxonomy');
  return response.data;
};

export const fetchBrandsApi = async () => {
  const response = await apiClient.get('/brand');
  return response.data;
};
