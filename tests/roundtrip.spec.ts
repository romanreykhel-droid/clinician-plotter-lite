import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const STORAGE_KEY = 'clinician-plotter-lite';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate((k) => localStorage.removeItem(k), STORAGE_KEY);
  await page.reload();
});

test('Export then Import recreates the same table', async ({ page }, testInfo) => {
  await page.goto('/');

  // Make a couple of edits so this is non-trivial
  await page.getByRole('button', { name: 'Add Clinician' }).click();  // adds c3
  const c3 = page.getByTestId('name-c3');
  await c3.fill('Round Trip RN');
  await page.getByTestId('visitTask-c1').selectOption('PT Evaluation');

  // Export current state
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export' }).click(),
  ]);
  const exportPath = path.join(testInfo.outputDir, await download.suggestedFilename());
  await download.saveAs(exportPath);
  const exported = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));

  // Wipe the UI to prove import restores it
  await page.evaluate((k) => localStorage.removeItem(k), STORAGE_KEY);
  await page.reload();

  // Import the previously exported file
  const fileInput = page.locator('input[type="file"][accept="application/json"]');
  await fileInput.setInputFiles(exportPath);

  // UI assertions prove the table updated
  await expect(page.getByTestId('name-c3')).toHaveValue('Round Trip RN');
  await expect(page.getByTestId('visitTask-c1')).toHaveValue('PT Evaluation');

  // ✅ Wait until localStorage is populated and matches the exported length
  await page.waitForFunction(
    ([key, expectedLen]) => {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      try {
        const obj = JSON.parse(raw);
        return Array.isArray(obj?.clinicians) && obj.clinicians.length === expectedLen;
      } catch { return false; }
    },
    [STORAGE_KEY, exported.clinicians.length]
  );

  // Now safe to read and compare
  const raw = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);
  const after = JSON.parse(raw!);
  expect(Array.isArray(after.clinicians)).toBeTruthy();
  expect(after.clinicians.length).toBe(exported.clinicians.length);
});
