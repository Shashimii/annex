import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function TasksPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming in v1.1</CardTitle>
          <CardDescription>Tasks with lists and status, followed by a Pomodoro timer that logs focus time per task.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
