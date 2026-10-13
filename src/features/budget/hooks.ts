import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { MonthKey } from '@/lib/dates'

// Live queries re-render whenever the underlying IndexedDB data changes.
// They return undefined while the first read is in flight.

/** All categories, including deleted ones so old entries can still show their name. */
export function useCategories() {
  return useLiveQuery(() => db.categories.toArray(), [])
}

/** Active entries dated within the month. */
export function useMonthEntries(month: MonthKey) {
  return useLiveQuery(
    () => db.entries.where('date').startsWith(`${month}-`).filter((entry) => !entry.deletedAt).toArray(),
    [month],
  )
}

export function useEntry(id: string | undefined) {
  return useLiveQuery(() => (id ? db.entries.get(id) : undefined), [id])
}
