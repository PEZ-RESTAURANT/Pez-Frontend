export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return '';

  const date = new Date(value);

  return new Intl.DateTimeFormat('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};
