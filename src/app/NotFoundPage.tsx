import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">There's nothing at this address.</p>
      <Button asChild variant="outline">
        <Link to="/">Back to Budget</Link>
      </Button>
    </div>
  )
}
