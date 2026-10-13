import { BudgetsCard } from '@/features/budget/BudgetsCard'
import { EntriesCard } from '@/features/budget/EntriesCard'
import { EntryDialog } from '@/features/budget/EntryDialog'
import { useCategories, useMonthEntries } from '@/features/budget/hooks'
import { MonthSwitcher } from '@/features/budget/MonthSwitcher'
import { SummaryCards } from '@/features/budget/SummaryCards'
import { useUiStore } from '@/store/ui'

export function BudgetPage() {
  const month = useUiStore((state) => state.month)
  const entries = useMonthEntries(month)
  const categories = useCategories()

  return (
    <div className="flex flex-col gap-6">
      <MonthSwitcher />
      <SummaryCards entries={entries ?? []} />
      <div className="grid items-start gap-4 md:grid-cols-2">
        <EntriesCard entries={entries} categories={categories ?? []} />
        <BudgetsCard entries={entries ?? []} categories={categories ?? []} />
      </div>
      <EntryDialog />
    </div>
  )
}
