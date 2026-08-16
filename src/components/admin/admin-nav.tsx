import { Link } from '@tanstack/react-router'

const adminTabs = [
  { to: '/admin/leaderboard', label: 'Leaderboard' },
  { to: '/admin/submissions', label: 'Submissions' },
] as const

export function AdminNav() {
  return (
    <nav aria-label="Admin navigation" className="mb-6">
      <ul className="flex gap-1 border-b border-border">
        {adminTabs.map(({ to, label }) => (
          <li key={to}>
            <Link
              to={to}
              className="inline-block px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground border-b-2 border-transparent -mb-px"
              activeProps={{
                className:
                  'inline-block px-4 py-2 text-sm font-medium text-foreground border-b-2 border-primary -mb-px',
              }}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
