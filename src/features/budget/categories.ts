import type { Local } from '@/lib/records'
import type { Category, EntryType } from '@/lib/schemas'

// Default categories get fixed ids so two devices that each seed before their first
// sync end up with the same records, and an old timestamp so any real edit wins a merge.
const SEEDED_AT = '2000-01-01T00:00:00.000Z'

function seed(kind: EntryType, names: string[]): Local<Category>[] {
  return names.map((name, order) => ({
    id: `default-${kind}-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    kind,
    order,
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
    dirty: 1,
  }))
}

export const DEFAULT_CATEGORIES: Local<Category>[] = [
  ...seed('expense', ['Food', 'Transport', 'Bills', 'Rent', 'Shopping', 'Health', 'Fun', 'Other']),
  ...seed('income', ['Salary', 'Side income', 'Gift', 'Other income']),
]

/** Categories of one kind that haven't been deleted, in display order. */
export function activeCategories<T extends Category>(categories: T[], kind: EntryType): T[] {
  return categories
    .filter((category) => category.kind === kind && !category.deletedAt)
    .sort((a, b) => a.order - b.order)
}
