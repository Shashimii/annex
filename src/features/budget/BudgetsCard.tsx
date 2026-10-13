import { PiggyBank } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { activeCategories } from '@/features/budget/categories'
import { budgetStatus, spentByCategory, type BudgetStatus } from '@/features/budget/summary'
import { formatAmount } from '@/lib/money'
import type { Category, Entry } from '@/lib/schemas'
import { cn } from '@/lib/utils'

type Props = { entries: Entry[]; categories: Category[] }

const indicatorColor: Record<BudgetStatus, string> = {
  ok: '',
  near: '*:data-[slot=progress-indicator]:bg-amber-500',
  over: '*:data-[slot=progress-indicator]:bg-destructive',
}

const textColor: Record<BudgetStatus, string> = {
  ok: 'text-muted-foreground',
  near: 'text-amber-600 dark:text-amber-400',
  over: 'text-destructive',
}

export function BudgetsCard({ entries, categories }: Props) {
  const spent = spentByCategory(entries)
  const budgets = activeCategories(categories, 'expense').filter((category) => category.monthlyLimit)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budgets</CardTitle>
        <CardDescription>Monthly limits per category</CardDescription>
        {budgets.length > 0 && (
          <CardAction>
            <Button asChild variant="ghost" size="sm">
              <Link to="/settings">Edit</Link>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {budgets.length === 0 ? (
          <EmptyState icon={PiggyBank} title="No limits set">
            <p>Give an expense category a monthly limit to track it here.</p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link to="/settings">Set limits</Link>
            </Button>
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-4">
            {budgets.map((category) => (
              <BudgetRow key={category.id} name={category.name} spent={spent.get(category.id) ?? 0} limit={category.monthlyLimit!} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function BudgetRow({ name, spent, limit }: { name: string; spent: number; limit: number }) {
  const status = budgetStatus(spent, limit)
  const label =
    status === 'over'
      ? spent > limit
        ? `Over by ${formatAmount(spent - limit)}`
        : 'Limit reached'
      : `${status === 'near' ? 'Near limit · ' : ''}${formatAmount(limit - spent)} left`

  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate font-medium">{name}</span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {formatAmount(spent)} of {formatAmount(limit)}
        </span>
      </div>
      <Progress
        value={Math.min(100, (spent / limit) * 100)}
        className={indicatorColor[status]}
        aria-label={`${name}: ${formatAmount(spent)} of ${formatAmount(limit)} spent`}
      />
      <p className={cn('text-xs', textColor[status])}>{label}</p>
    </li>
  )
}
