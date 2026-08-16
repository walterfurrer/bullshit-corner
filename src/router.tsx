import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import {
  getContext,
} from './integrations/tanstack-query/rootProvider'

export function getRouter() {
  const context = getContext()

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: ({ error }) => {
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 p-4">
          <p className="text-destructive font-medium">Something went wrong</p>
          <pre className="text-xs text-muted-foreground max-w-md overflow-auto">
            {error.message}
          </pre>
        </div>
      )
    },
  })

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
