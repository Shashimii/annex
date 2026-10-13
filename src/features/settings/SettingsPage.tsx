import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryManager } from '@/features/budget/CategoryManager'

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <CategoryManager />
      <Card>
        <CardHeader>
          <CardTitle>Google Drive sync</CardTitle>
          <CardDescription>Sign in with Google to keep your data in your own Drive across devices. Coming in v0.3.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
