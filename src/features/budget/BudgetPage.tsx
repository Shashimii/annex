import { useState } from 'react'
import { ChevronLeft, ChevronRight, PiggyBank, ReceiptText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMonth, monthKey, shiftMonth } from '@/lib/dates'
import { formatAmount } from '@/lib/money'

export function BudgetPage() {
  const [month, setMonth] = useState(monthKey)

  // Entries arrive with the local database in v0.2; until then every total is zero.
  const summary = [
    { label: 'Income', amount: 0 },
    { label: 'Spent', amount: 0 },
    { label: 'Left', amount: 0 },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{formatMonth(month)}</h1>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" onClick={() => setMonth(monthKey())} disabled={month === monthKey()}>
            Today
          </Button>
          <Button variant="outline" size="icon" aria-label="Next month" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      <section aria-label="Summary" className="grid grid-cols-3 gap-3">
        {summary.map(({ label, amount }) => (
          <Card key={label} size="sm">
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-lg tabular-nums sm:text-xl">{formatAmount(amount)}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Entries</CardTitle>
            <CardDescription>Newest first</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState icon={ReceiptText} title="No entries this month" body="Income and expenses you log will show up here." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budgets</CardTitle>
            <CardDescription>Monthly limits per category</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState icon={PiggyBank} title="No limits set" body="Set a limit on a category to track how close you are to it." />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, body }: { icon: typeof ReceiptText; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center">
      <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{body}</p>
    </div>
  )
}
