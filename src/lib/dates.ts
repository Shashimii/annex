/** A calendar month in the user's local time, as "YYYY-MM". */
export type MonthKey = string

export function monthKey(date: Date = new Date()): MonthKey {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}`
}

function firstDayOf(key: MonthKey): Date {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1)
}

export function shiftMonth(key: MonthKey, delta: number): MonthKey {
  const date = firstDayOf(key)
  date.setMonth(date.getMonth() + delta)
  return monthKey(date)
}

/** "2026-10" → "October 2026" */
export function formatMonth(key: MonthKey): string {
  return firstDayOf(key).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
}
