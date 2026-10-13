import { CheckSquare, Settings, Wallet } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Budget', icon: Wallet, end: true },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

export function AppLayout() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col px-4">
      <header className="flex items-center justify-between gap-4 py-4">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            A
          </span>
          <span className="text-lg font-semibold tracking-tight">Annex</span>
        </NavLink>
        <Badge variant="outline" title="Data is saved on this device. Google Drive sync comes later.">
          This device only
        </Badge>
      </header>

      <nav aria-label="Main" className="flex gap-1 border-b pb-2">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                isActive && 'bg-muted text-foreground',
              )
            }
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 py-6">
        <Outlet />
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground">Built by Shashimii</footer>
    </div>
  )
}
