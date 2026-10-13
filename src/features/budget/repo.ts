import { activeCategories } from '@/features/budget/categories'
import { db } from '@/lib/db'
import { createRecord, restore, saveChanges, softDelete, updateRecord } from '@/lib/records'
import { categorySchema, entrySchema, type EntryFields, type EntryType } from '@/lib/schemas'

// Every budget write goes through here, so updatedAt and dirty are always set
// and nothing is ever hard-deleted.

export async function addEntry(fields: EntryFields): Promise<string> {
  const entry = createRecord(fields)
  entrySchema.parse(entry)
  await db.entries.add(entry)
  return entry.id
}

export function updateEntry(id: string, fields: EntryFields): Promise<void> {
  return saveChanges(db.entries, id, fields, entrySchema)
}

export function deleteEntry(id: string): Promise<void> {
  return softDelete(db.entries, id)
}

export function restoreEntry(id: string): Promise<void> {
  return restore(db.entries, id)
}

export type CategoryInput = { name: string; monthlyLimit?: number }

export async function addCategory(kind: EntryType, input: CategoryInput): Promise<string> {
  return db.transaction('rw', db.categories, async () => {
    const sameKind = await db.categories.where('kind').equals(kind).toArray()
    const order = Math.max(-1, ...sameKind.map((category) => category.order)) + 1
    const category = createRecord({ ...input, kind, order })
    categorySchema.parse(category)
    await db.categories.add(category)
    return category.id
  })
}

export function updateCategory(id: string, input: CategoryInput): Promise<void> {
  return saveChanges(db.categories, id, input, categorySchema)
}

export function deleteCategory(id: string): Promise<void> {
  return softDelete(db.categories, id)
}

export function restoreCategory(id: string): Promise<void> {
  return restore(db.categories, id)
}

/** Swaps a category with its neighbour above (-1) or below (1) among the active ones of its kind. */
export async function moveCategory(id: string, direction: -1 | 1): Promise<void> {
  await db.transaction('rw', db.categories, async () => {
    const category = await db.categories.get(id)
    if (!category) return

    const siblings = activeCategories(await db.categories.where('kind').equals(category.kind).toArray(), category.kind)
    const from = siblings.findIndex((sibling) => sibling.id === id)
    const to = from + direction
    if (to < 0 || to >= siblings.length) return

    const moved = siblings[from]
    siblings[from] = siblings[to]
    siblings[to] = moved

    const changed = siblings.flatMap((sibling, order) => (sibling.order === order ? [] : [updateRecord(sibling, { order })]))
    await db.categories.bulkPut(changed)
  })
}
