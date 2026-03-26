/**
 * Formats a numeric value as currency in units of thousands (divide by 1000)
 * @param {number|string} val - The value in base units (e.g., 50000)
 * @returns {string} - Formatted string in thousands (e.g., "50")
 */
export const formatCurrency = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const numericVal = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(numericVal)) return '';
    
    // Usamos Intl.NumberFormat para asegurar puntos como separadores de mil
    // La localización 'es-CO' debería usar puntos, pero por seguridad usamos una que siempre lo haga
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numericVal).replace(/,/g, '.'); // En caso de que se use coma como separador de mil por error de locale
};

/**
 * Clean a formatted string and convert back to base units (multiply by 1000)
 * @param {string} val - Formatted string in thousands (e.g., "50")
 * @returns {number} - Numeric value in base units (e.g., 50000)
 */
export const cleanNumericValue = (val) => {
    if (!val && val !== 0) return 0;
    // Si ya es un número, lo devolvemos
    if (typeof val === 'number') return val;
    
    // Eliminamos todo lo que no sea número, punto o coma
    const cleanStr = val.toString().replace(/[^0-9.,]/g, '');
    
    // Si hay puntos y comas, asumimos formato 1.234,56
    // Si solo hay puntos, asumimos 1.234
    // Si solo hay comas, asumimos 1,234 (o 1,234 si es decimal)
    // En el contexto del hotel en Colombia, usualmente no hay decimales.
    // Asumiremos que el punto es separador de miles y lo eliminamos.
    const finalStr = cleanStr.replace(/\./g, '').replace(',', '.');
    
    const numeric = parseFloat(finalStr);
    return isNaN(numeric) ? 0 : numeric;
};

/**
 * Resolves an image URL, handling both absolute paths (Cloudinary) and relative paths (Local)
 * @param {string} url - The image URL or path from the database
 * @param {string} baseUrl - The API base URL for relative paths
 * @returns {string} - The corrected full URL
 */
export const getImageUrl = (url, baseUrl = '') => {
    if (!url) return '';
    // If it's already an absolute URL (starts with http), return it as is
    if (url.startsWith('http')) return url;
    // Otherwise, prepend the base URL
    return `${baseUrl}${url}`;
};
