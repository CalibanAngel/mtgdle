import { HeroUIProvider } from '@heroui/system';
import { useHref } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, useState } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from 'react-error-boundary';
import { Spinner } from '@heroui/spinner';
import { HelmetProvider } from 'react-helmet-async';

import { queryConfig } from '@/config/react-query.ts';
import { MainErrorFallback } from '@/components/errors/main.tsx';

type AppProviderProps = {
  children: React.ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: queryConfig,
      }),
  );

  const fallback = (
    <div className="flex h-screen w-screen items-center justify-center">
      <Spinner size={'lg'} />
    </div>
  );

  return (
    <Suspense fallback={fallback}>
      <HeroUIProvider useHref={useHref}>
        <ErrorBoundary FallbackComponent={MainErrorFallback}>
          <HelmetProvider>
            <QueryClientProvider client={queryClient}>
              <ReactQueryDevtools />
              {children}
            </QueryClientProvider>
          </HelmetProvider>
        </ErrorBoundary>
      </HeroUIProvider>
    </Suspense>
  );
}
