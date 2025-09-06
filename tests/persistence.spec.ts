import { test, expect } from '@playwright/test';

const STORAGE_KEY = 'clinician-plotter-lite';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  await page.reload();
});

test('visit task change persists after reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('clinicians-table')).toBeVisible();

  const firstTask = page.getByTestId('visitTask-c1');
  await firstTask.selectOption('PT Evaluation');

  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    try {
      const { clinicians } = JSON.parse(raw);
      return clinicians && clinicians[0]?.visitTask === 'PT Evaluation';
    } catch { return false; }
  }, STORAGE_KEY);

  await expect(firstTask).toHaveValue('PT Evaluation');

  await page.reload();
  await expect(page.getByTestId('visitTask-c1')).toHaveValue('PT Evaluation');
});

test('adding a clinician is saved', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Clinician' }).click();

  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    try {
      const { clinicians } = JSON.parse(raw);
      return Array.isArray(clinicians) && clinicians.length >= 3;
    } catch { return false; }
  }, STORAGE_KEY);

  const newName = page.getByTestId('name-c3');
  await expect(newName).toBeVisible();

  await newName.fill('Shiva RN');

  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    try {
      const { clinicians } = JSON.parse(raw);
      const c3 = clinicians?.find((c: any) => c.id === 'c3');
      return c3?.name === 'Shiva RN';
    } catch { return false; }
  }, STORAGE_KEY);

  await page.reload();
  await expect(page.getByTestId('name-c3')).toHaveValue('Shiva RN');
});
