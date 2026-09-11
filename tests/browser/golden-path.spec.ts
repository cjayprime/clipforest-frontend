import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';

/**
 * The product's golden path, driven through the real UI (PRD §3.3, §22):
 * sign-in guard → register → upload → processing → ranked moments → generate a
 * 9:16 clip → adjust and re-render → clips library → delete.
 */

const FIXTURE = process.env.CLIPFOREST_FIXTURE ?? path.resolve(__dirname, '.fixtures/sample.mp4');
const account = { email: `pw-${Date.now()}@example.com`, password: 'playwright-test-pw' };

async function register(page: Page) {
  await page.goto('/register');
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Password').fill(account.password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Create clips people want to watch' })).toBeVisible();
}

test.describe.configure({ mode: 'serial' });

test('unauthenticated pages redirect to sign in and keep the destination', async ({ page }) => {
  await page.goto('/clips');
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fclips$/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await page.getByRole('link', { name: 'Create an account' }).click();
  await expect(page).toHaveURL(/\/register/);
});

test('rejects a sign-in with the wrong password', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill('nobody@example.com');
  await page.getByLabel('Password').fill('definitely-wrong');
  await page.getByRole('button', { name: 'Sign in' }).click();
  // Scoped to the form: Next's route announcer is also role="alert".
  await expect(page.locator('form').getByRole('alert')).toContainText(/incorrect/i);
});

test('upload a video, review ranked moments, generate and re-render a clip', async ({ page }) => {
  page.on('dialog', (d) => void d.accept());
  await register(page);

  await test.step('rights confirmation is required before uploading', async () => {
    await page.locator('input[type="file"]').setInputFiles(FIXTURE);
    await expect(page.getByRole('region', { name: 'Add a video' }).getByRole('alert')).toContainText(/own this content|authorized/i);
  });

  await test.step('upload the file directly to storage', async () => {
    await page.getByRole('checkbox', { name: /own this content/i }).check();
    await page.locator('input[type="file"]').setInputFiles(FIXTURE);
    await expect(page).toHaveURL(/\/videos\/[0-9a-f-]{36}$/, { timeout: 60_000 });
  });

  await test.step('processing shows durable stage progress', async () => {
    await expect(page.getByRole('progressbar').first()).toBeVisible();
    // The stage list is always rendered; it names every durable stage of the pipeline.
    await expect(page.getByText('Creating transcript').first()).toBeVisible({ timeout: 300_000 });
    await expect(page.getByText('Finding best moments').first()).toBeVisible();
  });

  await test.step('ranked moments appear when analysis finishes', async () => {
    await expect(page.getByRole('heading', { name: 'Best moments' })).toBeVisible({ timeout: 420_000 });
    await expect(page.locator('video')).toBeVisible();
    const moments = page.locator('article');
    await expect(moments.first()).toBeVisible();
    expect(await moments.count()).toBeGreaterThan(0);
    // Every card carries a score, a range and an explanation (PRD §8.1).
    await expect(moments.first()).toContainText('Why it works');
    await expect(moments.first().getByLabel(/Score \d+ out of 100/)).toBeVisible();
  });

  const clipUrl = await test.step('generate a clip from the top moment', async () => {
    await page.locator('article').first().getByRole('button', { name: 'Generate clip' }).click();
    await expect(page).toHaveURL(/\/clips\/[0-9a-f-]{36}$/, { timeout: 60_000 });
    await expect(page.getByText('9:16', { exact: true }).first()).toBeVisible();
    return page.url();
  });

  await test.step('the render completes and is downloadable', async () => {
    await expect(page.getByRole('link', { name: /Download MP4/i })).toBeVisible({ timeout: 420_000 });
    await expect(page.getByText(/1080×1920/)).toBeVisible();
    const src = await page.locator('video').first().getAttribute('src');
    expect(src).toContain('final.mp4');
  });

  await test.step('adjusting settings re-renders as a new version', async () => {
    await page.goto(clipUrl);
    await page.getByRole('switch', { name: /captions/i }).click();
    await page.getByRole('radio', { name: /Center crop/i }).click();
    await page.getByRole('button', { name: /Re-render as v2/i }).click();
    await expect(page).toHaveURL(/\/clips\/[0-9a-f-]{36}$/, { timeout: 60_000 });
    await expect(page.getByText('v2', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Download MP4/i })).toBeVisible({ timeout: 420_000 });
    await expect(page.getByRole('heading', { name: 'Versions' })).toBeVisible();
  });

  await test.step('the clips library lists both versions', async () => {
    await page.getByRole('link', { name: 'Clips' }).click();
    await expect(page).toHaveURL(/\/clips$/);
    await expect(page.getByRole('heading', { name: 'Clips', exact: true })).toBeVisible();
    await page.getByRole('radio', { name: 'All versions' }).click();
    await expect(page.locator('a[href^="/clips/"]')).toHaveCount(2);
  });

  await test.step('deleting the video schedules cleanup and removes it', async () => {
    await page.getByRole('link', { name: 'Videos' }).click();
    await page.locator('a[href^="/videos/"]').first().click();
    await page.getByRole('button', { name: 'Delete video' }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 60_000 });
    await expect(page.getByText('No videos here yet')).toBeVisible({ timeout: 30_000 });
  });
});
