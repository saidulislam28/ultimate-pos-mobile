import apiClient from './client';

export interface ExpenseFilters {
  location_id?: string | number;
  expense_category_id?: string | number;
  start_date?: string;
  end_date?: string;
}

export const fetchExpensesApi = async (page: number = 1, filters?: ExpenseFilters) => {
  const params: Record<string, any> = { page };
  if (filters?.location_id) params.location_id = filters.location_id;
  if (filters?.expense_category_id) params.expense_category_id = filters.expense_category_id;
  if (filters?.start_date) params.start_date = filters.start_date;
  if (filters?.end_date) params.end_date = filters.end_date;

  const response = await apiClient.get('/expense', { params });
  return response.data;
};

export const fetchExpenseCategoriesApi = async () => {
  const response = await apiClient.get('/expense-categories');
  return response.data;
};
