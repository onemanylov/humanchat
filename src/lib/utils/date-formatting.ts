/**
 * Centralized date and time formatting utilities
 * Provides consistent formatting across the application
 */

// Shared formatters to avoid recreating them
const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const relativeDateFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: 'auto',
});

/**
 * Formats a timestamp to display time only (HH:MM)
 * @param timestamp Unix timestamp in milliseconds
 * @returns Formatted time string or empty string if invalid
 */
export function formatMessageTime(timestamp: number): string {
  try {
    return timeFormatter.format(new Date(timestamp));
  } catch {
    return '';
  }
}

/**
 * Formats a timestamp to display date only (MMM DD, YYYY)
 * @param timestamp Unix timestamp in milliseconds
 * @returns Formatted date string or empty string if invalid
 */
export function formatMessageDate(timestamp: number): string {
  try {
    return dateFormatter.format(new Date(timestamp));
  } catch {
    return '';
  }
}

/**
 * Formats a timestamp to display full date and time
 * @param timestamp Unix timestamp in milliseconds
 * @returns Formatted date and time string or empty string if invalid
 */
export function formatMessageDateTime(timestamp: number): string {
  try {
    return dateTimeFormatter.format(new Date(timestamp));
  } catch {
    return '';
  }
}

/**
 * Formats a timestamp relative to now (e.g., "2 minutes ago", "yesterday")
 * @param timestamp Unix timestamp in milliseconds
 * @returns Relative time string or empty string if invalid
 */
export function formatRelativeTime(timestamp: number): string {
  try {
    const now = Date.now();
    const diffMs = timestamp - now;
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (Math.abs(diffMinutes) < 60) {
      return relativeDateFormatter.format(diffMinutes, 'minute');
    } else if (Math.abs(diffHours) < 24) {
      return relativeDateFormatter.format(diffHours, 'hour');
    } else {
      return relativeDateFormatter.format(diffDays, 'day');
    }
  } catch {
    return '';
  }
}

/**
 * Determines if two timestamps are on the same day
 * @param timestamp1 First timestamp
 * @param timestamp2 Second timestamp
 * @returns True if both timestamps are on the same day
 */
export function isSameDay(timestamp1: number, timestamp2: number): boolean {
  try {
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);
    
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  } catch {
    return false;
  }
}

/**
 * Checks if a timestamp is today
 * @param timestamp Unix timestamp in milliseconds
 * @returns True if timestamp is today
 */
export function isToday(timestamp: number): boolean {
  return isSameDay(timestamp, Date.now());
}

/**
 * Checks if a timestamp is yesterday
 * @param timestamp Unix timestamp in milliseconds
 * @returns True if timestamp is yesterday
 */
export function isYesterday(timestamp: number): boolean {
  const yesterday = Date.now() - (24 * 60 * 60 * 1000);
  return isSameDay(timestamp, yesterday);
}