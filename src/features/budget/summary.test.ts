import { describe, expect, it } from 'vitest'
import { budgetStatus, byNewest, spentByCategory, summarize } from '@/features/budget/summary'
import type { Entry } from '@/lib/schemas'

let seq = 0
function entry(fields: Partial<Entry>): Entry {
  seq += 1
  return {
    id: `e${seq}`,
    createdAt: `2026-10-01T00:00:${String(seq).padStart(2, '0')}.000Z`,
    updatedAt: '2026-10-01T00:00:00.000Z',
    type: 'expense',
    amount: 100,
    categoryId: 'food',
    date: '2026-10-01',
    ...fields,
  }
}

describe('summarize', () => {
  it('totals income and spending in centavos', () => {
    const entries = [
      entry({ type: 'income', amount: 2_500_000 }),
      entry({ amount: 125_050 }),
      entry({ amount: 4_950 }),
    ]
    expect(summarize(entries)).toEqual({ income: 2_500_000, spent: 130_000, left: 2_370_000 })
  })

  it('goes negative when spending exceeds income', () => {
    expect(summarize([entry({ amount: 500 })])).toEqual({ income: 0, spent: 500, left: -500 })
  })

  it('is zero for an empty month', () => {
    expect(summarize([])).toEqual({ income: 0, spent: 0, left: 0 })
  })
})

describe('spentByCategory', () => {
  it('sums expenses per category and ignores income', () => {
    const spent = spentByCategory([
      entry({ categoryId: 'food', amount: 100 }),
      entry({ categoryId: 'food', amount: 250 }),
      entry({ categoryId: 'rent', amount: 1000 }),
      entry({ categoryId: 'salary', type: 'income', amount: 9999 }),
    ])
    expect(Object.fromEntries(spent)).toEqual({ food: 350, rent: 1000 })
  })
})

describe('budgetStatus', () => {
  it.each([
    [0, 'ok'],
    [7_999, 'ok'],
    [8_000, 'near'],
    [9_999, 'near'],
    [10_000, 'over'],
    [12_000, 'over'],
  ] as const)('%i of 10000 is %s', (spent, status) => {
    expect(budgetStatus(spent, 10_000)).toBe(status)
  })
})

describe('byNewest', () => {
  it('sorts by date, then creation time, newest first', () => {
    const older = entry({ date: '2026-10-01' })
    const sameDayFirst = entry({ date: '2026-10-05' })
    const sameDaySecond = entry({ date: '2026-10-05' })
    const ids = [older, sameDayFirst, sameDaySecond].sort(byNewest).map((e) => e.id)
    expect(ids).toEqual([sameDaySecond.id, sameDayFirst.id, older.id])
  })
})
