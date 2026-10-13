import { useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { activeCategories } from '@/features/budget/categories'
import { validateCategoryForm, type CategoryFormValues } from '@/features/budget/forms'
import { useCategories } from '@/features/budget/hooks'
import { addCategory, moveCategory, updateCategory } from '@/features/budget/repo'
import { deleteCategoryWithUndo } from '@/features/budget/undo'
import { formatAmount, toAmountInput } from '@/lib/money'
import type { Category, EntryType } from '@/lib/schemas'

type DialogState = { open: boolean; kind: EntryType; category?: Category }

export function CategoryManager() {
  const categories = useCategories()
  const [dialog, setDialog] = useState<DialogState>({ open: false, kind: 'expense' })

  if (!categories) return null

  return (
    <>
      <CategorySection
        kind="expense"
        title="Expense categories"
        description="Set a monthly limit to track it on the Budget page."
        categories={activeCategories(categories, 'expense')}
        onAdd={() => setDialog({ open: true, kind: 'expense' })}
        onEdit={(category) => setDialog({ open: true, kind: 'expense', category })}
      />
      <CategorySection
        kind="income"
        title="Income categories"
        description="Where your money comes from."
        categories={activeCategories(categories, 'income')}
        onAdd={() => setDialog({ open: true, kind: 'income' })}
        onEdit={(category) => setDialog({ open: true, kind: 'income', category })}
      />
      <Dialog open={dialog.open} onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}>
        <DialogContent>
          <CategoryForm
            key={dialog.category?.id ?? `new-${dialog.kind}`}
            kind={dialog.kind}
            category={dialog.category}
            siblings={activeCategories(categories, dialog.kind).filter((sibling) => sibling.id !== dialog.category?.id)}
            onDone={() => setDialog((current) => ({ ...current, open: false }))}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

type SectionProps = {
  kind: EntryType
  title: string
  description: string
  categories: Category[]
  onAdd: () => void
  onEdit: (category: Category) => void
}

function CategorySection({ kind, title, description, categories, onAdd, onEdit }: SectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus data-icon="inline-start" />
            Add
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <EmptyState icon={Tags} title={`No ${kind} categories`} />
        ) : (
          <ul className="flex flex-col divide-y">
            {categories.map((category, index) => (
              <li key={category.id} className="flex items-center gap-1 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{category.name}</p>
                  {kind === 'expense' && (
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {category.monthlyLimit ? `${formatAmount(category.monthlyLimit)} a month` : 'No limit'}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move ${category.name} up`}
                  disabled={index === 0}
                  onClick={() => void moveCategory(category.id, -1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move ${category.name} down`}
                  disabled={index === categories.length - 1}
                  onClick={() => void moveCategory(category.id, 1)}
                >
                  <ArrowDown />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={`Edit ${category.name}`} onClick={() => onEdit(category)}>
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${category.name}`}
                  onClick={() => void deleteCategoryWithUndo(category.id, category.name)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

type FormProps = { kind: EntryType; category: Category | undefined; siblings: Category[]; onDone: () => void }

function CategoryForm({ kind, category, siblings, onDone }: FormProps) {
  const [values, setValues] = useState<CategoryFormValues>({
    name: category?.name ?? '',
    limit: category?.monthlyLimit ? toAmountInput(category.monthlyLimit) : '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryFormValues | 'form', string>>>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validateCategoryForm(values, kind, siblings)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    try {
      if (category) await updateCategory(category.id, result.data)
      else await addCategory(kind, result.data)
      onDone()
    } catch {
      setErrors({ form: "Couldn't save this category. Try again." })
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <DialogHeader className="mb-4">
        <DialogTitle>{category ? `Edit ${category.name}` : `New ${kind} category`}</DialogTitle>
        <DialogDescription className="sr-only">Name the category{kind === 'expense' && ' and optionally set a monthly limit'}.</DialogDescription>
      </DialogHeader>

      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="category-name">Name</FieldLabel>
          <Input
            id="category-name"
            maxLength={40}
            autoComplete="off"
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
            aria-invalid={!!errors.name}
            autoFocus
          />
          <FieldError>{errors.name}</FieldError>
        </Field>

        {kind === 'expense' && (
          <Field data-invalid={!!errors.limit}>
            <FieldLabel htmlFor="category-limit">Monthly limit</FieldLabel>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground">₱</span>
              <Input
                id="category-limit"
                inputMode="decimal"
                autoComplete="off"
                placeholder="No limit"
                className="pl-6 tabular-nums"
                value={values.limit}
                onChange={(event) => setValues({ ...values, limit: event.target.value })}
                aria-invalid={!!errors.limit}
              />
            </div>
            <FieldDescription>Leave empty for no limit.</FieldDescription>
            <FieldError>{errors.limit}</FieldError>
          </Field>
        )}

        {errors.form && <FieldError>{errors.form}</FieldError>}
      </FieldGroup>

      <DialogFooter className="mt-6">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit">{category ? 'Save' : 'Add category'}</Button>
      </DialogFooter>
    </form>
  )
}
