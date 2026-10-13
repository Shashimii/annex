import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { summarize } from '@/features/budget/summary'
import { formatAmount } from '@/lib/money'
import type { Entry } from '@/lib/schemas'
import { cn } from '@/lib/utils'

export function SummaryCards({ entries }: { entries: Entry[] }) {
  const { income, spent, left } = summarize(entries)
  const items = [
    { label: 'Income', amount: income },
    { label: 'Spent', amount: spent },
    { label: 'Left', amount: left },
  ]

  return (
    <section aria-label="Summary" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map(({ label, amount }) => (
        <Card key={label} size="sm" className="last:col-span-2 sm:last:col-span-1">
          <CardHeader>
            <CardDescription>{label}</CardDescription>
            <CardTitle className={cn('text-lg tabular-nums sm:text-xl', amount < 0 && 'text-destructive')}>
              {formatAmount(amount)}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </section>
  )
}
