import { test, expect } from '@playwright/test';

const cards = [
  {
    cardId: '29b7a8b1-b98e-483a-87a4-73bd831c03d4',
    name: 'Path to Exile',
    imageUris: { small: '/test-card.svg' },
  },
  {
    cardId: '70e70720-f0b9-4ad7-9366-927d6798d31e',
    name: 'Path of Ancestry',
    imageUris: { small: '/test-card.svg' },
  },
];

test.beforeEach(async ({ context }) => {
  // Fail closed: no backend or external request is allowed through.
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/playable-cards')
      return route.fulfill({ json: cards });
    if (url.pathname.startsWith('/game/'))
      return route.fulfill({ status: 201, json: true });
    if (url.pathname === '/test-card.svg')
      return route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="50"><rect width="36" height="50" fill="tan"/></svg>',
      });
    if (
      url.origin === 'http://127.0.0.1:4173' &&
      !['xhr', 'fetch'].includes(route.request().resourceType())
    )
      return route.continue();
    return route.abort();
  });
});

test('search filters the catalogue and submits the chosen UUID', async ({
  page,
}) => {
  await page.goto('/');
  const search = page.getByRole('combobox');
  await search.fill('Exile');
  await expect(
    page.getByRole('option', { name: 'Path to Exile', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('option', { name: 'Path of Ancestry', exact: true }),
  ).toHaveCount(0);
  const request = page.waitForRequest(
    (req) =>
      req.method() === 'POST' &&
      req.url().endsWith(`/game/guess-card/${cards[0].cardId}`),
  );
  await page
    .getByRole('option', { name: 'Path to Exile', exact: true })
    .click();
  await request;
});

test('keyboard selection submits the selected card', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('combobox');
  await search.fill('Exile');
  await expect(
    page.getByRole('option', { name: 'Path to Exile', exact: true }),
  ).toBeVisible();
  const request = page.waitForRequest(
    (req) => req.method() === 'POST' && req.url().includes('/game/guess-card/'),
  );
  await search.press('ArrowDown');
  await search.press('Enter');
  expect((await request).url()).toContain(cards[0].cardId);
});

test('empty catalogue keeps the search usable without submitting', async ({
  page,
}) => {
  await page.route('**/playable-cards', (route) => route.fulfill({ json: [] }));
  const submissions: string[] = [];
  page.on('request', (req) => {
    if (req.method() === 'POST') submissions.push(req.url());
  });
  await page.goto('/');
  await page.getByRole('combobox').fill('Unknown');
  await expect(page.getByRole('option')).toHaveCount(0);
  await expect(page.getByRole('combobox')).toBeEnabled();
  expect(submissions).toEqual([]);
});

test('an unknown URL displays the not-found page', async ({ page }) => {
  await page.goto('/missing-page');
  await expect(
    page.getByRole('heading', { name: '404 - Not Found' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Go to Home' }).click();
  await expect(page.getByRole('combobox')).toBeVisible();
});

test('desktop theme switch works with the keyboard', async ({
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
