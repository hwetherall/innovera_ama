/**
 * Utility functions for timezone and date calculations
 */

/**
 * Converts a date to 7am PST/PDT in UTC
 * @param date The target date
 * @returns Date object set to 7am PST/PDT in UTC
 */
export function convertTo7AmPST(date: Date): Date {
  const targetDate = new Date(date);
  
  // Check if it's daylight saving time (March 2nd Sunday to November 1st Sunday)
  const year = targetDate.getFullYear();
  const dstStart = getNthWeekdayOfMonth(year, 3, 0, 2); // 2nd Sunday of March
  const dstEnd = getNthWeekdayOfMonth(year, 11, 0, 1); // 1st Sunday of November
  
  const isDST = targetDate >= dstStart && targetDate < dstEnd;
  
  // PST = UTC-8, PDT = UTC-7
  // So 7am PST = 3pm UTC, 7am PDT = 2pm UTC
  const utcHour = isDST ? 14 : 15;
  
  targetDate.setUTCHours(utcHour, 0, 0, 0);
  return targetDate;
}

/**
 * Gets the Monday of the week before the given date's week
 * @param date The reference date
 * @returns Date object for the Monday of the previous week
 */
export function getPreviousMonday(date: Date): Date {
  // Create a new date and ensure we're working in local timezone
  const workingDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // Get the day of the week (0 = Sunday, 1 = Monday, ... 6 = Saturday)
  const dayOfWeek = workingDate.getDay();
  
  // Calculate days to go back to the Monday of the previous week
  let daysToSubtract;
  
  if (dayOfWeek === 0) { // Sunday
    daysToSubtract = 6; // Go back 6 days to get to Monday of previous week
  } else if (dayOfWeek === 1) { // Monday
    daysToSubtract = 7; // Go back 7 days to get to Monday of previous week
  } else { // Tuesday through Saturday
    daysToSubtract = dayOfWeek - 1 + 7; // Go back to Monday of current week, then 7 more
  }
  
  const result = new Date(workingDate);
  result.setDate(workingDate.getDate() - daysToSubtract);
  
  return result;
}

/**
 * Gets the nth weekday of a month
 * @param year Year
 * @param month Month (1-12)
 * @param weekday Day of week (0=Sunday, 1=Monday, etc.)
 * @param n Which occurrence (1=first, 2=second, etc.)
 * @returns Date object
 */
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const firstDay = new Date(year, month - 1, 1);
  const firstWeekday = new Date(year, month - 1, 1 + (weekday + 7 - firstDay.getDay()) % 7);
  return new Date(year, month - 1, firstWeekday.getDate() + (n - 1) * 7);
}

/**
 * Checks if a date has already passed
 * @param date Date to check
 * @returns True if the date has passed
 */
export function hasDatePassed(date: Date): boolean {
  return date <= new Date();
}
