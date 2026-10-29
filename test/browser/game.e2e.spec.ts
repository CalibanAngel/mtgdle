import { test as base, expect } from '@playwright/test';
import type {
  ClassicCard,
  ClassicState,
} from '../../packages/shared-types/src/classic.interface';

const cards: ClassicCard[] = Array.from({ length: 24 }, (_, i) => ({
  id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
  name: i === 0 ? 'Path to Exile' : `Test Card ${i}`,
  image: null,
  identity: ['W'],
  mana: 1,
  types: ['Instant'],
  edition: 'Test',
  released: '2000-01-01',
  keywords: [],
  activated: false,
}));
const exact = {
  identity: 'exact',
  mana: 'exact',
  types: 'exact',
  edition: 'exact',
  period: 'exact',
  keywords: 'exact',
  activated: 'exact',
} as const;
interface Server {
  state: ClassicState;
  fail: boolean;
  requests: string[];
}
const test = base.extend<{ server: Server }>({
  server: async ({ context }, use) => {
    const server: Server = {
      state: {
        day: '2026-10-29',
        expiresAt: '2099-01-01T00:00:00Z',
        status: 'playing',
        guesses: [],
        choices: cards.map(({ id, name, image }) => ({ id, name, image })),
        hint: { available: false, used: false, removed: 0 },
      },
      fail: false,
      requests: [],
    };
    await context.route('**/*', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.pathname.startsWith('/classic/')) {
        if (request.method() === 'POST') {
          if (server.fail) {
            server.fail = false;
            return route.abort();
          }
          if (url.pathname.endsWith('/guesses')) {
            const body = request.postDataJSON() as {
              cardId: string;
              requestId: string;
            };
            server.requests.push(body.requestId);
            const card = cards.find((c) => c.id === body.cardId)!;
            server.state.guesses.push({
              card,
              requestId: body.requestId,
              matches: exact,
              won: card.id === cards[23].id,
            });
            server.state.choices = server.state.choices.filter(
              (c) => c.id !== card.id,
            );
            server.state.hint.available =
              server.state.guesses.length >= 10 && !server.state.hint.used;
            if (card.id === cards[23].id) {
              server.state.status = 'won';
              server.state.answer = card;
            }
          } else if (url.pathname.endsWith('/hint')) {
            const remove = Math.floor(server.state.choices.length / 2);
            server.state.choices = server.state.choices.slice(remove);
            server.state.hint = {
              available: false,
              used: true,
              removed: remove,
            };
          } else if (url.pathname.endsWith('/abandon')) {
            server.state.status = 'abandoned';
            server.state.answer = cards[23];
          }
        }
        return route.fulfill({ json: server.state });
      }
      if (
        url.origin === 'http://127.0.0.1:4173' &&
        !['xhr', 'fetch'].includes(request.resourceType())
      )
        return route.continue();
      return route.abort();
    });
    await use(server);
  },
});
test.beforeEach(async ({ server }) => {
  expect(server.state.guesses).toHaveLength(0);
});

async function select(
  page: import('@playwright/test').Page,
  name = 'Path to Exile',
) {
  await page.getByRole('combobox').fill(name);
  await page.getByRole('option', { name, exact: true }).click();
}

test('selection requires confirmation and removes a submitted card after reload', async ({
  page,
  server,
}) => {
  await page.goto('/');
  await select(page);
  expect(server.requests).toHaveLength(0);
  await page.getByRole('button', { name: 'Proposer' }).click();
  await expect(
    page.getByRole('rowheader', { name: 'Path to Exile' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('rowheader', { name: 'Path to Exile' }),
  ).toBeVisible();
  await page.getByRole('combobox').fill('Path');
  await expect(page.getByRole('option', { name: 'Path to Exile' })).toHaveCount(
    0,
  );
});

test('keyboard chooses a card, then confirmation submits it', async ({
  page,
  server,
}) => {
  await page.goto('/');
  const input = page.getByRole('combobox');
  await input.fill('Path');
  await expect(
    page.getByRole('option', { name: 'Path to Exile' }),
  ).toBeVisible();
  await input.press('Enter');
  expect(server.requests).toHaveLength(0);
  await page.getByRole('button', { name: 'Proposer' }).click();
  await expect(
    page.getByRole('rowheader', { name: 'Path to Exile' }),
  ).toBeVisible();
});

test('network failure allows retry without removing the choice', async ({
  page,
  server,
}) => {
  await page.goto('/');
  await select(page);
  server.fail = true;
  await page.getByRole('button', { name: 'Proposer' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Proposer' })).toBeEnabled();
  await page.getByRole('button', { name: 'Proposer' }).click();
  await expect(
    page.getByRole('rowheader', { name: 'Path to Exile' }),
  ).toBeVisible();
  expect(server.requests).toHaveLength(1);
});

test('hint unlocks after ten errors and survives reload', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Utiliser l’indice' }),
  ).toBeDisabled();
  for (let i = 0; i < 10; i++) {
    await select(page, cards[i].name);
    await page.getByRole('button', { name: 'Proposer' }).click();
    await expect(
      page.getByRole('rowheader', { name: cards[i].name, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole('button', { name: 'Utiliser l’indice' }).click();
  await expect(
    page.getByText('Indice utilisé : 7 cartes retirées.'),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText('Indice utilisé : 7 cartes retirées.'),
  ).toBeVisible();
});

test('victory reveals the answer and stops proposals', async ({ page }) => {
  await page.goto('/');
  await select(page, cards[23].name);
  await page.getByRole('button', { name: 'Proposer' }).click();
  await expect(page.getByText('BIEN JOUÉ !')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: cards[23].name }),
  ).toBeVisible();
  await expect(page.getByRole('combobox')).toHaveCount(0);
});

test('abandonment requires confirmation and persists', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Abandonner et révéler la carte' })
    .click();
  await expect(page.getByRole('combobox')).toBeVisible();
  await page.getByRole('button', { name: 'Confirmer l’abandon' }).click();
  await expect(page.getByText('LA CARTE DU JOUR')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('combobox')).toHaveCount(0);
});

test('failed initial load offers recovery', async ({ page }) => {
  await page.route('**/classic/today', (route) =>
    route.fulfill({ status: 503, json: { message: 'Unavailable' } }),
  );
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Impossible de charger');
  await expect(page.getByRole('button', { name: 'Réessayer' })).toBeVisible();
});

test('unknown URLs return to the game from the not-found page', async ({
  page,
}) => {
  await page.goto('/missing-page');
  await expect(
    page.getByRole('heading', { name: '404 - Not Found' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Go to Home' }).click();
  await expect(page.getByRole('combobox')).toBeVisible();
});

test('desktop theme remains keyboard accessible', async ({
  page,
  isMobile,
}) => {
  test.skip(
    isMobile,
    'The current mobile navigation does not expose the theme switch.',
  );
  await page.goto('/');
  const toggle = page.getByRole('switch');
  const wasChecked = await toggle.isChecked();
  await toggle.press('Space');
  await expect(toggle).toBeChecked({ checked: !wasChecked });
});
