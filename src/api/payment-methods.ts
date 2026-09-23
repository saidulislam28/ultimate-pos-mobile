import apiClient from './client';

export const fetchPaymentMethodsApi = async () => {
  const response = await apiClient.get('/payment-methods');
  return response.data;
};
