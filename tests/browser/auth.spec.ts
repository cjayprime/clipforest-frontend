import { expect, test, type Page } from '@playwright/test';

/**
 * Account lifecycle through the real UI and API: sign up, sign out, sign in,
 * forgot password, redeem the emailed link, and change the password.
 *
 * The reset token only ever exists inside the email, so the run reads it back
 * from the API's dev inbox (MAIL_TEST_INBOX=1), which is the same message Brevo
 * would deliver in production.
 */

const password = 'playwright-auth-1';
const newPassword = 'playwright-auth-2';

// `Field` renders its hint inside the <label>, so an input's accessible name is
// "New password At least 8 characters." — hence the anchored regex, which also
// keeps "Confirm new password" out of the match.
interface SentMail {
  to: string;
  subject: string;
  text: string;
  tags: string[];
  at: string;
}

async function inbox(page: Page, address: string): Promise<SentMail[]> {
  const res = await page.request.get('/api/dev/mail');
  expect(res.status(), 'the dev mail inbox must be enabled (MAIL_TEST_INBOX=1)').toBe(200);
  const body = (await res.json()) as { items: SentMail[] };
  return body.items.filter((m) => m.to === address);
}

async function signOut(page: Page) {
  await page.goto('/settings');
  // Scoped to the page body: the sidebar has its own "Sign out" icon button.
  await page.getByRole('main').getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/sign-in/);
}

async function signIn(page: Page, email: string, pw: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(pw);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test.describe.configure({ mode: 'serial' });

test('sign up, sign out and sign back in', async ({ page }) => {
  const email = `auth-${Date.now()}@example.com`;

  await test.step('registering signs you straight in', async () => {
    await page.goto('/register');
    await page.getByLabel('Name (optional)').fill('Auth Runner');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
  });

  await test.step('a welcome email goes out', async () => {
    await expect
      .poll(async () => (await inbox(page, email)).some((m) => m.tags.includes('welcome')), { timeout: 15_000 })
      .toBe(true);
  });

  await signOut(page);

  await test.step('the wrong password is refused', async () => {
    await signIn(page, email, 'not-the-password');
    await expect(page.locator('form').getByRole('alert')).toContainText(/incorrect/i);
  });

  await test.step('the right password gets in', async () => {
    await signIn(page, email, password);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
  });
});

test('forgot password sends a single-use link that signs you in', async ({ page }) => {
  const email = `reset-${Date.now()}@example.com`;

  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
  await signOut(page);

  await test.step('the sign-in page offers a way out', async () => {
    await page.goto('/sign-in');
    await page.getByRole('link', { name: /forgot your password/i }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
  });

  await test.step('an unknown address gets the same answer as a known one', async () => {
    await page.getByLabel('Email').fill('definitely-not-registered@example.com');
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible();
    expect(await inbox(page, 'definitely-not-registered@example.com')).toHaveLength(0);
  });

  const resetUrl = await test.step('requesting a reset emails a link', async () => {
    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible();

    let mail: SentMail | undefined;
    await expect
      .poll(
        async () => {
          mail = (await inbox(page, email)).find((m) => m.tags.includes('password-reset'));
          return Boolean(mail);
        },
        { timeout: 15_000 },
      )
      .toBe(true);

    const match = mail!.text.match(/https?:\/\/\S*\/reset-password\?token=\S+/);
    expect(match, 'the reset email must contain a link').toBeTruthy();
    return match![0];
  });

  await test.step('a link with no token asks for a fresh one', async () => {
    await page.goto('/reset-password');
    await expect(page.getByRole('link', { name: 'Request a new link' })).toBeVisible();
  });

  await test.step('redeeming the link sets the password and signs you in', async () => {
    await page.goto(resetUrl);
    await page.getByLabel(/^New password/).fill(newPassword);
    await page.getByLabel('Confirm new password').fill(newPassword);
    await page.getByRole('button', { name: 'Set new password' }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
  });

  await test.step('the same link cannot be used twice', async () => {
    await page.goto(resetUrl);
    await page.getByLabel(/^New password/).fill('another-password-9');
    await page.getByLabel('Confirm new password').fill('another-password-9');
    await page.getByRole('button', { name: 'Set new password' }).click();
    await expect(page.locator('form').getByRole('alert')).toContainText(/invalid or has expired/i);
  });

  await test.step('the old password no longer works and the new one does', async () => {
    await page.goto('/reset-password');
    await signIn(page, email, password);
    await expect(page.locator('form').getByRole('alert')).toContainText(/incorrect/i);

    await signIn(page, email, newPassword);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
  });
});

test('changing the password signs out the other devices', async ({ browser }) => {
  const email = `revoke-${Date.now()}@example.com`;
  const laptop = await browser.newContext();
  const phone = await browser.newContext();
  const a = await laptop.newPage();
  const b = await phone.newPage();

  await test.step('the same account is signed in on two devices', async () => {
    await a.goto('/register');
    await a.getByLabel('Email').fill(email);
    await a.getByLabel('Password').fill(password);
    await a.getByRole('button', { name: 'Create account' }).click();
    await expect(a).toHaveURL(/\/dashboard$/, { timeout: 30_000 });

    await signIn(b, email, password);
    await expect(b).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
  });

  await test.step('changing it on one device', async () => {
    await a.goto('/settings');
    await a.getByLabel('Current password').fill(password);
    await a.getByLabel(/^New password/).fill(newPassword);
    await a.getByLabel('Confirm new password').fill(newPassword);
    await a.getByRole('button', { name: 'Update password' }).click();
    await expect(a.locator('form').getByRole('status')).toContainText(/password updated/i);
  });

  await test.step('kicks the other one back to sign-in, and keeps this one', async () => {
    // b still holds its cookie, but the session predates the change.
    await b.goto('/dashboard');
    await expect(b).toHaveURL(/\/sign-in/, { timeout: 30_000 });

    await a.goto('/dashboard');
    await expect(a).toHaveURL(/\/dashboard$/);
  });

  await laptop.close();
  await phone.close();
});

test('changing the password from settings requires the current one', async ({ page }) => {
  const email = `change-${Date.now()}@example.com`;

  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });

  await page.goto('/settings');

  await test.step('the wrong current password is refused', async () => {
    await page.getByLabel('Current password').fill('not-my-password');
    await page.getByLabel(/^New password/).fill(newPassword);
    await page.getByLabel('Confirm new password').fill(newPassword);
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(page.locator('form').getByRole('alert')).toContainText(/current password is incorrect/i);
  });

  await test.step('mismatched confirmation is caught before submitting', async () => {
    await page.getByLabel('Current password').fill(password);
    await page.getByLabel(/^New password/).fill(newPassword);
    await page.getByLabel('Confirm new password').fill('something-else-1');
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(page.locator('form').getByRole('alert')).toContainText(/do not match/i);
  });

  await test.step('the change succeeds and notifies the account', async () => {
    await page.getByLabel('Current password').fill(password);
    await page.getByLabel(/^New password/).fill(newPassword);
    await page.getByLabel('Confirm new password').fill(newPassword);
    await page.getByRole('button', { name: 'Update password' }).click();
    // Scoped to the form: the app shell's live-updates indicator is also role="status".
    await expect(page.locator('form').getByRole('status')).toContainText(/password updated/i);
    await expect
      .poll(async () => (await inbox(page, email)).some((m) => m.tags.includes('password-changed')), { timeout: 15_000 })
      .toBe(true);
  });

  await test.step('this session survives, and the new password works after signing out', async () => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);
    await signOut(page);
    await signIn(page, email, newPassword);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
  });
});
