/**
 * Interactive page tour: drives the real app in Chromium, screenshots every
 * screen (desktop + mobile) and reports console errors, failed requests and
 * timings. Use it to *look* at the UI, not just assert on it.
 *
 *   node tests/browser/tour.mjs [--out DIR] [--headed]
 *   node tests/browser/tour.mjs --reuse someone@example.com   # skip the upload
 */
import { chromium, devices } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const arg = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const outDir = path.resolve(arg('--out', 'tour-screenshots'));
const headed = args.includes('--headed');
const reuseEmail = arg('--reuse', null);
const PASSWORD = 'tour-password-123';
const BASE = process.env.CLIPFOREST_WEB_URL ?? 'http://localhost:3000';
const FIXTURE = path.resolve(import.meta.dirname, '.fixtures/sample.mp4');

const problems = [];
const shots = [];
let current = 'startup';

async function shot(page, name, opts = {}) {
  const file = path.join(outDir, `${String(shots.length + 1).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file, fullPage: opts.fullPage ?? false });
  shots.push(path.basename(file));
  console.log(`  📸 ${path.basename(file)}`);
}

function watch(page) {
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push({ page: current, type: 'console', text: m.text().slice(0, 300) });
  });
  page.on('pageerror', (e) => problems.push({ page: current, type: 'pageerror', text: String(e).slice(0, 300) }));
  page.on('requestfailed', (r) => {
    const f = r.failure()?.errorText ?? '';
    if (!f.includes('ERR_ABORTED')) problems.push({ page: current, type: 'requestfailed', text: `${r.method()} ${r.url().split('?')[0]} — ${f}` });
  });
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().includes('/api/')) problems.push({ page: current, type: 'http', text: `${r.status()} ${r.url().split('?')[0]}` });
  });
}

/** Click a nav link and wait for the route to actually change. */
async function navigate(page, name, urlPattern) {
  await page.getByRole('link', { name, exact: true }).first().click();
  await page.waitForURL(urlPattern, { timeout: 30_000 });
  await page.waitForLoadState('networkidle');
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: !headed });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  watch(page);
  const t0 = Date.now();

  current = 'sign-in';
  await page.goto(`${BASE}/videos`, { waitUntil: 'networkidle' });
  console.log('sign-in guard →', page.url());
  await shot(page, 'sign-in');

  const email = reuseEmail ?? `tour-${Date.now()}@example.com`;
  if (reuseEmail) {
    current = 'sign-in-existing';
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
  } else {
    current = 'register';
    await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
    await shot(page, 'register');
    await page.getByLabel('Name (optional)').fill('Tour Runner');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();
  }
  // Sign-in returns to the page that triggered the guard (?next=), not always "/".
  await page.waitForURL((u) => !u.pathname.startsWith('/sign-in') && !u.pathname.startsWith('/register'), { timeout: 30_000 });
  await page.waitForLoadState('networkidle');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  console.log('account:', email);

  current = 'dashboard';
  await shot(page, reuseEmail ? 'dashboard' : 'dashboard-empty', { fullPage: true });

  for (const [name, url] of [
    ['new-video', '/new'],
    ['videos', '/videos'],
    ['clips', '/clips'],
    ['settings', '/settings'],
  ]) {
    current = name;
    await page.goto(BASE + url, { waitUntil: 'networkidle' });
    await shot(page, name, { fullPage: true });
  }

  let videoUrl = null;
  if (!reuseEmail) {
    current = 'upload';
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await page.getByRole('checkbox', { name: /own this content/i }).check();
    await page.locator('input[type="file"]').setInputFiles(FIXTURE);
    await page.waitForURL(/\/videos\/[0-9a-f-]{36}$/, { timeout: 60_000 });
    videoUrl = page.url();
    console.log('uploading →', videoUrl);

    current = 'processing';
    await page.waitForTimeout(2500);
    await shot(page, 'processing-uploading', { fullPage: true });
    for (const label of ['Preparing video', 'Creating transcript', 'Finding best moments']) {
      try {
        await page.getByText(label, { exact: false }).first().waitFor({ timeout: 120_000 });
      } catch {
        /* a stage can pass too quickly to catch */
      }
    }
    await shot(page, 'processing-analyzing', { fullPage: true });

    current = 'results';
    await page.getByRole('heading', { name: 'Best moments' }).waitFor({ timeout: 420_000 });
    await page.waitForLoadState('networkidle');
    console.log(`results ready after ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    await shot(page, 'results', { fullPage: true });
    console.log('candidates rendered:', await page.locator('article').count());
    await page.locator('article').first().getByRole('button', { name: 'Preview' }).click();
    await page.waitForTimeout(1500);
    await shot(page, 'results-preview-playing');

    current = 'clip-editor';
    await page.locator('article').first().getByRole('button', { name: 'Generate clip' }).click();
    await page.waitForURL(/\/clips\/[0-9a-f-]{36}$/, { timeout: 60_000 });
    await page.waitForTimeout(3000);
    await shot(page, 'clip-editor-rendering', { fullPage: true });
    await page.getByRole('link', { name: /Download MP4/i }).waitFor({ timeout: 420_000 });
    await page.waitForTimeout(1500);
    await shot(page, 'clip-editor-completed', { fullPage: true });
  } else {
    current = 'clip-editor';
    await page.goto(`${BASE}/clips`, { waitUntil: 'networkidle' });
    const firstClip = page.locator('a[href^="/clips/"]').first();
    if (await firstClip.count()) {
      await firstClip.click();
      await page.waitForURL(/\/clips\/[0-9a-f-]{36}$/, { timeout: 30_000 });
      await page.waitForLoadState('networkidle');
      await shot(page, 'clip-editor-completed', { fullPage: true });
    }
    videoUrl = await page.locator('a[href^="/videos/"]').first().getAttribute('href');
    videoUrl = videoUrl ? BASE + videoUrl : null;
  }

  current = 'clips-list';
  await navigate(page, 'Clips', /\/clips$/);
  await shot(page, 'clips-list', { fullPage: true });

  current = 'videos-list';
  await navigate(page, 'Videos', /\/videos$/);
  await shot(page, 'videos-list', { fullPage: true });

  current = 'dashboard-with-video';
  await navigate(page, 'Home', new RegExp(`^${BASE}/$`));
  await shot(page, 'dashboard-with-video', { fullPage: true });

  // A real mobile context (viewport + UA + touch), not just a resized desktop one.
  current = 'mobile';
  const mobileContext = await browser.newContext({ ...devices['iPhone 13'] });
  const mobile = await mobileContext.newPage();
  watch(mobile);
  await mobile.goto(`${BASE}/sign-in`, { waitUntil: 'networkidle' });
  await mobile.getByLabel('Email').fill(email);
  await mobile.getByLabel('Password').fill(PASSWORD);
  await mobile.getByRole('button', { name: 'Sign in' }).click();
  await mobile.waitForURL(`${BASE}/`, { timeout: 30_000 });
  await mobile.waitForLoadState('networkidle');
  await shot(mobile, 'mobile-dashboard', { fullPage: true });
  await mobile.getByRole('button', { name: 'Open navigation' }).click();
  await mobile.waitForTimeout(400);
  await shot(mobile, 'mobile-nav-drawer');
  await mobile.getByRole('button', { name: 'Close navigation' }).click();
  if (videoUrl) {
    await mobile.goto(videoUrl, { waitUntil: 'networkidle' });
    await shot(mobile, 'mobile-results', { fullPage: true });
  }
  await mobileContext.close();

  await browser.close();
  const report = { seconds: Math.round((Date.now() - t0) / 1000), account: email, screenshots: shots, problems, outDir };
  await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log('\n' + JSON.stringify({ ...report, screenshots: shots.length }, null, 2));
  if (problems.length) console.log(`\n${problems.length} problem(s) recorded — see report.json`);
}

main().catch((err) => {
  console.error('TOUR FAILED at', current, '\n', err);
  process.exit(1);
});
