import { parseAmount } from '@/lib/money'
import { categoryFieldsSchema, entryFieldsSchema, type Category, type EntryFields, type EntryType } from '@/lib/schemas'
import type { CategoryInput } from '@/features/budget/repo'

type Result<T, K extends string> = { success: true; data: T } | { success: false; errors: Partial<Record<K, string>> }

export type EntryFormValues = {
  type: EntryType
  amount: string
  categoryId: string
  date: string
  note: string
}

export type EntryFormErrors = Partial<Record<keyof EntryFormValues, string>>

const AMOUNT_ERROR = 'Enter an amount above ₱0 with up to 2 decimals'

export function validateEntryForm(values: EntryFormValues): Result<EntryFields, keyof EntryFormValues> {
  const amount = parseAmount(values.amount)
  const result = entryFieldsSchema.safeParse({
    ...values,
    amount: amount ?? 0,
    note: values.note.trim() || undefined,
  })

  const errors: EntryFormErrors = {}
  if (amount === null) errors.amount = AMOUNT_ERROR
  for (const issue of result.error?.issues ?? []) {
    const field = issue.path[0] as keyof EntryFormValues
    if (field !== 'amount') errors[field] ??= issue.message
  }

  return result.success && amount !== null ? { success: true, data: result.data } : { success: false, errors }
}

export type CategoryFormValues = { name: string; limit: string }

/** `siblings` are the other active categories of the same kind, used to reject duplicate names. */
export function validateCategoryForm(
  values: CategoryFormValues,
  kind: EntryType,
  siblings: Category[],
): Result<CategoryInput, keyof CategoryFormValues> {
  const errors: Partial<Record<keyof CategoryFormValues, string>> = {}

  const name = categoryFieldsSchema.shape.name.safeParse(values.name)
  if (!name.success) errors.name = name.error.issues[0].message
  else if (siblings.some((sibling) => sibling.name.toLowerCase() === name.data.toLowerCase())) {
    errors.name = `There's already a category called ${name.data}`
  }

  let monthlyLimit: number | undefined
  if (kind === 'expense' && values.limit.trim() !== '') {
    monthlyLimit = parseAmount(values.limit) ?? undefined
    if (monthlyLimit === undefined) errors.limit = 'Enter a limit above ₱0, or leave it empty'
  }

  return name.success && Object.keys(errors).length === 0
    ? { success: true, data: { name: name.data, monthlyLimit } }
    : { success: false, errors }
}
