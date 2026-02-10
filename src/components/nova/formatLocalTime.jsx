import { format } from "date-fns";
import { enUS, fr } from "date-fns/locale";

/**
 * Format a UTC ISO date string to local browser time with locale support
 * @param {string | Date} isoDateString - ISO date string or Date object
 * @param {string} language - Language code ('en' or 'fr')
 * @param {string} formatPattern - date-fns format pattern (default: 'PPp')
 * @returns {string} Formatted date string in local timezone
 */
export function formatLocalTime(isoDateString, language = 'en', formatPattern = 'PPp') {
  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return format(date, formatPattern, {
      locale: language === 'fr' ? fr : enUS
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format a date with time and timezone offset
 * @param {string | Date} isoDateString - ISO date string or Date object
 * @param {string} language - Language code ('en' or 'fr')
 * @returns {string} Formatted date with timezone (e.g., "Feb 10, 2026 5:36 PM GMT-5")
 */
export function formatLocalTimeWithTZ(isoDateString, language = 'en') {
  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const formatted = format(date, 'PPpp', {
      locale: language === 'fr' ? fr : enUS
    });

    // Get timezone offset
    const offset = date.getTimezoneOffset();
    const absOffset = Math.abs(offset);
    const hours = Math.floor(absOffset / 60);
    const minutes = absOffset % 60;
    const sign = offset <= 0 ? '+' : '-';
    const tzOffset = `GMT${sign}${String(hours).padStart(2, '0')}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''}`;

    return `${formatted} ${tzOffset}`;
  } catch (error) {
    console.error('Error formatting date with timezone:', error);
    return 'Invalid date';
  }
}