import apiClient from './client';

export interface ContactFilters {
  name?: string;
  type?: 'customer' | 'supplier' | '';
}

export const fetchContactsApi = async (page: number = 1, filters?: ContactFilters) => {
  const params: Record<string, any> = { page };
  if (filters?.name) params.name = filters.name;
  if (filters?.type) params.type = filters.type;
  
  const response = await apiClient.get('/contactapi', { params });
  return response.data;
};

export const fetchContactDetails = async (id: string | number) => {
  const response = await apiClient.get(`/contactapi/${id}`);
  return response.data;
};
