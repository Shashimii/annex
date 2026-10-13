import { describe, expect, it } from 'vitest'
import { validateCategoryForm, validateEntryForm, type EntryFormValues } from '@/features/budget/forms'
import type { Category } from '@/lib/schemas'

const valid: EntryFormValues = {
  type: 'expense',
  amount: '1,250.50',
  categoryId: 'default-expense-food',
  date: '2026-10-13',
  note: '  lunch  ',
}

describe('validateEntryForm', () => {
  it('converts a valid form into entry fields', () => {
    expect(validateEntryForm(valid)).toEqual({
      success: true,
      data: { type: 'expense', amount: 125050, categoryId: 'default-expense-food', date: '2026-10-13', note: 'lunch' },
    })
  })

  it('drops an empty note', () => {
    const result = validateEntryForm({ ...valid, note: '   ' })
    expect(result.success && result.data.note).toBeUndefined()
  })

  it('reports every invalid field', () => {
    const result = validateEntryForm({ type: 'expense', amount: '0', categoryId: '', date: '2026-02-30', note: 'x'.repeat(81) })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(Object.keys(result.errors).sort()).toEqual(['amount', 'categoryId', 'date', 'note'])
  })
})

const food: Category = {
  id: 'food',
  name: 'Food',
  kind: 'expense',
  order: 0,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
}

describe('validateCategoryForm', () => {
  it('accepts a name with an optional limit', () => {
    expect(validateCategoryForm({ name: ' Coffee ', limit: '1,500' }, 'expense', [food])).toEqual({
      success: true,
      data: { name: 'Coffee', monthlyLimit: 150000 },
    })
    expect(validateCategoryForm({ name: 'Coffee', limit: '' }, 'expense', [])).toEqual({
      success: true,
      data: { name: 'Coffee', monthlyLimit: undefined },
    })
  })

  it('ignores the limit for income categories', () => {
    const result = validateCategoryForm({ name: 'Bonus', limit: '500' }, 'income', [])
    expect(result).toEqual({ success: true, data: { name: 'Bonus', monthlyLimit: undefined } })
  })

  it('rejects empty and duplicate names and bad limits', () => {
    expect(validateCategoryForm({ name: '  ', limit: '' }, 'expense', []).success).toBe(false)

    const duplicate = validateCategoryForm({ name: 'food', limit: '' }, 'expense', [food])
    expect(!duplicate.success && duplicate.errors.name).toMatch(/already/)

    const badLimit = validateCategoryForm({ name: 'Coffee', limit: '-5' }, 'expense', [])
    expect(!badLimit.success && badLimit.errors.limit).toBeTruthy()
  })
})
