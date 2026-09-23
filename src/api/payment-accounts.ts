import apiClient from './client';

export const fetchPaymentAccountsApi = async (locationId?: string | number) => {
  const params: Record<string, any> = {};
  if (locationId) params.location_id = locationId;
  
  const response = await apiClient.get('/payment-accounts', { params });
  return response.data;
};
