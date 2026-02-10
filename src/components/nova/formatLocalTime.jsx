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
 * Format a date with time in user's local timezone (no GMT suffix)
 * @param {string | Date} isoDateString - ISO date string or Date object
 * @param {string} language - Language code ('en' or 'fr')
 * @returns {string} Formatted date with time in local timezone (e.g., "Feb 10, 2026 5:36 PM")
 */
export function formatLocalTimeWithTZ(isoDateString, language = 'en') {
  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    // Format directly to local time using toLocaleString
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };

    return date.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-US', options);
  } catch (error) {
    console.error('Error formatting date with timezone:', error);
    return 'Invalid date';
  }
}