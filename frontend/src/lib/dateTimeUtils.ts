/**
 * Date and time utility functions for DD/MM/YYYY HH:MM format
 */

/**
 * Convert DD/MM/YYYY HH:MM to ISO datetime string (YYYY-MM-DDTHH:MM)
 */
export function convertDDMMYYYYHHMMToISO(dateTimeStr: string): string {
  if (!dateTimeStr) return '';
  
  // If already in ISO format, return as is
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateTimeStr)) {
    return dateTimeStr;
  }
  
  // Parse DD/MM/YYYY HH:MM format
  const match = dateTimeStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (match) {
    const [, day, month, year, hour, minute] = match;
    return `${year}-${month}-${day}T${hour}:${minute}`;
  }
  
  // Try to parse DD/MM/YYYY format (time defaults to 00:00)
  const dateMatch = dateTimeStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    return `${year}-${month}-${day}T00:00`;
  }
  
  // Try to parse as ISO and convert
  try {
    const date = new Date(dateTimeStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hour}:${minute}`;
    }
  } catch {
    // Ignore
  }
  
  return '';
}

/**
 * Convert ISO datetime string (YYYY-MM-DDTHH:MM or YYYY-MM-DDTHH:MM:SS) to DD/MM/YYYY HH:MM
 */
export function convertISOToDDMMYYYYHHMM(isoStr: string): string {
  if (!isoStr) return '';
  
  // If already in DD/MM/YYYY HH:MM format, return as is
  if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}$/.test(isoStr)) {
    return isoStr;
  }
  
  // Parse ISO format (YYYY-MM-DDTHH:MM or YYYY-MM-DDTHH:MM:SS)
  const isoMatch = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (isoMatch) {
    const [, year, month, day, hour, minute] = isoMatch;
    return `${day}/${month}/${year} ${hour}:${minute}`;
  }
  
  // Parse YYYY-MM-DD format (time defaults to 00:00)
  const dateMatch = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return `${day}/${month}/${year} 00:00`;
  }
  
  // Try to parse as date and convert
  try {
    const date = new Date(isoStr);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hour}:${minute}`;
    }
  } catch {
    // Ignore
  }
  
  return '';
}

/**
 * Validate DD/MM/YYYY HH:MM format
 */
export function isValidDDMMYYYYHHMM(dateTimeStr: string): boolean {
  if (!dateTimeStr) return false;
  const match = dateTimeStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!match) return false;
  
  const [, day, month, year, hour, minute] = match;
  const dayNum = parseInt(day);
  const monthNum = parseInt(month);
  const yearNum = parseInt(year);
  const hourNum = parseInt(hour);
  const minuteNum = parseInt(minute);
  
  if (monthNum < 1 || monthNum > 12) return false;
  if (dayNum < 1 || dayNum > 31) return false;
  if (yearNum < 1900 || yearNum > 2100) return false;
  if (hourNum < 0 || hourNum > 23) return false;
  if (minuteNum < 0 || minuteNum > 59) return false;
  
  const date = new Date(yearNum, monthNum - 1, dayNum, hourNum, minuteNum);
  return (
    date.getDate() === dayNum &&
    date.getMonth() === monthNum - 1 &&
    date.getFullYear() === yearNum &&
    date.getHours() === hourNum &&
    date.getMinutes() === minuteNum
  );
}

/**
 * Parse DD/MM/YYYY HH:MM to Date object
 */
export function parseDDMMYYYYHHMM(dateTimeStr: string): Date | null {
  if (!dateTimeStr) return null;
  
  const match = dateTimeStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (match) {
    const [, day, month, year, hour, minute] = match;
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute)
    );
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  return null;
}



