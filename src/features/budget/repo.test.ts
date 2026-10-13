import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { activeCategories, DEFAULT_CATEGORIES } from '@/features/budget/categories'
import {
  addCategory,
  addEntry,
  deleteCategory,
  deleteEntry,
  moveCategory,
  restoreEntry,
  updateCategory,
  updateEntry,
} from '@/features/budget/repo'
import { db } from '@/lib/db'
import type { EntryFields } from '@/lib/schemas'

const lunch: EntryFields = { type: 'expense', amount: 25000, categoryId: 'default-expense-food', date: '2026-10-13', note: 'lunch' }

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-13T01:00:00.000Z'))
  await db.delete()
  await db.open()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('default categories', () => {
  it('are seeded once with fixed ids', async () => {
    const categories = await db.categories.toArray()
    expect(categories).toHaveLength(DEFAULT_CATEGORIES.length)
    expect(await db.categories.get('default-expense-food')).toMatchObject({ name: 'Food', kind: 'expense', order: 0 })
    expect(await db.categories.get('default-income-other-income')).toMatchObject({ name: 'Other income', kind: 'income' })
  })
})

describe('entries', () => {
  it('are created with an id, timestamps and the dirty flag', async () => {
    const id = await addEntry(lunch)
    expect(await db.entries.get(id)).toEqual({
      ...lunch,
      id,
      createdAt: '2026-10-13T01:00:00.000Z',
      updatedAt: '2026-10-13T01:00:00.000Z',
      dirty: 1,
    })
  })

  it('reject invalid data', async () => {
    await expect(addEntry({ ...lunch, amount: 0 })).rejects.toThrow()
    await expect(addEntry({ ...lunch, amount: 12.5 })).rejects.toThrow()
    await expect(addEntry({ ...lunch, date: '2026-02-30' })).rejects.toThrow()
    expect(await db.entries.count()).toBe(0)
  })

  it('bump updatedAt on every change and keep createdAt', async () => {
    const id = await addEntry(lunch)
    await db.entries.update(id, { dirty: 0 })

    vi.setSystemTime(new Date('2026-10-13T02:00:00.000Z'))
    await updateEntry(id, { ...lunch, amount: 30000, note: undefined })

    const entry = await db.entries.get(id)
    expect(entry).toMatchObject({ amount: 30000, createdAt: '2026-10-13T01:00:00.000Z', updatedAt: '2026-10-13T02:00:00.000Z', dirty: 1 })
    expect(entry?.note).toBeUndefined()
  })

  it('are soft-deleted and can be restored', async () => {
    const id = await addEntry(lunch)

    vi.setSystemTime(new Date('2026-10-13T03:00:00.000Z'))
    await deleteEntry(id)
    expect(await db.entries.get(id)).toMatchObject({ deletedAt: '2026-10-13T03:00:00.000Z', updatedAt: '2026-10-13T03:00:00.000Z' })

    vi.setSystemTime(new Date('2026-10-13T04:00:00.000Z'))
    await restoreEntry(id)
    const restored = await db.entries.get(id)
    expect(restored?.deletedAt).toBeUndefined()
    expect(restored?.updatedAt).toBe('2026-10-13T04:00:00.000Z')
  })
})

describe('categories', () => {
  it('are added at the end of their kind', async () => {
    const id = await addCategory('expense', { name: 'Coffee', monthlyLimit: 150000 })
    expect(await db.categories.get(id)).toMatchObject({ name: 'Coffee', kind: 'expense', order: 8, monthlyLimit: 150000, dirty: 1 })
  })

  it('reject a limit on an income category', async () => {
    await expect(addCategory('income', { name: 'Bonus', monthlyLimit: 100 })).rejects.toThrow()
  })

  it('can set and clear a limit', async () => {
    await updateCategory('default-expense-food', { name: 'Food', monthlyLimit: 500000 })
    expect((await db.categories.get('default-expense-food'))?.monthlyLimit).toBe(500000)

    await updateCategory('default-expense-food', { name: 'Groceries', monthlyLimit: undefined })
    const food = await db.categories.get('default-expense-food')
    expect(food?.name).toBe('Groceries')
    expect(food?.monthlyLimit).toBeUndefined()
  })

  it('move among active siblings only', async () => {
    await deleteCategory('default-expense-transport')
    await moveCategory('default-expense-bills', -1)

    const names = activeCategories(await db.categories.toArray(), 'expense').map((c) => c.name)
    expect(names.slice(0, 3)).toEqual(['Bills', 'Food', 'Rent'])
  })

  it('ignore moves past either end', async () => {
    const before = await db.categories.toArray()
    await moveCategory('default-expense-food', -1)
    await moveCategory('default-expense-other', 1)
    expect(await db.categories.toArray()).toEqual(before)
  })
})
