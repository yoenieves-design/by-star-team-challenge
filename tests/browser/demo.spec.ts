import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('The lunar replay changes context, distinguishes stale data and preserves a handoff', async ({ page }) => {
  await page.addInitScript(() => {
    // Exercise consecutive actions even when the browser reports saves slowly.
    const descriptor = Object.getOwnPropertyDescriptor(IDBTransaction.prototype, 'oncomplete')!;
    Object.defineProperty(IDBTransaction.prototype, 'oncomplete', {
      ...descriptor,
      set(this: IDBTransaction, handler: ((event: Event) => void) | null) {
        if (handler && this.mode === 'readwrite') {
          descriptor.set!.call(this, (event: Event) => setTimeout(() => handler.call(this, event), 80));
        } else {
          descriptor.set!.call(this, handler);
        }
      },
    });
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Crew health', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Health' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByText('Loading BY STAR. JavaScript is required.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Alex Morgan EVA team lead/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.bs-crew-card')).toHaveCount(6);
  await expect(page.getByRole('heading', { name: 'Cabin CO₂ change needs review' })).toBeVisible();
  await page.getByRole('link', { name: 'Review incident' }).click();
  await expect(page.getByRole('heading', { name: 'Assist', exact: true })).toBeVisible();
  await page.getByRole('region', { name: 'Mission content' }).getByText('Evidence and timing').click();
  await expect(page.getByText('Observations attached when the alert opened')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Received UTC' })).toBeVisible();
  await expect(page.getByText(/Other reports from this zone.*Dizziness reported after return/)).toBeVisible();
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
  await expect(page.getByRole('heading', { name: 'NASA data & references' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View sample JSON' })).toHaveAttribute('href', /radlab-iss-sample\.json$/);
  await page.getByRole('navigation').getByRole('link', { name: 'Assist' }).click();
  await expect(page.getByRole('button', { name: 'Resume check' })).toBeVisible();
  await expect(page.getByLabel('Assigned crew member', { exact: true })).toHaveValue('noah');
  await page.getByLabel('Active crew member').selectOption('noah');
  await page.getByRole('button', { name: 'Confirm receipt' }).click();
  await expect(page.getByText('Receipt confirmed by Noah Chen.')).toBeVisible();
  await page.getByRole('button', { name: 'Resume check' }).click();
  await page.getByRole('button', { name: 'Done · next step' }).click();
  await page.getByRole('radio', { name: 'Verified', exact: true }).check();
  await page.getByRole('button', { name: 'Complete follow-up' }).click();
  await expect(page.getByText('Follow-up recorded as complete.')).toBeVisible();

  await page.getByRole('navigation').getByRole('link', { name: 'Health' }).click();
  await page.getByRole('button', { name: /Maya Torres/ }).click();
  const pulse = page.getByRole('group', { name: 'Body readings for Maya Torres' }).getByRole('radio', { name: 'Heart rate' });
  await expect(pulse).toHaveAccessibleDescription('Reading out of date');
  await page.getByRole('button', { name: 'Next event' }).click();
  await expect(page.getByText('Earth relay unavailable', { exact: true }).last()).toBeVisible();
  await page.getByRole('button', { name: 'Next event' }).click();
  await expect(pulse).toHaveAccessibleDescription(/bpm/);
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

  await page.getByRole('navigation').getByRole('link', { name: 'Health' }).click();
  const alerts = page.getByRole('region', { name: 'Alerts & follow-up' });
  const report = alerts.getByRole('link', { name: /Vision or balance concern/ });
  await expect(report).toContainText('Alex Morgan');
  await expect(report).toContainText('New');
  await report.click();
  await page.getByRole('button', { name: 'Start guided check' }).click();
  await page.getByRole('button', { name: 'Done · next step' }).click();
  await page.getByRole('button', { name: 'Done · next step' }).click();
  await expect(page.getByRole('heading', { name: 'Arrange follow-up' })).toBeVisible();
  await expect(page.getByLabel('Assigned crew member', { exact: true })).toHaveValue('');
  await page.getByRole('radio', { name: 'Verified', exact: true }).check();
  await page.getByRole('button', { name: 'Complete follow-up' }).click();
  await expect(page.getByText('Follow-up recorded as complete.')).toBeFocused();
  await page.getByRole('link', { name: 'Back to Health' }).click();
  await expect(report.getByText('Complete', { exact: true })).toBeVisible();
  await page.reload();
  await expect(report.getByText('Complete', { exact: true })).toBeVisible();
  await expect(alerts.getByRole('link', { name: /Cabin CO₂ change needs review/ })).toContainText('New');
});

test('Profiles shows all six crew and opens the selected telemetry snapshot', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?page=profiles');
  await page.getByRole('button', { name: 'Crew overview' }).click();
  await expect(page.getByRole('article')).toHaveCount(6);
  const maya = page.getByRole('article', { name: 'Maya Torres' });
  await expect(maya.getByText('Reading out of date').first()).toBeVisible();
  const overviewBody = maya.getByRole('group', { name: 'Body readings for Maya Torres' });
  await overviewBody.getByRole('radio', { name: 'Skin temperature' }).check();
  await expect(overviewBody.getByRole('radio', { name: 'Skin temperature' })).toHaveAccessibleDescription('Reading out of date');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await maya.getByRole('button', { name: 'View profile for Maya Torres' }).click();
  await expect(page.getByRole('heading', { name: 'Maya Torres' })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Telemetry snapshot' })).toBeVisible();
  const profileBody = page.getByRole('group', { name: 'Body readings for Maya Torres' });
  await profileBody.getByRole('radio', { name: 'Heart rate' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(profileBody.getByRole('radio', { name: 'Skin temperature' })).toBeChecked();
  await expect(profileBody.getByText(/A contact sensor reads skin temperature/)).toBeVisible();
});

test('The App guide is keyboard accessible and links to the working mission schedule', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'App guide', exact: true });
  const guide = page.getByRole('dialog', { name: 'App guide' });
  await trigger.press('Enter');
  await expect(guide.getByRole('heading', { name: 'App guide' })).toBeFocused();
  await guide.getByText('Verify a reading or sensor', { exact: true }).click();
  await expect(guide.getByRole('link', { name: 'Open Sensors' })).toBeVisible();
  const result = await new AxeBuilder({ page }).include('#bs-app-guide').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations.map(violation => violation.id)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(guide).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('link', { name: 'I need help' })).toBeVisible();
  await page.getByLabel('Trend indicator').selectOption('oxygen');
  await expect(page.getByRole('img', { name: 'Oxygen fraction trend in %' })).toBeVisible();
  await trigger.click();
  await guide.getByText('Follow mission routines', { exact: true }).click();
  await guide.getByRole('link', { name: 'Open mission schedule' }).click();
  await expect(page).toHaveURL(/by_star_profile=mission$/);
  await expect(page.getByRole('heading', { name: 'Mission health plan' })).toBeVisible();
  await expect(trigger).toBeVisible();
});

test('Sensors lists every device, links to the affected review and follows reconnection', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('link', { name: 'View sensors' }).click();
  const sensors = page.getByRole('region', { name: 'Sensors', exact: true });
  await expect(sensors.getByRole('article')).toHaveCount(12);
  await expect(sensors.getByText('11 of 12 devices with current readings')).toBeVisible();
  await expect(sensors.getByRole('article', { name: 'Habitat air monitor' }).getByText('CO₂ partial pressure')).toBeVisible();
  const wrist = sensors.getByRole('article', { name: 'Maya’s wrist monitor' });
  await expect(wrist.getByText('Reading out of date').first()).toBeVisible();
  await expect(wrist.getByText('06:41:18 UTC', { exact: true })).toBeVisible();
  await expect(wrist.getByText('06:41:19 UTC', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await wrist.getByRole('link', { name: 'Review sensor alert' }).click();
  await expect(page).toHaveURL(/by_star_work=signal-maya$/);
  await page.getByRole('region', { name: 'Mission content' }).getByText('Evidence and timing').click();
  await expect(page.getByText('Maya’s wrist monitor', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'View sensors' }).click();

  await page.getByRole('button', { name: 'Next event' }).click();
  await expect(sensors.getByText('Earth relay unavailable')).toBeVisible();
  await page.getByRole('button', { name: 'Next event' }).click();
  await expect(wrist.getByText('Current reading', { exact: true })).toBeVisible();
  await expect(wrist.getByText('06:42:36 UTC', { exact: true })).toBeVisible();
  await expect(sensors.getByText('12 of 12 devices with current readings')).toBeVisible();
  await expect(wrist.getByRole('link', { name: 'Review sensor alert' })).toBeVisible();
});

test('Core routes pass automated accessibility checks', async ({ page }) => {
  for (const [route, heading] of [['health', 'Crew health'], ['assist', 'Assist'], ['profiles&by_star_profile=sensors', 'Sensors'], ['profiles', 'Profiles']]) {
    await page.goto('/?page=' + route);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    const result = await new AxeBuilder({ page }).include('.bs-app').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(result.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([]);
  }
  await page.getByRole('button', { name: 'Crew overview' }).click();
  const overview = await new AxeBuilder({ page }).include('.bs-app').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(overview.violations.map(violation => violation.id)).toEqual([]);
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
  await page.getByRole('link', { name: 'View sensors' }).click();
  await expect(page).toHaveURL(/mission-health\/profiles\/\?by_star_profile=sensors$/);
  await expect(page.getByRole('heading', { name: 'Sensors', exact: true })).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Health' }).click();
  await page.getByRole('link', { name: 'Review incident' }).click();
  await expect(page).toHaveURL(/mission-health\/assist\/\?by_star_work=air-habitat$/);
  await expect(page.getByRole('heading', { name: 'Cabin CO₂ change needs review', exact: true })).toBeVisible();
});
