import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const STORAGE_KEY = 'clinician-plotter-lite';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate((k) => localStorage.removeItem(k), STORAGE_KEY);
  await page.reload();
});

test('Import JSON updates the table', async ({ page }, testInfo) => {
  await page.goto('/');

  const fixture = {
    version: 1,
    clinicians: [
      { id: 'c10', name: 'RN Alice', discipline: 'RN',  startTime: '08:00', endTime: '16:30', visitTask: 'RN Wound Care' },
      { id: 'c11', name: 'LVN Bob',  discipline: 'LVN', startTime: '09:00', endTime: '17:00', visitTask: 'LVN Wound Care' }
    ]
  };

  // Ensure path exists for this test
  const jsonPath = testInfo.outputPath('clinicians_import.json');
  fs.writeFileSync(jsonPath, JSON.stringify(fixture, null, 2));

  const fileInput = page.locator('input[type="file"][accept="application/json"]');
  await fileInput.setInputFiles(jsonPath);

  await expect(page.getByTestId('name-c10')).toHaveValue('RN Alice');
  await expect(page.getByTestId('name-c11')).toHaveValue('LVN Bob');

  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    try {
      const { clinicians } = JSON.parse(raw);
      return Array.isArray(clinicians) && clinicians.some((c:any)=>c.id==='c10');
    } catch { return false; }
  }, STORAGE_KEY);
});

test('Export JSON downloads current table state', async ({ page }, testInfo) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Add Clinician' }).click();
  const newName = page.getByTestId('name-c3');
  await newName.fill('Export Me RN');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export' }).click(),
  ]);

  const savePath = path.join(testInfo.outputDir, await download.suggestedFilename());
  await download.saveAs(savePath);
  const exported = JSON.parse(fs.readFileSync(savePath, 'utf-8'));

  expect(exported.version).toBe(1);
  expect(Array.isArray(exported.clinicians)).toBeTruthy();
  const c3 = exported.clinicians.find((c: any) => c.id === 'c3');
  expect(c3?.name).toBe('Export Me RN');
});
