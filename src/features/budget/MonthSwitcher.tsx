import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatMonth, monthKey, shiftMonth } from '@/lib/dates'
import { useUiStore } from '@/store/ui'

export function MonthSwitcher() {
  const month = useUiStore((state) => state.month)
  const setMonth = useUiStore((state) => state.setMonth)
  const thisMonth = monthKey()

  return (
    <div className="flex items-center justify-between gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">{formatMonth(month)}</h1>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}>
          <ChevronLeft />
        </Button>
        <Button variant="outline" onClick={() => setMonth(thisMonth)} disabled={month === thisMonth}>
          Today
        </Button>
        <Button variant="outline" size="icon" aria-label="Next month" onClick={() => setMonth(shiftMonth(month, 1))}>
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
