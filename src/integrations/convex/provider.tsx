import { ConvexProvider } from 'convex/react'

import type { ConvexReactClient } from 'convex/react'

export default function AppConvexProvider({
  client,
  children,
}: {
  client: ConvexReactClient
  children: React.ReactNode
}) {
  return <ConvexProvider client={client}>{children}</ConvexProvider>
}
