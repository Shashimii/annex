import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/app/AppLayout'
import { NotFoundPage } from '@/app/NotFoundPage'
import { BudgetPage } from '@/features/budget/BudgetPage'
import { TasksPage } from '@/features/focus/TasksPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <BudgetPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
