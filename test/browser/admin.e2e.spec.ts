import { test as base, expect } from '@playwright/test';
import type {
  AdminJob,
  AdminSession,
  AdminStatistics,
  AdminTable,
} from '@mtgdle/shared-types';

const table: AdminTable = {
  name: 'classic_catalogue',
  label: 'Catalogue Classic',
  count: 45,
  columns: [
    { name: 'id', type: 'uuid', primary: true, nullable: false },
    { name: 'data', type: 'jsonb', primary: false, nullable: false },
  ],
};
const stats: AdminStatistics = {
  since: '2026-11-01',
  until: '2026-11-26',
  days: [
    {
      day: '2026-11-26',
      sessions: 10,
      players: 7,
      won: 4,
      abandoned: 2,
      guesses: 40,
      winningGuesses: 12,
      reduceHints: 2,
      artHints: 1,
      textHints: 0,
    },
  ],
  distribution: [{ guesses: 3, count: 4 }],
};
interface State {
  authenticated: boolean;
  jobs: AdminJob[];
  mutations: object[];
  pages: string[];
  expired: boolean;
}
const test = base.extend<{ server: State }>({
  server: async ({ context }, use) => {
    const state: State = {
      authenticated: false,
      jobs: [],
      mutations: [],
      pages: [],
      expired: false,
    };
    await context.route('**/api/admin/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname.slice('/api/admin/'.length);
      const session = (): AdminSession => ({
        configured: true,
        authenticated: state.authenticated,
        username: state.authenticated ? 'admin' : null,
        expiresAt: state.authenticated ? '2099-01-01T00:00:00Z' : null,
      });
      if (path === 'auth/session') return route.fulfill({ json: session() });
      if (path === 'auth/login') {
        if (request.postDataJSON().password !== 'test-password-only')
          return route.fulfill({
            status: 401,
            json: { message: 'Identifiants incorrects.' },
          });
        state.authenticated = true;
        return route.fulfill({ json: session() });
      }
      if (path === 'auth/logout') {
        state.authenticated = false;
        return route.fulfill({ status: 204 });
      }
      if (!state.authenticated || state.expired)
        return route.fulfill({
          status: 401,
          json: { message: 'Session expirée.' },
        });
      if (path === 'health')
        return route.fulfill({
          json: {
            database: 'up',
            scryfall: 'down',
            checkedAt: new Date().toISOString(),
          },
        });
      if (path === 'statistics') return route.fulfill({ json: stats });
      if (path === 'database')
        return route.fulfill({
          json: [table, { ...table, name: 'card', label: 'Cartes' }],
        });
      if (path.endsWith('/rows')) {
        state.pages.push(url.pathname + url.search);
        const page = Number(url.searchParams.get('page') || 1);
        const q = url.searchParams.get('q');
        return route.fulfill({
          json: {
            table: table.name,
            total: q ? 1 : 45,
            page,
            pageSize: 20,
            columns: table.columns,
            rows: [
              {
                id: `00000000-0000-4000-8000-${String(page).padStart(12, '0')}`,
                data: q ? `Résultat ${q}` : `Carte page ${page}`,
              },
            ],
          },
        });
      }
      if (path.endsWith('/row'))
        return route.fulfill({
          json: {
            data: {
              id: 'row-id',
              data: {
                name: 'Path to Exile',
                oracleText: 'Complete administrative detail',
              },
            },
          },
        });
      if (path === 'jobs' && request.method() === 'POST') {
        state.mutations.push(request.postDataJSON());
        const job: AdminJob = {
          id: 'job-1',
          operation: request.postDataJSON().operation,
          status: 'running',
          startedAt: '2026-11-26T12:00:00Z',
          finishedAt: null,
          result: null,
          error: null,
        };
        state.jobs.unshift(job);
        return route.fulfill({ status: 201, json: job });
      }
      if (path === 'jobs') return route.fulfill({ json: state.jobs });
      return route.fulfill({ status: 404, json: {} });
    });
    await use(state);
  },
});
async function login(page: import('@playwright/test').Page) {
  await page.goto('/admin');
  await page
    .getByLabel('Mot de passe', { exact: true })
    .fill('test-password-only');
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Vue d’ensemble', exact: true }),
  ).toBeVisible();
}
test.beforeEach(async ({ server }) => {
  expect(server.authenticated).toBe(false);
});
test('should keep the portal private when the visitor has no administrator session', async ({
  page,
  server,
}) => {
  await page.goto('/admin');
  await expect(
    page.getByRole('heading', { name: 'Bienvenue dans les coulisses.' }),
  ).toBeVisible();
  await expect(
    page.getByText('Cumul des participations quotidiennes'),
  ).toHaveCount(0);
  expect(server.mutations).toHaveLength(0);
  await page.getByLabel('Mot de passe', { exact: true }).fill('incorrect');
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Identifiants incorrects.');
});
test('should show activity and service health when the administrator signs in', async ({
  page,
}) => {
  await login(page);
  await expect(page.getByText('Opérationnel', { exact: true })).toBeVisible();
  await expect(page.getByText('Indisponible', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Joueurs ayant proposé' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Statistiques', exact: true }).click();
  await page.getByLabel('Période', { exact: true }).selectOption('7');
  await expect(
    page.getByRole('heading', { name: 'Détail quotidien' }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    ),
  ).not.toContain('test-password-only');
});
test('should search paginate and inspect rows when the read-only explorer is opened', async ({
  page,
  server,
}) => {
  await login(page);
  await page
    .getByRole('button', { name: 'Base de données', exact: true })
    .click();
  await expect(page.getByText('Carte page 1', { exact: true })).toBeVisible();
  const picker = page.getByRole('combobox', { name: 'Table', exact: true });
  if (await picker.isVisible()) await picker.selectOption('card');
  else await page.getByRole('button', { name: /^Cartes card/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Cartes', exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      server.pages.some((query) => query.includes('/database/card/rows')),
    )
    .toBe(true);
  if (await picker.isVisible()) await picker.selectOption('classic_catalogue');
  else await page.getByRole('button', { name: /^Catalogue Classic/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Catalogue Classic', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Suivant', exact: true }).click();
  await expect(page.getByText('Carte page 2', { exact: true })).toBeVisible();
  await page.getByLabel('Recherche', { exact: true }).fill('Path');
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click();
  await expect(page.getByText('Résultat Path', { exact: true })).toBeVisible();
  expect(
    server.pages.some(
      (query) => query.includes('page=1') && query.includes('q=Path'),
    ),
  ).toBe(true);
  await page
    .getByRole('button', { name: 'Ouvrir la ligne 1', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toContainText(
    'Complete administrative detail',
  );
  await page.getByRole('button', { name: 'Fermer', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(server.mutations).toHaveLength(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
});
test('should confirm and track a mutation when the administrator starts an operation', async ({
  page,
  server,
}) => {
  await login(page);
  await page.getByRole('button', { name: 'Opérations', exact: true }).click();
  await page.getByRole('button', { name: 'Préparer', exact: true }).click();
  await page.getByRole('button', { name: 'Annuler', exact: true }).click();
  expect(server.mutations).toHaveLength(0);
  await page.getByRole('button', { name: 'Préparer', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmer', exact: true }).click();
  await expect(page.getByText('En cours', { exact: true })).toBeVisible();
  expect(server.mutations).toEqual([{ operation: 'catalogue:prepare' }]);
  await expect(
    page.getByRole('button', { name: 'Préparer', exact: true }),
  ).toBeDisabled();
  server.jobs[0].status = 'succeeded';
  server.jobs[0].result = 'cards: 474';
  await expect(page.getByText('Terminé', { exact: true })).toBeVisible();
  await expect(page.getByText('cards: 474', { exact: true })).toBeVisible();
});
test('should clear the private view when the administrator logs out or a session expires', async ({
  page,
  server,
}) => {
  await login(page);
  await page
    .getByRole('button', { name: 'Se déconnecter', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Bienvenue dans les coulisses.' }),
  ).toBeVisible();
  await login(page);
  server.expired = true;
  await page
    .getByRole('button', { name: 'Base de données', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Bienvenue dans les coulisses.' }),
  ).toBeVisible();
});
