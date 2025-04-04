// Simple formatter for currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(value);
} 