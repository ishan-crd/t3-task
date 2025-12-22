"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/utils/trpc";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
        }),
      ],
    }),
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </api.Provider>
  );
}


