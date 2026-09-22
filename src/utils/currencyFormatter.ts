export interface CurrencyData {
  code: string;
  symbol: string;
  thousand_separator: string;
  decimal_separator: string;
}

export const formatCurrency = (amount: number | string, currency?: CurrencyData) => {
  const numericAmount = Number(amount) || 0;
  
  if (!currency) {
    // Fallback if no currency data is provided
    return `$${numericAmount.toLocaleString()}`;
  }

  // Format the number with the custom separators
  const parts = numericAmount.toFixed(2).split('.');
  const wholePart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousand_separator);
  const formattedAmount = `${wholePart}${currency.decimal_separator}${parts[1]}`;

  return `${currency.symbol}${formattedAmount}`;
};
