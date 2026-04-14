/**
 * Formatta un numero come valuta in Euro
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (value == null) return 'Non specificato';
  
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formatta un numero con separatori delle migliaia
 */
export const formatNumber = (value: number | null | undefined): string => {
  if (value == null) return '0';
  
  return new Intl.NumberFormat('it-IT').format(value);
};

/**
 * Parse una stringa valuta in numero
 */
export const parseCurrency = (value: string): number | null => {
  if (!value) return null;
  
  // Rimuovi simboli e spazi
  const cleaned = value.replace(/[€\s.]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? null : parsed;
};

/**
 * Formatta una data in italiano
 */
export const formatDate = (dateString: string, includeTime = false): string => {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return 'Data non valida';
  }
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return date.toLocaleDateString('it-IT', options);
};