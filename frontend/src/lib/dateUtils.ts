/**
 * Date utility functions for DD/MM/YYYY format
 */

/**
 * Convert a date string to DD/MM/YYYY format
 * Accepts: YYYY-MM-DD, ISO date strings, or DD/MM/YYYY
 */
export function formatDateDDMMYYYY(date: string | null | undefined): string {
  if (!date) return '—';
  
  try {
    // If already in DD/MM/YYYY format, return as is
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      return date;
    }
    
    // First try to parse as YYYY-MM-DD (most common from database)
    const yyyyMMddMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (yyyyMMddMatch) {
      const [, year, month, day] = yyyyMMddMatch;
      return `${day}/${month}/${year}`;
    }
    
    // Try to parse as ISO date string (e.g., "2025-01-11T00:00:00.000Z")
    const isoMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})T/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}/${month}/${year}`;
    }
    
    // Fallback: Parse using Date object (handles various formats)
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '—';
    }
    
    // Always format as DD/MM/YYYY regardless of input format
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return '—';
  }
}

/**
 * Convert DD/MM/YYYY to YYYY-MM-DD (for HTML date inputs)
 */
export function convertDDMMYYYYToYYYYMMDD(dateStr: string): string {
  if (!dateStr) return '';
  
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Parse DD/MM/YYYY format
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }
  
  // Try to parse as date and convert
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Ignore
  }
  
  return '';
}

/**
 * Convert YYYY-MM-DD to DD/MM/YYYY (for display)
 */
export function convertYYYYMMDDToDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '';
  
  // If already in DD/MM/YYYY format, return as is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Parse YYYY-MM-DD format
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  
  // Try to parse as date and convert
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch {
    // Ignore
  }
  
  return '';
}

/**
 * Parse DD/MM/YYYY to Date object
 */
export function parseDDMMYYYY(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  return null;
}

/**
 * Validate DD/MM/YYYY format
 */
export function isValidDDMMYYYY(dateStr: string): boolean {
  if (!dateStr) return false;
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  
  const [, day, month, year] = match;
  const dayNum = parseInt(day);
  const monthNum = parseInt(month);
  const yearNum = parseInt(year);
  
  if (monthNum < 1 || monthNum > 12) return false;
  if (dayNum < 1 || dayNum > 31) return false;
  if (yearNum < 1900 || yearNum > 2100) return false;
  
  const date = new Date(yearNum, monthNum - 1, dayNum);
  return date.getDate() === dayNum && date.getMonth() === monthNum - 1 && date.getFullYear() === yearNum;
}

