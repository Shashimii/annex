import Dexie, { type Table } from 'dexie'
import { DEFAULT_CATEGORIES } from '@/features/budget/categories'
import type { Local } from '@/lib/records'
import type { Category, Entry } from '@/lib/schemas'

export const db = new Dexie('annex') as Dexie & {
  entries: Table<Local<Entry>, string>
  categories: Table<Local<Category>, string>
}

db.version(1).stores({
  entries: 'id, date, categoryId, dirty',
  categories: 'id, kind, dirty',
})

// Runs once, when this browser's database is first created.
db.on('populate', async (tx) => {
  await tx.table('categories').bulkAdd(DEFAULT_CATEGORIES)
})
