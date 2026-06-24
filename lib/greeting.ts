/**
 * Returns a time-of-day greeting for the given date. Defaults to the current time.
 */
export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "صباح الخير";
  if (hour < 17) return "مساء الخير";
  return "مساء النور";
}

/** Extracts the first name from a full name, e.g. "James Smith" -> "James". */
export function getFirstName(name?: string | null): string | undefined {
  const first = name?.trim().split(/\s+/)[0];
  return first || undefined;
}
