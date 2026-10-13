import type { Entry } from '@/lib/schemas'

// Pure money math over a month's active (non-deleted) entries. All values are centavos.

export type Summary = { income: number; spent: number; left: number }

export function summarize(entries: Entry[]): Summary {
  let income = 0
  let spent = 0
  for (const entry of entries) {
    if (entry.type === 'income') income += entry.amount
    else spent += entry.amount
  }
  return { income, spent, left: income - spent }
}

export function spentByCategory(entries: Entry[]): Map<string, number> {
  const spent = new Map<string, number>()
  for (const entry of entries) {
    if (entry.type === 'expense') spent.set(entry.categoryId, (spent.get(entry.categoryId) ?? 0) + entry.amount)
  }
  return spent
}

export type BudgetStatus = 'ok' | 'near' | 'over'

/** Near from 80% of the limit, over from 100%. */
export function budgetStatus(spent: number, limit: number): BudgetStatus {
  if (spent >= limit) return 'over'
  if (spent * 5 >= limit * 4) return 'near'
  return 'ok'
}

/** Newest first: by date, then by when the entry was created. */
export function byNewest(a: Entry, b: Entry): number {
  return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
}
