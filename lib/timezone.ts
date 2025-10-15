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

/**
 * Get Financial Year week (FY26-Www format)
 * Financial year starts August 1st, 2025 (FY26)
 */
export function getFinancialYearWeek(date?: Date | string): string {
  const d = date ? toAuckland(date) : nowAuckland();
  
  // Financial year starts August 1st, 2025
  const fyStart = new Date(2025, 7, 1); // August 1st, 2025 (month is 0-indexed)
  
  // Calculate which financial year we're in
  let fyYear = 26; // Start with FY26
  let fyStartDate = new Date(fyStart);
  
  // If current date is before August 1st, we're still in the previous FY
  if (d < fyStartDate) {
    fyYear = 25;
    fyStartDate = new Date(2024, 7, 1); // August 1st, 2024
  } else {
    // Check if we're in a future FY
    while (d >= new Date(fyStartDate.getFullYear() + 1, 7, 1)) {
      fyYear++;
      fyStartDate = new Date(fyStartDate.getFullYear() + 1, 7, 1);
    }
  }
  
  // Calculate week number within the financial year
  const daysDiff = Math.floor((d.getTime() - fyStartDate.getTime()) / (1000 * 60 * 60 * 24));
  const weekNum = Math.floor(daysDiff / 7) + 1;
  
  return `FY${fyYear}-W${weekNum.toString().padStart(2, '0')}`;
}

/**
 * Get current financial year week (default function for backward compatibility)
 */
export function getCurrentFinancialWeek(): string {
  return getFinancialYearWeek();
}

