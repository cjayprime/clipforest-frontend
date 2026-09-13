/**
 * Ad-hoc DOM probe: signs in on a phone-sized viewport and reports any element
 * that is visible but shouldn't be (e.g. desktop-only chrome leaking on mobile).
 *
 *   node tests/browser/probe.mjs <email> [url]
 */
import { chromium, devices } from '@playwright/test';

const BASE = process.env.CLIPROVER_WEB_URL ?? 'http://localhost:3000';
const [email, target = '/'] = process.argv.slice(2);

const browser = await chromium.launch();
const context = await browser.newContext({ ...devices['iPhone 13'] });
const page = await context.newPage();

await page.goto(`${BASE}/sign-in`);
await page.getByLabel('Email').fill(email);
await page.getByLabel('Password').fill('tour-password-123');
await page.getByRole('button', { name: 'Sign in' }).click();
await page.waitForURL((u) => !u.pathname.startsWith('/sign-in'));
await page.goto(BASE + target, { waitUntil: 'networkidle' });

const report = await page.evaluate(() => {
  const vw = window.innerWidth;
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || r.width === 0 || r.height === 0) continue;
    // Anything sticking out past the viewport, or fixed chrome overlapping content.
    if (r.right > vw + 1 || r.left < -1) {
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className?.toString?.() ?? '').slice(0, 120),
        text: (el.textContent ?? '').trim().slice(0, 40),
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        position: cs.position,
      });
    }
  }
  return { viewport: vw, scrollWidth: document.documentElement.scrollWidth, overflowing: out.slice(0, 15) };
});

console.log(JSON.stringify(report, null, 2));
await browser.close();
