// Dates are "YYYY-MM-DD" strings in the user's local time. Never derive them from
// toISOString(): that's UTC, so in the Philippines (UTC+8) anything before 8 AM
// would land on the previous day.

/** A calendar month in the user's local time, as "YYYY-MM". */
export type MonthKey = string

export function monthKey(date: Date = new Date()): MonthKey {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}`
}

/** Today's date in the user's local time, as "YYYY-MM-DD". */
export function todayLocal(now: Date = new Date()): string {
  return `${monthKey(now)}-${String(now.getDate()).padStart(2, '0')}`
}

function parseLocal(value: string): Date {
  const [year, month, day = 1] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** True for a real calendar date written as "YYYY-MM-DD". */
export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return todayLocal(parseLocal(value)) === value
}

export function shiftMonth(key: MonthKey, delta: number): MonthKey {
  const date = parseLocal(key)
  date.setMonth(date.getMonth() + delta)
  return monthKey(date)
}

/** "2026-10" → "October 2026" */
export function formatMonth(key: MonthKey): string {
  return parseLocal(key).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
}

/** "2026-10-13" → "Tue, Oct 13" */
export function formatDay(value: string): string {
  return parseLocal(value).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })
}
