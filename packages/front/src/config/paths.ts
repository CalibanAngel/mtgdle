export const paths = {
  home: {
    path: '/',
    getHref: () => '/',
  },

  app: {
    root: {
      path: '/app',
      getHref: () => '/app',
    },
    dashboard: {
      path: '',
      getHref: () => '/app',
    },
    health: {
      path: 'health',
      label: 'Health',
      getHref: () => '/app/health',
    },
    sets: {
      path: 'sets',
      label: 'Sets',
      getHref: () => `/app/sets`,
    },
  },
} as const;
