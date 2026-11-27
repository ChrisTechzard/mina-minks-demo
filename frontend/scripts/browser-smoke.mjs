/**
 * Browser smoke test for the complete demo journey.
 * Requires both servers to be running; resets the demo database itself.
 *
 *   npm run test:e2e
 */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const reset = spawnSync(
  path.join(root, 'backend/.venv/bin/python'),
  ['-m', 'app.seed', '--reset'],
  { cwd: path.join(root, 'backend'), encoding: 'utf8' },
);
assert.equal(reset.status, 0, `Demo reset failed: ${reset.stderr || reset.stdout}`);
console.log(reset.stdout.trim());

const API = process.env.VITE_API_URL ?? 'http://localhost:8000';
const WEB = process.env.E2E_WEB_URL ?? 'http://localhost:5174';
const CHROME = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'mina@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'demo-password-change-me';

const date = new Date();
date.setUTCDate(date.getUTCDate() + 10);
const dateValue = date.toISOString().slice(0, 10);
const dayLabel = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
}).format(date);

const availabilityResponse = await fetch(
  `${API}/api/availability?date=${dateValue}&service_id=4`,
);
assert.equal(availabilityResponse.status, 200, 'Availability API must be reachable');
const availability = await availabilityResponse.json();
assert.ok(availability.slots.length > 0, 'Demo date must have a free slot');

const slot = availability.slots[0];
const timeLabel = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Accra',
}).format(new Date(slot));

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function createReviewReadyPage(clientNumber) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${WEB}/book?service=4`);
  await page.getByRole('button', { name: /Lash Refill/ }).click();
  await page.getByRole('button', { name: dayLabel, exact: false }).first().click();
  await page.getByRole('button', { name: timeLabel, exact: true }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByLabel('Full name').fill(`Browser Client ${clientNumber}`);
  await page.getByLabel('Email').fill(`browser${clientNumber}@example.com`);
  await page.getByLabel('Phone').fill(`+2332000004${String(clientNumber).padStart(2, '0')}`);
  await page.getByRole('button', { name: /Review booking/ }).click();
  await page.getByText('Step 5 — review and confirm').waitFor();
  return { context, page };
}

try {
  const first = await createReviewReadyPage(1);
  const second = await createReviewReadyPage(2);

  await first.page.getByRole('button', { name: /Confirm booking/ }).click();
  await first.page.waitForURL(/\/booking\/MM-/);
  await first.page.getByText("You're on the calendar.").waitFor();
  const reference = first.page.url().split('/').pop();
  assert.match(reference, /^MM-[0-9]{8}-[A-Z0-9]{6}$/);
  console.log(`Booking created in browser: ${reference}`);

  await second.page.getByRole('button', { name: /Confirm booking/ }).click();
  await second.page.getByText('That slot was just taken').waitFor();
  console.log('Second client rejected with the stale-slot conflict message');

  await first.page.goto(`${WEB}/recommend`);
  await first.page.getByRole('button', { name: /Everyday natural/ }).click();
  await first.page.getByRole('button', { name: /No, I've had lashes before/ }).click();
  await first.page.getByRole('button', { name: /Dramatic finish/ }).click();
  await first.page.getByRole('button', { name: /Full set/ }).click();
  await first.page.getByRole('heading', { name: 'Volume Lash Extensions' }).waitFor();
  console.log('Style finder produced an explainable recommendation');

  await first.page.goto(`${WEB}/aftercare`);
  await first.page.getByText('SAMPLE INFORMATION — PENDING MINA\'S APPROVAL').waitFor();
  console.log('Aftercare page shows the approval disclaimer');

  await first.page.goto(`${WEB}/admin`);
  await first.page.getByLabel('Admin email').fill(ADMIN_EMAIL);
  await first.page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await first.page.getByRole('button', { name: /Enter dashboard/ }).click();
  await first.page.getByText('Studio dashboard.').waitFor();
  await first.page.getByRole('button', { name: 'Bookings' }).click();
  await first.page.getByLabel('Name or reference').fill(reference);
  await first.page.getByRole('button', { name: /Apply filters/ }).click();
  await first.page.getByText(reference).first().waitFor();
  await first.page.getByRole('button', { name: 'View', exact: true }).first().click();
  const dialog = first.page.getByRole('dialog');
  await dialog.locator('#status-update').selectOption('confirmed');
  await dialog.getByRole('button', { name: /Save changes/ }).click();
  await dialog.waitFor({ state: 'hidden' });
  const row = first.page.locator('tr', { hasText: reference });
  await row.getByText('confirmed', { exact: true }).waitFor();
  console.log('Admin signed in, found the booking and updated its status');

  await first.context.close();
  await second.context.close();
  console.log('BROWSER SMOKE TEST PASSED');
} finally {
  await browser.close();
}
