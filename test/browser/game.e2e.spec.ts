import { test as base, expect } from '@playwright/test';
import type {
  ClassicCard,
  ClassicState,
} from '../../packages/shared-types/src/classic.interface';

const cards: ClassicCard[] = Array.from({ length: 64 }, (_, i) => ({
  id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
  name: i === 0 ? 'Path to Exile' : `Test Card ${i}`,
  image: '/test-card.svg',
  previewImage: '/test-card-large.svg',
  identity: ['W'],
  mana: 1,
  types: ['Instant'],
  edition: 'Test',
  rarity: 'rare',
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
  rarity: 'exact',
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
        choices: cards.map(({ id, name, image, previewImage }) => ({
          id,
          name,
          image,
          previewImage,
        })),
        hint: { available: false, used: false, removed: 0 },
        hints: ['reduce', 'art', 'text'].map((kind, index) => ({
          kind: kind as 'reduce' | 'art' | 'text',
          threshold: [10, 15, 20][index],
          used: false,
          available: false,
        })),
      },
      fail: false,
      requests: [],
    };
    await context.route('**/*', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const apiPath = url.pathname.replace(/^\/api(?=\/)/, '');
      if (url.pathname.endsWith('.svg') || url.pathname.endsWith('/art'))
        return route.fulfill({
          contentType: 'image/svg+xml',
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="336"><rect width="240" height="336" fill="tan"/></svg>',
        });
      if (apiPath.startsWith('/classic/')) {
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
            server.state.hints.forEach((h) => {
              h.available =
                server.state.guesses.length >= h.threshold && !h.used;
            });
            if (card.id === cards[23].id) {
              server.state.status = 'won';
              server.state.answer = card;
            }
          } else if (url.pathname.endsWith('/hint')) {
            const kind = (request.postDataJSON() as { kind: string }).kind;
            const hint = server.state.hints.find((h) => h.kind === kind)!;
            hint.used = true;
            hint.available = false;
            if (kind === 'reduce') {
              const remove = Math.floor(server.state.choices.length / 2);
              server.state.choices = server.state.choices.slice(remove);
              server.state.hint = {
                available: false,
                used: true,
                removed: remove,
              };
            } else if (kind === 'art') hint.hasImage = true;
            else hint.text = '[cette carte] deals 2 damage to any target.';
          } else if (url.pathname.endsWith('/abandon')) {
            server.state.status = 'abandoned';
            server.state.answer = cards[23];
          }
        }
        if (server.state.status !== 'playing' && !server.state.statistics) {
          server.state.statistics = {
            participants: 4,
            solved: 2,
            abandoned: 1,
            averageWinningGuesses: 2.5,
            guessPercentages: Object.fromEntries(
              server.state.guesses.map((g) => [g.card.id, 75]),
            ),
          };
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
    page.getByRole('rowheader').filter({ hasText: 'Path to Exile' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('rowheader').filter({ hasText: 'Path to Exile' }),
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
    page.getByRole('rowheader').filter({ hasText: 'Path to Exile' }),
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
    page.getByRole('rowheader').filter({ hasText: 'Path to Exile' }),
  ).toBeVisible();
  expect(server.requests).toHaveLength(1);
});

test('hint unlocks after ten errors and survives reload', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Indice 1 : Réduire les choix' }),
  ).toBeDisabled();
  for (let i = 0; i < 10; i++) {
    await select(page, cards[i].name);
    await page.getByRole('button', { name: 'Proposer' }).click();
    await expect(
      page.getByRole('rowheader').filter({ hasText: cards[i].name }),
    ).toBeVisible();
  }
  await page
    .getByRole('button', { name: 'Indice 1 : Réduire les choix' })
    .click();
  await expect(page.getByText('27 cartes retirées')).toBeVisible();
  await page.reload();
  await expect(page.getByText('27 cartes retirées')).toBeVisible();
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
  await expect(
    page.getByRole('region', { name: 'Le défi en chiffres' }),
  ).toBeVisible();
});

test('finished games show daily statistics and per-card percentages in both languages after reload', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('region', { name: 'Le défi en chiffres' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('columnheader', { name: 'Même proposition' }),
  ).toHaveCount(0);
  await select(page);
  await page.getByRole('button', { name: 'Proposer', exact: true }).click();
  await page
    .getByRole('button', { name: 'Abandonner et révéler la carte' })
    .click();
  await page.getByRole('button', { name: 'Confirmer l’abandon' }).click();
  const stats = page.getByRole('region', { name: 'Le défi en chiffres' });
  await expect(stats).toContainText('2,5');
  await expect(stats).toContainText('Base : 4 session(s)');
  await expect(stats.locator('dd')).toHaveText(['2', '2,5', '1']);
  const row = page.getByRole('row', { name: /Path to Exile/ });
  await expect(row.locator('.classic-guess-percentage')).toHaveText('75 %');
  await page.reload();
  await expect(stats).toBeVisible();
  await expect(row.locator('.classic-guess-percentage')).toHaveText('75 %');
  await page.getByRole('button', { name: 'Passer en anglais' }).click();
  await expect(
    page.getByRole('region', { name: 'Today’s challenge in numbers' }),
  ).toContainText('2.5');
  await expect(
    page.getByRole('columnheader', { name: 'Also guessed' }),
  ).toHaveCount(1);
});

test('statistics display a dash when nobody has won and handle no guesses', async ({
  page,
  server,
}) => {
  server.state.status = 'abandoned';
  server.state.answer = cards[23];
  server.state.statistics = {
    participants: 0,
    solved: 0,
    abandoned: 1,
    averageWinningGuesses: null,
    guessPercentages: {},
  };
  await page.goto('/');
  const stats = page.getByRole('region', { name: 'Le défi en chiffres' });
  await expect(stats.locator('dd')).toHaveText(['0', '—', '1']);
  await expect(stats).toContainText('Base : 0 session(s)');
  await expect(
    page.getByRole('columnheader', { name: 'Même proposition' }),
  ).toHaveCount(0);
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
    page.getByRole('heading', { name: '404 - Page introuvable' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Retour au jeu' }).click();
  await expect(page.getByRole('combobox')).toBeVisible();
});

test('theme remains keyboard accessible on every viewport', async ({
  page,
}) => {
  await page.goto('/');
  const toggle = page.getByRole('switch');
  const wasChecked = await toggle.isChecked();
  await toggle.press('Space');
  await expect(toggle).toBeChecked({ checked: !wasChecked });
});

test('compact layout offers large previews in search and history', async ({
  page,
  isMobile,
}, testInfo) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Une carte. À toi de la trouver.' }),
  ).toHaveCount(0);
  await page.getByRole('combobox').fill('Path');
  const option = page.getByRole('option', {
    name: 'Path to Exile',
    exact: true,
  });
  await expect(option.locator('img')).toHaveCSS('height', '84px');
  if (!isMobile) {
    await option.hover();
    await expect(page.locator('.classic-hover-preview')).toBeVisible();
  }
  await option.click();
  await page
    .getByRole('button', { name: 'Agrandir Path to Exile', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('img')).toHaveAttribute(
    'src',
    '/test-card-large.svg',
  );
  await page.getByRole('button', { name: 'Fermer l’aperçu' }).click();
  await page.getByRole('button', { name: 'Proposer' }).click();
  const history = page.getByRole('region', { name: 'Historique des essais' });
  await expect(history.locator('img')).toBeVisible();
  await history.getByRole('button', { name: 'Agrandir Path to Exile' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Fermer l’aperçu' }).click();
  await page.screenshot({
    path: testInfo.outputPath('compact-game.png'),
    fullPage: true,
  });
});

test('illustration and masked rules text remain revealed after reload', async ({
  page,
  server,
}) => {
  server.state.guesses = cards
    .filter((c) => c.id !== cards[23].id)
    .slice(0, 15)
    .map((card, i) => ({
      card,
      requestId: `seed-${i}`,
      matches: exact,
      won: false,
    }));
  server.state.choices = cards.filter(
    (c) => !server.state.guesses.some((g) => g.card.id === c.id),
  );
  server.state.hints.forEach((h) => {
    h.available = h.threshold <= 15;
  });
  await page.goto('/');
  const art = page.getByRole('button', {
    name: 'Indice 2 : Illustration',
    exact: true,
  });
  const text = page.getByRole('button', {
    name: 'Indice 3 : Texte de règles',
    exact: true,
  });
  await expect(text).toBeDisabled();
  await art.click();
  await expect(
    page.getByAltText('Illustration de la carte du jour'),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByAltText('Illustration de la carte du jour'),
  ).toBeVisible();
  server.state.guesses = cards
    .filter((c) => c.id !== cards[23].id)
    .slice(0, 20)
    .map((card, i) => ({
      card,
      requestId: `seed-${i}`,
      matches: exact,
      won: false,
    }));
  server.state.hints.find((h) => h.kind === 'text')!.available = true;
  await page.reload();
  await text.click();
  await expect(
    page.getByText('[cette carte] deals 2 damage to any target.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText('[cette carte] deals 2 damage to any target.', {
      exact: true,
    }),
  ).toBeVisible();
});

test('English translation persists without resetting the game', async ({
  page,
}) => {
  await page.goto('/');
  await select(page);
  await page.getByRole('button', { name: 'Proposer', exact: true }).click();
  await expect(
    page.getByRole('rowheader').filter({ hasText: 'Path to Exile' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Passer en anglais' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(
    page.getByRole('heading', { name: 'Game — Guess' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Hint 2: Artwork', exact: true }),
  ).toContainText('15 wrong guesses');
  await expect(
    page.getByRole('button', { name: 'Hint 3: Rules text', exact: true }),
  ).toContainText('20 wrong guesses');
  await expect(
    page.getByRole('columnheader', { name: 'Color identity', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('columnheader', { name: 'Rarity', exact: true }),
  ).toHaveCount(1);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Game — Guess' }),
  ).toBeVisible();
  await expect(
    page.getByRole('rowheader').filter({ hasText: 'Path to Exile' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Switch to French' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(
    page.getByRole('heading', { name: 'Jeu — Devinette' }),
  ).toBeVisible();
  await expect(
    page.getByRole('columnheader', { name: 'Rareté', exact: true }),
  ).toHaveCount(1);
});

test('card frame contains controls and partner links without an outer header', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('navigation')).toHaveCount(0);
  const top = page.locator('.classic-topbar');
  await expect(
    top.getByRole('link', { name: 'GitHub', exact: true }),
  ).toHaveAttribute('href', 'https://github.com/CalibanAngel/mtgdle');
  await expect(top.getByRole('switch')).toBeVisible();
  await expect(
    top.getByRole('link', { name: 'Scryfall', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Scryfall', exact: true }),
  ).toHaveAttribute('href', 'https://scryfall.com');
  await expect(
    page.getByRole('link', { name: 'Wizards of the Coast', exact: true }),
  ).toHaveAttribute('href', 'https://magic.wizards.com');
  await expect(page.getByText('Powered by')).toHaveCount(0);
});

test('English errors, previews and confirmation are translated', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Passer en anglais' }).click();
  await page.route('**/classic/*/guesses', (route) =>
    route.fulfill({
      status: 409,
      json: { code: 'errorExpired', message: 'Ce défi est terminé.' },
    }),
  );
  await select(page);
  await page
    .getByRole('button', { name: 'Enlarge Path to Exile', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Preview: Path to Exile' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close preview' }).click();
  await page.getByRole('button', { name: 'Guess', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(
    'This challenge has ended.',
  );
  await page
    .getByRole('button', { name: 'Give up and reveal the card' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Confirm giving up' }),
  ).toBeVisible();
});

test('Omnath frame uses a white border in light mode and a black border in dark mode', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await expect(page.locator('.classic-game')).toBeVisible();
  const texture = await page.evaluate(async () => {
    const image = new Image();
    image.src = '/assets/omnath-frame.png';
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    const center = ctx.getImageData(
      Math.floor(canvas.width / 2),
      Math.floor(canvas.height / 2),
      1,
      1,
    ).data[3];
    const paper = new Image();
    paper.src = '/assets/omnath-paper.png';
    await paper.decode();
    return {
      center,
      width: image.naturalWidth,
      paperWidth: paper.naturalWidth,
      frame: getComputedStyle(
        document.querySelector('.classic-game')!,
        '::before',
      ).borderImageSource,
    };
  });
  expect(texture.center).toBe(0);
  expect(texture.width).toBeGreaterThan(500);
  expect(texture.paperWidth).toBeGreaterThan(500);
  expect(texture.frame).toContain('/assets/omnath-frame.png');
  const theme = page.getByRole('switch');
  if (!(await theme.isChecked())) await theme.press('Space');
  await expect(page.locator('.classic-game')).toHaveCSS(
    'border-top-color',
    'rgb(255, 255, 255)',
  );
  await page.screenshot({
    path: testInfo.outputPath('omnath-light.png'),
    fullPage: true,
  });
  await theme.press('Space');
  await expect(page.locator('.classic-game')).toHaveCSS(
    'border-top-color',
    'rgb(8, 8, 8)',
  );
  await page.screenshot({
    path: testInfo.outputPath('omnath-dark.png'),
    fullPage: true,
  });
});
