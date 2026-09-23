import apiClient from './client';

export interface SellReturnFilters {
  location_id?: string | number;
  start_date?: string;
  end_date?: string;
}

export const fetchSellReturnsApi = async (page: number = 1, filters?: SellReturnFilters) => {
  const params: Record<string, any> = { page };
  if (filters?.location_id) params.location_id = filters.location_id;
  if (filters?.start_date) params.start_date = filters.start_date;
  if (filters?.end_date) params.end_date = filters.end_date;
  
  const response = await apiClient.get('/list-sell-return', { params });
  return response.data;
};
