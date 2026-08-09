import { ClerkProvider, useAuth } from '@clerk/tanstack-react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { createServerFn } from '@tanstack/react-start'
import { ConvexProviderWithClerk } from 'convex/react-clerk'

import { SyncUser } from '../components/sync-user'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { ConvexQueryClient } from '@convex-dev/react-query'
import type { QueryClient } from '@tanstack/react-query'
import type { ConvexReactClient } from 'convex/react'

interface MyRouterContext {
  queryClient: QueryClient
  convexClient: ConvexReactClient
  convexQueryClient: ConvexQueryClient
}

const fetchClerkAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const { getToken, sessionClaims } = await auth()
  const token =
    sessionClaims?.aud === 'convex'
      ? await getToken()
      : await getToken({ template: 'convex' })

  return { token }
})

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Bullshit Corner',
      },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&display=swap',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Racing+Sans+One&display=swap',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  beforeLoad: async ({ context }) => {
    const serverHttpClient = context.convexQueryClient.serverHttpClient

    if (!serverHttpClient) {
      return
    }

    const { token } = await fetchClerkAuth()

    if (token) {
      serverHttpClient.setAuth(token)
    }
  },
  shellComponent: RootDocument,
  notFoundComponent: NotFoundPage,
})

function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <h1 className="font-sans text-6xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <Link to="/" className="text-primary underline underline-offset-4">
        Go home
      </Link>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const { convexClient } = Route.useRouteContext()

  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased wrap-anywhere selection:bg-primary/20">
        <ClerkProvider>
          <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
            <SyncUser />
            {children}
            <TanStackDevtools
              config={{
                position: 'bottom-right',
              }}
              plugins={[
                {
                  name: 'Tanstack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                },
                TanStackQueryDevtools,
              ]}
            />
          </ConvexProviderWithClerk>
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  )
}
