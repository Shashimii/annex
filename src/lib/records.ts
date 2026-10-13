import type { Table } from 'dexie'
import type { Base } from '@/lib/schemas'

/**
 * A record as stored on this device. `dirty` marks changes the sync engine hasn't
 * uploaded yet (0/1 because IndexedDB can't index booleans); it is never uploaded.
 */
export type Local<T> = T & { dirty: 0 | 1 }

type RecordTable<T extends Base> = Table<Local<T>, string>
type Validator = { parse: (value: unknown) => unknown }

export const nowIso = () => new Date().toISOString()

export function createRecord<T extends object>(fields: T): Local<T & Base> {
  const now = nowIso()
  return { ...fields, id: crypto.randomUUID(), createdAt: now, updatedAt: now, dirty: 1 }
}

/** Applies changes to a record, bumping `updatedAt` and marking it dirty. */
export function updateRecord<T extends Base>(record: Local<T>, changes: Partial<T>): Local<T> {
  return { ...record, ...changes, updatedAt: nowIso(), dirty: 1 }
}

/** Reads, changes, validates and writes one record in a single transaction. */
export async function saveChanges<T extends Base>(
  table: RecordTable<T>,
  id: string,
  changes: Partial<T>,
  schema?: Validator,
): Promise<void> {
  await table.db.transaction('rw', table, async () => {
    const record = await table.get(id)
    if (!record) throw new Error(`Record ${id} not found in ${table.name}`)
    const next = updateRecord(record, changes)
    schema?.parse(next)
    await table.put(next)
  })
}

/** Records are never hard-deleted, so a delete on one device wins over a stale copy on another. */
export function softDelete<T extends Base>(table: RecordTable<T>, id: string): Promise<void> {
  return saveChanges(table, id, { deletedAt: nowIso() } as Partial<T>)
}

export function restore<T extends Base>(table: RecordTable<T>, id: string): Promise<void> {
  return saveChanges(table, id, { deletedAt: undefined } as Partial<T>)
}

export function isActive(record: Base): boolean {
  return !record.deletedAt
}
