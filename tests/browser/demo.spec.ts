import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('The lunar replay changes context, distinguishes stale data and preserves a handoff', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Crew health', exact: true })).toBeVisible();
  await expect(page.getByText('Loading BY STAR. JavaScript is required.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Alex Morgan EVA team lead/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.bs-crew-card')).toHaveCount(6);
  await expect(page.getByRole('heading', { name: 'Cabin CO₂ change needs review' })).toBeVisible();
  await page.getByRole('link', { name: 'Review incident' }).click();
  await expect(page.getByRole('heading', { name: 'Assist', exact: true })).toBeVisible();
  await page.getByText('Evidence and timing').click();
  await expect(page.getByText('Observations attached when the alert opened')).toBeVisible();
  await expect(page.getByText(/Dizziness reported after return/)).toBeVisible();
  await page.getByRole('button', { name: 'Acknowledge alert' }).click();
  await page.getByRole('button', { name: 'Start guided check' }).click();
  await page.getByRole('button', { name: 'Done · next step' }).click();
  await expect(page.getByRole('heading', { name: 'Verify the source' })).toBeVisible();
  await page.getByRole('button', { name: 'I can’t do this now' }).click();
  await page.getByLabel('Assigned crew member', { exact: true }).selectOption('noah');
  await page.getByRole('button', { name: 'Request support' }).click();
  await expect(page.getByText(/awaiting receipt/)).toBeVisible();

  await page.getByRole('navigation').getByRole('link', { name: 'Profiles' }).click();
  await page.getByRole('button', { name: 'Mission & schedule' }).click();
  await expect(page.getByRole('heading', { name: 'Mission health plan' })).toBeVisible();
  await page.getByRole('button', { name: 'Sources & data' }).click();
  await expect(page.getByRole('link', { name: 'View sample JSON' })).toHaveAttribute('href', /radlab-iss-sample\.json$/);
  await page.getByRole('navigation').getByRole('link', { name: 'Assist' }).click();
  await expect(page.getByRole('button', { name: 'Resume check' })).toBeVisible();
  await expect(page.getByLabel('Assigned crew member', { exact: true })).toHaveValue('noah');
  await page.getByLabel('Active crew member').selectOption('noah');
  await page.getByRole('button', { name: 'Confirm receipt' }).click();
  await expect(page.getByText('Receipt confirmed by Noah Chen.')).toBeVisible();
  await page.getByRole('button', { name: 'Resume check' }).click();
  await page.getByRole('button', { name: 'Done · next step' }).click();
  await page.getByRole('button', { name: 'Complete follow-up' }).click();
  await expect(page.getByText('Follow-up recorded as complete.')).toBeVisible();

  await page.getByRole('navigation').getByRole('link', { name: 'Health' }).click();
  await page.getByRole('button', { name: /Maya Torres/ }).click();
  await expect(page.locator('.bs-person-heading').getByText('Reading out of date')).toBeVisible();
  await page.getByRole('button', { name: 'Next event' }).click();
  await expect(page.getByText('Earth relay unavailable', { exact: true }).last()).toBeVisible();
  await page.getByRole('button', { name: 'Next event' }).click();
  await expect(page.locator('.bs-person-heading').getByText('Current reading')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Keyboard path, narrow layout and simplified mode keep controls usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Crew health' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to mission content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Mission content' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Simplified view' }).click();
  await expect(page.getByRole('button', { name: 'Simplified view' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: 'Indicator trend' })).toHaveCount(0);
  await page.getByRole('link', { name: 'I need help', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Report a concern' })).toBeVisible();
  await page.getByRole('button', { name: 'Vision or balance concern' }).click();
  await expect(page.getByRole('heading', { name: 'Crew concern reported' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Simplified view' })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('Core routes pass automated accessibility checks', async ({ page }) => {
  for (const [route, heading] of [['health', 'Crew health'], ['assist', 'Assist'], ['profiles', 'Profiles']]) {
    await page.goto('/?page=' + route);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    const result = await new AxeBuilder({ page }).include('.bs-app').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(result.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([]);
  }
});

test('A running replay advances and keeps its paused position after navigation', async ({ page }) => {
  await page.goto('/');
  const progress = page.getByRole('progressbar', { name: 'Replay progress' });
  await expect(progress).toHaveAttribute('value', '108');
  await page.getByLabel('Playback speed').selectOption('4');
  await page.getByRole('button', { name: 'Play replay' }).click();
  await expect.poll(async () => Number(await progress.getAttribute('value'))).toBeGreaterThan(108);
  await page.getByRole('button', { name: 'Pause replay' }).click();
  await expect(page.getByRole('button', { name: 'Play replay' })).toBeEnabled();
  const stoppedAt = await progress.getAttribute('value');
  await page.getByRole('navigation').getByRole('link', { name: 'Profiles' }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Health' }).click();
  await expect(progress).toHaveAttribute('value', stoppedAt!);
});

test('WordPress page markup loads the bundle and navigates with versioned uploads', async ({ page }) => {
  const origin = 'http://127.0.0.1:4173';
  const uploadPath = '/wp-content/uploads/by-star/v0.2.0/';
  const links = { health: '/mission-health/health/', assist: '/mission-health/assist/', profiles: '/mission-health/profiles/' };
  const attributes = JSON.stringify(links).replaceAll('"', '&quot;');
  await page.route('**' + uploadPath + '**', route => {
    const file = new URL(route.request().url()).pathname.slice(uploadPath.length);
    return route.continue({ url: origin + '/' + file });
  });
  await page.route('**/mission-health/**', route => {
    const segments = new URL(route.request().url()).pathname.split('/').filter(Boolean);
    return route.fulfill({ contentType: 'text/html', body:
      '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>BY STAR</title>'
      + '<link rel="stylesheet" href="' + uploadPath + 'assets/by-star-app.css">'
      + '<div class="bs-app alignwide" data-page="' + segments[1] + '" data-asset-base="' + uploadPath + '" data-links="' + attributes + '">Loading BY STAR.</div>'
      + '<script src="' + uploadPath + 'assets/by-star-app.js"></script></html>',
    });
  });
  await page.goto(links.health);
  await expect(page.getByRole('heading', { name: 'Crew health', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Review incident' }).click();
  await expect(page).toHaveURL(/mission-health\/assist\/\?by_star_work=air-habitat$/);
  await expect(page.getByRole('heading', { name: 'Cabin CO₂ change needs review', exact: true })).toBeVisible();
});
