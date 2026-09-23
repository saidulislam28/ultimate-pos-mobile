import apiClient from './client';

export interface SaleProduct {
  product_id: number | string;
  variation_id: number | string;
  quantity: number;
  unit_price: number;
}

export interface SalePayment {
  amount: number;
  method: string;
  note?: string;
}

export interface SalePayload {
  location_id: number | string;
  contact_id: number | string;
  status?: 'final' | 'draft' | 'quotation';
  payment_status?: 'paid' | 'due' | 'partial';
  products: SaleProduct[];
  payments: SalePayment[];
}

export const submitSaleApi = async (payload: SalePayload) => {
  // Ensure default statuses
  const finalPayload = {
    status: 'final',
    payment_status: 'paid',
    ...payload,
  };
  
  const requestPayload = { sells: [finalPayload] };
  const response = await apiClient.post('/sell', requestPayload);
  return response.data;
};

export interface SaleFilters {
  location_id?: number | string;
  contact_id?: number | string;
  payment_status?: string;
  start_date?: string;
  end_date?: string;
}

export const fetchSalesApi = async (page: number = 1, filters?: SaleFilters) => {
  let url = `/sell?page=${page}`;
  
  if (filters?.location_id) url += `&location_id=${filters.location_id}`;
  if (filters?.contact_id) url += `&contact_id=${filters.contact_id}`;
  if (filters?.payment_status) url += `&payment_status=${filters.payment_status}`;
  if (filters?.start_date) url += `&start_date=${filters.start_date}`;
  if (filters?.end_date) url += `&end_date=${filters.end_date}`;
  
  const response = await apiClient.get(url);
  return response.data;
};

export const fetchSaleDetailsApi = async (id: string | number) => {
  const response = await apiClient.get(`/sell/${id}`);
  return response.data;
};
