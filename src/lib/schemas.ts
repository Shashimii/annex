import { z } from 'zod'
import { isValidDate } from '@/lib/dates'
import { MAX_CENTAVOS } from '@/lib/money'

const timestamp = z.iso.datetime()
const localDate = z.string().refine(isValidDate, 'Pick a valid date')
const centavos = z.number().int().positive().max(MAX_CENTAVOS)
const entryType = z.enum(['income', 'expense'])

export const baseSchema = z.object({
  id: z.string().min(1),
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp.optional(),
})

export const entryFieldsSchema = z.object({
  type: entryType,
  amount: centavos,
  categoryId: z.string().min(1, 'Pick a category'),
  date: localDate,
  note: z.string().trim().max(80, 'Keep the note to 80 characters').optional(),
})

export const entrySchema = baseSchema.extend(entryFieldsSchema.shape)

export const categoryFieldsSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(40, 'Keep the name to 40 characters'),
  kind: entryType,
  monthlyLimit: centavos.optional(),
  order: z.number().int(),
})

export const categorySchema = baseSchema
  .extend(categoryFieldsSchema.shape)
  .refine((category) => category.kind === 'expense' || category.monthlyLimit === undefined, {
    error: 'Only expense categories have a monthly limit',
    path: ['monthlyLimit'],
  })

export type Base = z.infer<typeof baseSchema>
export type EntryType = z.infer<typeof entryType>
export type EntryFields = z.infer<typeof entryFieldsSchema>
export type Entry = z.infer<typeof entrySchema>
export type CategoryFields = z.infer<typeof categoryFieldsSchema>
export type Category = z.infer<typeof categorySchema>
