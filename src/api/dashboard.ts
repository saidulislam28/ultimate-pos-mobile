import apiClient from './client';

export const fetchBusinessDetailsApi = async () => {
  const response = await apiClient.get('/business-details');
  return response.data;
};

export const fetchProfitLossReportApi = async (startDate?: string, endDate?: string) => {
  // If dates are provided, we can pass them as query params. 
  // e.g. /profit-loss-report?start_date=2024-01-01&end_date=2024-01-31
  let url = '/profit-loss-report';
  
  if (startDate && endDate) {
    url += `?start_date=${startDate}&end_date=${endDate}`;
  }
  
  const response = await apiClient.get(url);
  return response.data;
};
