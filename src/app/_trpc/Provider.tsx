'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import React, { useState } from 'react'

import { trpc } from './client'

export default function Provider({ children }: { children: React.ReactNode }) {
  // Create a Tanstack Query client
  const [queryClient] = useState(() => new QueryClient({}))
  // Create a tRPC client
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: process.env.NODE_ENV === 'production' 
            ? 'https://cucina-capitale.heyaylabs.com/api/trpc'
            : 'http://localhost:3000/api/trpc',
        }),
      ],
    }),
  )
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
} 