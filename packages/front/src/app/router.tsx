import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { paths } from '@/config/paths.ts';
import AppRoot from '@/app/routes/root.tsx';

const convert = (queryClient: QueryClient) => (m: any) => {
  const { clientLoader, clientAction, default: Component, ...rest } = m;

  return {
    ...rest,
    loader: clientLoader?.(queryClient),
    action: clientAction?.(queryClient),
    Component,
  };
};

export const createAppRouter = (queryClient: QueryClient) =>
  createBrowserRouter([
    {
      path: paths.home.path,
      lazy: () => import('./routes/landing').then(convert(queryClient)),
    },
    {
      path: paths.app.root.path,
      element: <AppRoot />,
      children: [
        {
          path: paths.app.health.path,
          lazy: () => import('./routes/app/health').then(convert(queryClient)),
        },
        {
          path: paths.app.sets.path,
          lazy: () => import('./routes/app/sets').then(convert(queryClient)),
        },
      ],
    },
    {
      path: '*',
      lazy: () => import('./routes/not-found').then(convert(queryClient)),
    },
  ]);

export const AppRouter = () => {
  const queryClient = useQueryClient();

  const router = useMemo(() => createAppRouter(queryClient), [queryClient]);

  return <RouterProvider router={router} />;
};
