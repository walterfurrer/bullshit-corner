import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Bullshit Corner
      </h1>
    </main>
  )
}
