import { Plus, ReceiptText, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { byNewest } from '@/features/budget/summary'
import { deleteEntryWithUndo } from '@/features/budget/undo'
import { formatDay } from '@/lib/dates'
import { formatAmount } from '@/lib/money'
import type { Category, Entry } from '@/lib/schemas'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

type Props = { entries: Entry[] | undefined; categories: Category[] }

export function EntriesCard({ entries, categories }: Props) {
  const openNewEntry = useUiStore((state) => state.openNewEntry)
  const names = new Map(categories.map((category) => [category.id, category.name]))
  const days = groupByDay([...(entries ?? [])].sort(byNewest))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entries</CardTitle>
        <CardDescription>Newest first</CardDescription>
        <CardAction>
          <Button size="sm" onClick={openNewEntry}>
            <Plus data-icon="inline-start" />
            Add
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {entries && days.length === 0 && (
          <EmptyState icon={ReceiptText} title="No entries this month">
            Income and expenses you log will show up here.
          </EmptyState>
        )}
        <div className="flex flex-col gap-4">
          {days.map(([date, dayEntries]) => (
            <section key={date} aria-label={formatDay(date)}>
              <h3 className="mb-1 text-xs font-medium text-muted-foreground">{formatDay(date)}</h3>
              <ul className="-mx-2 flex flex-col">
                {dayEntries.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} categoryName={names.get(entry.categoryId) ?? 'Unknown category'} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function EntryRow({ entry, categoryName }: { entry: Entry; categoryName: string }) {
  const openEditEntry = useUiStore((state) => state.openEditEntry)
  const isIncome = entry.type === 'income'

  return (
    <li className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => openEditEntry(entry.id)}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{categoryName}</span>
          {entry.note && <span className="block truncate text-xs text-muted-foreground">{entry.note}</span>}
        </span>
        <span className={cn('shrink-0 text-sm font-medium tabular-nums', isIncome && 'text-emerald-600 dark:text-emerald-400')}>
          {isIncome ? '+' : '−'}
          {formatAmount(entry.amount)}
        </span>
      </button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground"
        aria-label={`Delete ${categoryName} entry of ${formatAmount(entry.amount)}`}
        onClick={() => void deleteEntryWithUndo(entry.id)}
      >
        <Trash2 />
      </Button>
    </li>
  )
}

/** Groups already-sorted entries into [date, entries] pairs, keeping order. */
function groupByDay(entries: Entry[]): [string, Entry[]][] {
  const days = new Map<string, Entry[]>()
  for (const entry of entries) days.set(entry.date, [...(days.get(entry.date) ?? []), entry])
  return [...days]
}
