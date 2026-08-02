export const formatCurrency = (value: number | null | undefined): string => {
  if (value == null) return '';

  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(value);
};
