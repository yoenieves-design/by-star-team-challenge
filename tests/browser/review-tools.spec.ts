import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

test('A completed sensor review stays pending while the source is stale and can be reopened', async ({ page }) => {
  await page.goto('/?page=assist&by_star_work=signal-maya');
  await page.getByRole('button', { name: 'Start guided check' }).click();
  await page.getByRole('button', { name: 'Done · next step' }).click();
  await page.getByRole('button', { name: 'Done · next step' }).click();
  await expect(page.getByRole('button', { name: 'Complete follow-up' })).toBeDisabled();
  await page.getByRole('radio', { name: 'Unable to verify', exact: true }).check();
  await page.getByRole('button', { name: 'Complete follow-up' }).click();
  await expect(page.getByText('Reading issue remains', { exact: true }).first()).toBeVisible();
  await page.getByRole('link', { name: 'Back to Health' }).click();
  const alert = page.getByRole('region', { name: 'Alerts & follow-up' }).getByRole('link', { name: /Wrist monitor needs a check/ });
  await expect(alert).toContainText('Follow-up pending');
  await alert.click();
  await page.getByRole('button', { name: 'Start another review' }).click();
  await expect(page.getByRole('heading', { name: 'Identify the monitor' })).toBeVisible();
  await page.getByRole('region', { name: 'Mission content' }).getByText('Follow-up history', { exact: true }).click();
  await expect(page.getByText('Alex Morgan · Unable to verify')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Identify the monitor' })).toBeVisible();
});

test('A recovery routine requires a saved check-in and a concern retains its answers', async ({ page }) => {
  await page.goto('/?page=assist&by_star_work=task-alex-recovery');
  await page.getByRole('button', { name: 'Start guided check' }).click();
  await page.getByRole('button', { name: 'Done · next step' }).click();
  await expect(page.getByRole('button', { name: 'Done · next step' })).toBeDisabled();
  await page.getByRole('link', { name: 'Open Health to record a Quick check-in' }).click();
  await expect(page.getByRole('heading', { name: 'Quick check-in', exact: true })).toBeFocused();
  await page.getByRole('region', { name: 'Quick check-in', exact: true }).getByText('Record a check-in', { exact: true }).click();
  await page.getByLabel('Rest since your last sleep period').selectOption('poor');
  await page.getByLabel('Current fatigue').selectOption('high');
  await page.getByLabel('Concern to report').selectOption('Vision or balance concern');
  await page.getByLabel('If there is a concern, when did it begin?').selectOption('earlier');
  await page.getByRole('button', { name: 'Save check-in' }).click();
  await expect(page.getByText('Crew-reported · 06:41:48 UTC')).toBeVisible();
  await page.reload();
  await page.getByRole('link', { name: 'Open reported concern' }).click();
  await page.getByRole('region', { name: 'Mission content' }).getByText('Evidence and timing', { exact: true }).click();
  await expect(page.getByText(/Rest: poor · Fatigue: high · Concern began: earlier/)).toBeVisible();
  await page.goto('/?page=assist&by_star_work=task-alex-recovery');
  await expect(page.getByRole('button', { name: 'Done · next step' })).toBeEnabled();
  await page.getByRole('button', { name: 'Done · next step' }).click();
  await page.getByRole('radio', { name: 'Further review needed', exact: true }).check();
  await page.getByRole('button', { name: 'Complete follow-up' }).click();
  await page.getByRole('region', { name: 'Mission content' }).getByText('Review summary', { exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download review JSON' }).click();
  const file = await (await download).path();
  const summary = JSON.parse(await readFile(file!, 'utf8'));
  expect(summary.reviewOutcome).toBe('further-review');
  expect(summary.crew[0].checkIns[0].fatigue).toBe('high');
  expect(summary.snapshotUtc).toBe('2034-11-05T06:41:48.000Z');
});

test('A held clinical report cannot be reviewed; correction preserves history and requires the medical officer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByLabel('Active crew member').selectOption('maya');
  await page.getByRole('button', { name: 'View clinical checks', exact: true }).click();
  const clinical = page.getByRole('region', { name: 'Clinical checks', exact: true });
  await expect(clinical.getByText('Report held', { exact: true })).toBeVisible();
  await clinical.getByRole('link', { name: 'Inspect held report' }).click();
  await expect(page.getByRole('button', { name: 'Start guided check' })).toBeDisabled();
  await expect(page.getByText('Urine specific gravity', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('navigation').getByRole('link', { name: 'Health' }).click();
  for (let n = 0; n < 3; n++) await page.getByRole('button', { name: 'Next event' }).click();
  await page.getByRole('button', { name: 'View clinical checks', exact: true }).click();
  await expect(clinical.getByText('Ready for medical review')).toBeVisible();
  await clinical.getByText('Report details and revision history', { exact: true }).click();
  await expect(clinical.getByText('Supersedes revision 1')).toBeVisible();
  await expect(clinical.getByText('Superseded report')).toBeVisible();
  await clinical.getByRole('link', { name: 'View review' }).click();
  await expect(page.getByRole('button', { name: 'Start guided check' })).toBeDisabled();
  await page.getByLabel('Active crew member').selectOption('noah');
  await page.getByRole('button', { name: 'Start guided check' }).click();
  await page.getByRole('button', { name: 'Done · next step' }).click();
  await page.getByRole('radio', { name: 'Further review needed', exact: true }).check();
  await page.getByRole('button', { name: 'Complete follow-up' }).click();
  await page.getByRole('region', { name: 'Mission content' }).getByText('Review summary', { exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download review JSON' }).click();
  const file = await (await download).path();
  const summary = JSON.parse(await readFile(file!, 'utf8'));
  expect(summary.clinicalEvidence.report.revision).toBe(2);
  expect(summary.clinicalEvidence.priorRevisions[0].status).toBe('held');
  expect(summary.clinicalEvidence.order.crewId).toBe('maya');
  expect(summary.actions.at(-1).actorId).toBe('noah');
  const result = await new AxeBuilder({ page }).include('.bs-app').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations.map(item => item.id)).toEqual([]);
});

test('The walkthrough preserves the original replay and moves through the five scenes', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Active crew member').selectOption('yoe');
  await page.getByRole('button', { name: 'Next event' }).click();
  await page.getByRole('button', { name: 'App guide', exact: true }).click();
  await page.getByRole('button', { name: 'Explore the post-EVA case' }).click();
  await expect(page.getByRole('heading', { name: 'Meet the returning crew' })).toBeVisible();
  await expect(page.getByLabel('Active crew member')).toHaveValue('maya');
  await expect(page.getByRole('progressbar', { name: 'Replay progress' })).toHaveAttribute('value', '108');
  for (const title of ['Verify the input', 'Inspect the clinical check', 'Review and request support', 'Confirm the handoff']) {
    await page.getByRole('button', { name: 'Next walkthrough step' }).click();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('heading', { name: 'Crew concern reported' })).toBeVisible();
  await page.getByRole('button', { name: 'Return to my replay' }).click();
  await expect(page.getByLabel('Active crew member')).toHaveValue('yoe');
  await expect(page.getByRole('progressbar', { name: 'Replay progress' })).toHaveAttribute('value', '120');
});

test('Voice recognition is opt-in and requires explicit confirmation before navigation', async ({ page }) => {
  await page.addInitScript(() => {
    class DemoRecognition {
      onresult?: (event: unknown) => void;
      start() { this.onresult?.({ results: [{ isFinal: true, 0: { transcript: 'Open Sensors' } }] }); }
      abort() {}
    }
    Object.defineProperty(window, 'SpeechRecognition', { value: DemoRecognition, configurable: true });
  });
  await page.goto('/');
  await page.locator('.bs-voice-controls summary').click();
  await expect(page.locator('.bs-voice-controls').getByText('Heard', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Talk to BY STAR' }).click();
  await expect(page.locator('.bs-voice-controls').getByText('Heard', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Crew health', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Run command' }).click();
  await expect(page.getByRole('heading', { name: 'Sensors', exact: true })).toBeVisible();
});

test('A failed clinical feed keeps telemetry available and reports the missing input', async ({ page }) => {
  await page.route('**/data/clinical-results.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto('/?page=health&by_star_health=personal');
  await expect(page.getByRole('heading', { name: 'Crew health', exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Body readings for Alex Morgan' })).toBeVisible();
  await expect(page.getByText(/Clinical feed unavailable/)).toBeVisible();
});
