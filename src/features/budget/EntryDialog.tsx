import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { activeCategories } from '@/features/budget/categories'
import { validateEntryForm, type EntryFormErrors, type EntryFormValues } from '@/features/budget/forms'
import { useCategories, useEntry } from '@/features/budget/hooks'
import { addEntry, updateEntry } from '@/features/budget/repo'
import { deleteEntryWithUndo } from '@/features/budget/undo'
import { monthKey, todayLocal, type MonthKey } from '@/lib/dates'
import { toAmountInput } from '@/lib/money'
import type { Category, Entry, EntryType } from '@/lib/schemas'
import { useUiStore } from '@/store/ui'

export function EntryDialog() {
  const { open, entryId } = useUiStore((state) => state.entryDialog)
  const close = useUiStore((state) => state.closeEntryDialog)
  const entry = useEntry(entryId)
  const categories = useCategories()
  const ready = categories && (!entryId || entry)

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entryId ? 'Edit entry' : 'New entry'}</DialogTitle>
          <DialogDescription className="sr-only">Amounts are in Philippine pesos.</DialogDescription>
        </DialogHeader>
        {ready && <EntryForm key={entryId ?? 'new'} entry={entry} categories={categories} onDone={close} />}
      </DialogContent>
    </Dialog>
  )
}

type FormProps = { entry: Entry | undefined; categories: Category[]; onDone: () => void }

function EntryForm({ entry, categories, onDone }: FormProps) {
  const month = useUiStore((state) => state.month)
  const setMonth = useUiStore((state) => state.setMonth)
  const [values, setValues] = useState(() => initialValues(entry, categories, month))
  const [errors, setErrors] = useState<EntryFormErrors & { form?: string }>({})
  const [saving, setSaving] = useState(false)

  const options = categoryOptions(categories, values.type, entry?.categoryId)

  function set<K extends keyof EntryFormValues>(key: K, value: EntryFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function changeType(type: EntryType) {
    setValues((current) => {
      const keepsCategory = categories.find((category) => category.id === current.categoryId)?.kind === type
      return { ...current, type, categoryId: keepsCategory ? current.categoryId : (activeCategories(categories, type)[0]?.id ?? '') }
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validateEntryForm(values)
    if (!result.success) {
      setErrors(result.errors)
      return
    }

    setSaving(true)
    try {
      if (entry) await updateEntry(entry.id, result.data)
      else await addEntry(result.data)
      // Jump to the entry's month so it doesn't seem to vanish when dated elsewhere.
      setMonth(result.data.date.slice(0, 7))
      onDone()
    } catch {
      setErrors({ form: "Couldn't save this entry. Try again." })
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!entry) return
    await deleteEntryWithUndo(entry.id)
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <ToggleGroup
          type="single"
          variant="outline"
          value={values.type}
          onValueChange={(type) => type && changeType(type as EntryType)}
          className="w-full"
          aria-label="Entry type"
        >
          <ToggleGroupItem value="expense" className="flex-1">
            Expense
          </ToggleGroupItem>
          <ToggleGroupItem value="income" className="flex-1">
            Income
          </ToggleGroupItem>
        </ToggleGroup>

        <Field data-invalid={!!errors.amount}>
          <FieldLabel htmlFor="entry-amount">Amount</FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground">₱</span>
            <Input
              id="entry-amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              className="pl-6 tabular-nums"
              value={values.amount}
              onChange={(event) => set('amount', event.target.value)}
              aria-invalid={!!errors.amount}
              autoFocus={!entry}
            />
          </div>
          <FieldError>{errors.amount}</FieldError>
        </Field>

        <Field data-invalid={!!errors.categoryId}>
          <FieldLabel htmlFor="entry-category">Category</FieldLabel>
          <Select value={values.categoryId} onValueChange={(categoryId) => set('categoryId', categoryId)}>
            <SelectTrigger id="entry-category" className="w-full" aria-invalid={!!errors.categoryId}>
              <SelectValue placeholder="Pick a category" />
            </SelectTrigger>
            <SelectContent>
              {options.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                  {category.deletedAt && ' (deleted)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {options.length === 0 && (
            <FieldDescription>
              No {values.type} categories yet. <Link to="/settings" onClick={onDone}>Add one in Settings</Link>.
            </FieldDescription>
          )}
          <FieldError>{errors.categoryId}</FieldError>
        </Field>

        <Field data-invalid={!!errors.date}>
          <FieldLabel htmlFor="entry-date">Date</FieldLabel>
          <Input
            id="entry-date"
            type="date"
            value={values.date}
            onChange={(event) => set('date', event.target.value)}
            aria-invalid={!!errors.date}
          />
          <FieldError>{errors.date}</FieldError>
        </Field>

        <Field data-invalid={!!errors.note}>
          <FieldLabel htmlFor="entry-note">Note</FieldLabel>
          <Input
            id="entry-note"
            maxLength={80}
            placeholder="Optional"
            value={values.note}
            onChange={(event) => set('note', event.target.value)}
            aria-invalid={!!errors.note}
          />
          <FieldDescription className="text-right tabular-nums">{values.note.length}/80</FieldDescription>
          <FieldError>{errors.note}</FieldError>
        </Field>

        {errors.form && <FieldError>{errors.form}</FieldError>}
      </FieldGroup>

      <DialogFooter className="mt-6">
        {entry && (
          <Button type="button" variant="destructive" className="sm:mr-auto" onClick={() => void handleDelete()}>
            Delete
          </Button>
        )}
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={saving}>
          {entry ? 'Save' : 'Add entry'}
        </Button>
      </DialogFooter>
    </form>
  )
}

function initialValues(entry: Entry | undefined, categories: Category[], month: MonthKey): EntryFormValues {
  if (entry) {
    return { type: entry.type, amount: toAmountInput(entry.amount), categoryId: entry.categoryId, date: entry.date, note: entry.note ?? '' }
  }
  return {
    type: 'expense',
    amount: '',
    categoryId: activeCategories(categories, 'expense')[0]?.id ?? '',
    // Today when viewing this month; otherwise the 1st of the month being viewed.
    date: month === monthKey() ? todayLocal() : `${month}-01`,
    note: '',
  }
}

/** Active categories of the type, plus the entry's current category if it has since been deleted. */
function categoryOptions(categories: Category[], type: EntryType, currentId: string | undefined): Category[] {
  const options = activeCategories(categories, type)
  const current = categories.find((category) => category.id === currentId)
  return current?.deletedAt && current.kind === type ? [...options, current] : options
}
