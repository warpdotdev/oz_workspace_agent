import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { KanbanBoard } from '@/components/tasks'
import { Button } from '@/components/ui/button'
import { Plus, Filter } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Tasks | AI Agent Manager',
  description: 'Manage your tasks with a Kanban board',
}

export default async function TasksPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold">
              AI Agent Manager
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/agents">
                <Button variant="ghost" size="sm">
                  Agents
                </Button>
              </Link>
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="bg-accent">
                  Tasks
                </Button>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>
      </header>

      {/* Page title */}
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold">Task Board</h1>
        <p className="text-muted-foreground">
          Drag and drop tasks to change their status
        </p>
      </div>

      {/* Kanban board */}
      <main className="flex-1 overflow-hidden bg-muted/40">
        <KanbanBoard />
      </main>
    </div>
  )
}
