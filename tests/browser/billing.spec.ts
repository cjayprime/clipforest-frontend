import { expect, test } from '@playwright/test';

/**
 * Returning from a Polar checkout. The dev stack has no Polar webhook secret, so
 * a checkout is never credited here — which is exactly the state a customer sees
 * in the seconds before the webhook lands. The credited transition is covered
 * against a signed webhook by the backend's tests/e2e/billing_e2e.py.
 */
test('returning from checkout explains that credits are on their way, and can be dismissed', async ({ page }) => {
  await test.step('sign up', async () => {
    await page.goto('/register');
    await page.getByLabel('Email').fill(`billing-${Date.now()}@example.com`);
    await page.getByLabel('Password').fill('playwright-billing-1');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
  });

  const main = page.getByRole('main');

  await test.step('the return URL shows a pending notice, not a false success', async () => {
    await page.goto('/settings?checkout=chk_playwright_pending');
    const notice = main.getByRole('status').filter({ hasText: 'Payment received' });
    await expect(notice).toBeVisible();
    await expect(notice).toContainText('Adding your credits');
    await expect(main.getByText('Payment confirmed')).toHaveCount(0);
  });

  await test.step('it keeps asking the server rather than giving up after one look', async () => {
    const polled = page.waitForResponse(
      (res) => res.url().includes('/api/billing/checkout/chk_playwright_pending') && res.status() === 200,
    );
    await expect((await polled).json()).resolves.toEqual({ checkoutId: 'chk_playwright_pending', status: 'pending' });
  });

  await test.step('dismissing removes the notice and the query string', async () => {
    await main.getByRole('button', { name: 'Dismiss' }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(main.getByText('Payment received')).toHaveCount(0);
  });
});
