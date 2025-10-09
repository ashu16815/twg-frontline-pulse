// Auckland timezone helper
export const AUCKLAND_TZ = 'Pacific/Auckland';

/**
 * Convert a UTC date to Auckland timezone
 */
export function toAuckland(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.toLocaleString('en-US', { timeZone: AUCKLAND_TZ }));
}

/**
 * Format a date in Auckland timezone
 */
export function formatAuckland(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: AUCKLAND_TZ
  }
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-NZ', options);
}

/**
 * Get current date/time in Auckland
 */
export function nowAuckland(): Date {
  return toAuckland(new Date());
}

/**
 * Get Auckland ISO week (YYYY-Www format)
 */
export function getAucklandISOWeek(date?: Date | string): string {
  const d = date ? toAuckland(date) : nowAuckland();
  
  // Get Thursday of this week (ISO week starts on Monday)
  const thursday = new Date(d);
  thursday.setDate(d.getDate() + (4 - (d.getDay() || 7)));
  
  // Get first Thursday of year
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const firstThursday = new Date(yearStart);
  firstThursday.setDate(yearStart.getDate() + (4 - (yearStart.getDay() || 7)));
  
  // Calculate week number
  const weekNum = Math.ceil((((thursday.getTime() - firstThursday.getTime()) / 86400000) + 1) / 7);
  
  return `${thursday.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}

