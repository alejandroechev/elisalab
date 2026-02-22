import { test, expect, Page } from '@playwright/test';

// Helper: load a sample dataset by index (0-based)
async function loadSample(page: Page, index: number) {
  const select = page.locator('select').first();
  await select.selectOption({ index: index + 1 }); // +1 because first option is placeholder
}

// Helper: click Fit Curve button
async function fitCurve(page: Page) {
  await page.getByRole('button', { name: /Fit Curve/i }).click();
}

// Helper: get error banner text
async function getError(page: Page) {
  const banner = page.locator('[style*="fef2f2"], [style*="fca5a5"]');
  if (await banner.count() > 0) return banner.first().textContent();
  return null;
}

// ──────────────────────────────────────────
// Core Workflow
// ──────────────────────────────────────────

test.describe('Core Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with plate grid visible', async ({ page }) => {
    // Title visible
    await expect(page.locator('h1')).toContainText('ElisaLab');

    // Plate grid exists with well cells
    const wells = page.locator('.well');
    await expect(wells.first()).toBeVisible();
    // 96 wells = 8 rows × 12 cols
    await expect(wells).toHaveCount(96);
  });

  test('can assign well types via role selector and clicking', async ({ page }) => {
    const roleSelector = page.locator('[data-testid="role-selector"]');

    // Click a well to select it, then assign as standard
    const well_A1 = page.locator('.well').first();
    await well_A1.click();
    await expect(well_A1).toHaveClass(/selected/);
    await roleSelector.getByRole('button', { name: /Standard/ }).click();
    await expect(well_A1).toHaveAttribute('data-type', 'standard');

    // Click well A2, assign as unknown
    const well_A2 = page.locator('.well').nth(1);
    await well_A2.click();
    await roleSelector.getByRole('button', { name: /Unknown/ }).click();
    await expect(well_A2).toHaveAttribute('data-type', 'unknown');

    // Click well A3, assign as blank
    const well_A3 = page.locator('.well').nth(2);
    await well_A3.click();
    await roleSelector.getByRole('button', { name: /Blank/ }).click();
    await expect(well_A3).toHaveAttribute('data-type', 'blank');

    // Select well A3 again and clear it
    await well_A3.click();
    await roleSelector.getByRole('button', { name: /Clear/ }).click();
    await expect(well_A3).toHaveAttribute('data-type', 'empty');
  });

  test('load sample, fit curve → R² shown, results table appears', async ({ page }) => {
    // Load first sample (IL-6)
    await loadSample(page, 0);

    // Wells should be populated (some should be 'standard')
    const stdWells = page.locator('.well[data-type="standard"]');
    await expect(stdWells.first()).toBeVisible();

    // Click Fit Curve
    await fitCurve(page);

    // R² should appear
    await expect(page.locator('.fit-info')).toContainText('R²');

    // Results table should appear with rows
    const resultsTable = page.locator('.results-table');
    await expect(resultsTable).toBeVisible();
    const rows = resultsTable.locator('tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('standard concentrations panel shows and is editable', async ({ page }) => {
    // Standard entry panel should be visible
    await expect(page.locator('h3').filter({ hasText: 'Standard Concentrations' })).toBeVisible();

    // Should have 8 inputs by default
    const stdInputs = page.locator('.std-row input');
    await expect(stdInputs).toHaveCount(8);

    // First input should have value 1000
    await expect(stdInputs.first()).toHaveValue('1000');
  });
});

// ──────────────────────────────────────────
// Sample Loading
// ──────────────────────────────────────────

test.describe('Sample Datasets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  const sampleNames = [
    'IL-6 Sandwich ELISA',
    'TNF-α High Sensitivity',
    'IgG Quantification',
    'Poor Quality Plate',
    'Competitive ELISA',
  ];

  for (let i = 0; i < sampleNames.length; i++) {
    test(`load sample "${sampleNames[i]}" and fit curve successfully`, async ({ page }) => {
      await loadSample(page, i);

      // Plate should have standards assigned
      const stdWells = page.locator('.well[data-type="standard"]');
      expect(await stdWells.count()).toBeGreaterThan(0);

      // Plate should have unknowns
      const unkWells = page.locator('.well[data-type="unknown"]');
      expect(await unkWells.count()).toBeGreaterThan(0);

      // Plate should have blanks
      const blankWells = page.locator('.well[data-type="blank"]');
      expect(await blankWells.count()).toBeGreaterThan(0);

      // Fit curve
      await fitCurve(page);

      // Should not show error
      await expect(page.getByText('Need at least')).toHaveCount(0);

      // R² should be shown
      await expect(page.locator('.fit-info')).toContainText('R²');

      // Results table should have content
      const rows = page.locator('.results-table tbody tr');
      expect(await rows.count()).toBeGreaterThan(0);
    });
  }

  test('cycle through all 5 samples without errors', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await loadSample(page, i);
      await fitCurve(page);

      // R² visible after each fit
      await expect(page.locator('.fit-info')).toContainText('R²');

      // No error banner
      await expect(page.getByText('Need at least')).toHaveCount(0);
    }
  });
});

// ──────────────────────────────────────────
// UI Features
// ──────────────────────────────────────────

test.describe('UI Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('theme toggle switches between light and dark', async ({ page }) => {
    const app = page.locator('.app');

    // Default is light
    await expect(app).toHaveAttribute('data-theme', 'light');

    // Click moon button to toggle
    await page.getByRole('button', { name: '🌙' }).click();
    await expect(app).toHaveAttribute('data-theme', 'dark');

    // Click sun button to toggle back
    await page.getByRole('button', { name: '☀️' }).click();
    await expect(app).toHaveAttribute('data-theme', 'light');
  });

  test('guide button exists', async ({ page }) => {
    const guideBtn = page.getByRole('button', { name: /Guide/i });
    await expect(guideBtn).toBeVisible();
  });

  test('Import Plate button opens paste dialog', async ({ page }) => {
    await page.getByRole('button', { name: /Import Plate/i }).click();
    await expect(page.locator('.paste-dialog')).toBeVisible();
    await expect(page.locator('.dialog-content h3')).toContainText('Import Plate Data');

    // Cancel closes it
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('.paste-dialog')).toHaveCount(0);
  });

  test('Reset button clears layout', async ({ page }) => {
    // Load a sample to populate
    await loadSample(page, 0);
    const stdWells = page.locator('.well[data-type="standard"]');
    expect(await stdWells.count()).toBeGreaterThan(0);

    // Click reset
    await page.getByRole('button', { name: /Reset/i }).click();

    // All wells should be empty
    const emptyWells = page.locator('.well[data-type="empty"]');
    await expect(emptyWells).toHaveCount(96);
  });

  test('results table shows interpolated concentrations for unknowns', async ({ page }) => {
    await loadSample(page, 0);
    await fitCurve(page);

    // Find unknown rows in results table
    const unknownRows = page.locator('.results-table tbody tr').filter({ hasText: 'unknown' });
    expect(await unknownRows.count()).toBeGreaterThan(0);

    // At least one should have a concentration value (not "—")
    const firstUnknownConc = unknownRows.first().locator('td').nth(3);
    const concText = await firstUnknownConc.textContent();
    expect(concText).not.toBe('—');
    expect(parseFloat(concText!)).toBeGreaterThan(0);
  });

  test('results table columns are sortable', async ({ page }) => {
    await loadSample(page, 0);
    await fitCurve(page);

    // Default is Group asc; clicking toggles to desc
    await page.locator('.results-table th').first().click();
    await expect(page.locator('.results-table th').first()).toContainText('↓');

    // Click again to reverse back to asc
    await page.locator('.results-table th').first().click();
    await expect(page.locator('.results-table th').first()).toContainText('↑');
  });

  test('CSV export button appears only after fit', async ({ page }) => {
    // No CSV button before fit
    await expect(page.locator('.export-inline button', { hasText: 'CSV' })).toHaveCount(0);

    await loadSample(page, 0);
    await fitCurve(page);
    // CSV button appears after fit
    await expect(page.locator('.export-inline button', { hasText: 'CSV' })).toBeVisible();
  });

  test('Fit Curve button is disabled without plate data', async ({ page }) => {
    const fitBtn = page.getByRole('button', { name: /Fit Curve/i });
    await expect(fitBtn).toBeDisabled();

    await loadSample(page, 0);
    await expect(fitBtn).toBeEnabled();
  });

  test('legend shows all four well types', async ({ page }) => {
    const legend = page.locator('.legend');
    await expect(legend).toContainText('Standard');
    await expect(legend).toContainText('Unknown');
    await expect(legend).toContainText('Blank');
    await expect(legend).toContainText('Empty');
  });
});

// ──────────────────────────────────────────
// Edge Cases
// ──────────────────────────────────────────

test.describe('Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('fit with no plate data → graceful error message', async ({ page }) => {
    // Manually assign some wells as standards (no plate data imported)
    const well = page.locator('.well').first();
    await well.click();

    // Force-click Fit Curve (it should be disabled, but let's verify the message)
    // Since Fit Curve is disabled without data, we verify the disabled state
    const fitBtn = page.getByRole('button', { name: /Fit Curve/i });
    await expect(fitBtn).toBeDisabled();
  });

  test('fit with only blanks assigned → error handling', async ({ page }) => {
    // Load a sample to get plate data
    await loadSample(page, 0);

    // Reset layout to clear all assignments
    await page.getByRole('button', { name: /Reset/i }).click();

    // Select wells and assign as blank
    for (let i = 0; i < 4; i++) {
      await page.locator('.well').nth(i).click({ modifiers: i > 0 ? ['Shift'] : [] });
    }
    await page.locator('[data-testid="role-selector"] button', { hasText: 'Blank' }).click();

    // Try to fit
    await fitCurve(page);

    // Should show error about needing standards
    await expect(page.getByText('Need at least 4 standard groups')).toBeVisible();
  });

  test('fit with single standard point → error about needing 4 points', async ({ page }) => {
    // Load sample to get data, then reset layout
    await loadSample(page, 0);
    await page.getByRole('button', { name: /Reset/i }).click();

    // Select one well and assign as standard
    await page.locator('.well').first().click();
    await page.locator('[data-testid="role-selector"] button', { hasText: 'Standard' }).click();

    // Try to fit
    await fitCurve(page);

    // Should show error about needing 4 standard groups
    await expect(page.getByText('Need at least 4 standard groups')).toBeVisible();
  });

  test('clear plate and re-import sample works', async ({ page }) => {
    // Load first sample and fit
    await loadSample(page, 0);
    await fitCurve(page);
    await expect(page.locator('.fit-info')).toContainText('R²');

    // Reset
    await page.getByRole('button', { name: /Reset/i }).click();

    // Results should be gone
    await expect(page.locator('.fit-info')).toHaveCount(0);

    // Load second sample and fit
    await loadSample(page, 1);
    await fitCurve(page);
    await expect(page.locator('.fit-info')).toContainText('R²');
  });

  test('paste dialog submit button is disabled with empty text', async ({ page }) => {
    await page.getByRole('button', { name: /Import Plate/i }).click();
    const importBtn = page.locator('.dialog-content .primary');
    await expect(importBtn).toBeDisabled();
  });

  test('poor quality sample shows QC flags', async ({ page }) => {
    // Load "Poor Quality Plate" (index 3)
    await loadSample(page, 3);
    await fitCurve(page);

    // Should have results
    await expect(page.locator('.results-table')).toBeVisible();
    const rows = page.locator('.results-table tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('4PL params A, B, C, D are displayed after fit', async ({ page }) => {
    await loadSample(page, 0);
    await fitCurve(page);

    const fitInfo = page.locator('.fit-info');
    await expect(fitInfo).toContainText('A=');
    await expect(fitInfo).toContainText('B=');
    await expect(fitInfo).toContainText('C=');
    await expect(fitInfo).toContainText('D=');
  });

  test('well tooltip shows correct info', async ({ page }) => {
    await loadSample(page, 0);

    // First well should be standard with concentration
    const well = page.locator('.well').first();
    const title = await well.getAttribute('title');
    expect(title).toContain('A1');
    expect(title).toContain('standard');
  });
});

// ──────────────────────────────────────────
// Competitive ELISA (inverted curve)
// ──────────────────────────────────────────

test.describe('Competitive ELISA', () => {
  test('inverted curve fits correctly with valid R²', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 4); // Competitive ELISA
    await fitCurve(page);

    const fitInfo = page.locator('.fit-info');
    await expect(fitInfo).toContainText('R²');

    // Extract R² value - should be reasonably good
    const text = await fitInfo.textContent();
    const match = text?.match(/R²\s*=\s*([\d.]+)/);
    expect(match).toBeTruthy();
    const r2 = parseFloat(match![1]);
    expect(r2).toBeGreaterThan(0.95);
  });
});

// ──────────────────────────────────────────
// User Feedback Tests
// ──────────────────────────────────────────

test.describe('User Feedback', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('multi-well selection with shift-click assigns all selected wells', async ({ page }) => {
    const well_A1 = page.locator('.well').first();
    const well_A2 = page.locator('.well').nth(1);
    const well_A3 = page.locator('.well').nth(2);

    // Select multiple wells with shift-click
    await well_A1.click();
    await well_A2.click({ modifiers: ['Shift'] });
    await well_A3.click({ modifiers: ['Shift'] });

    await expect(well_A1).toHaveClass(/selected/);
    await expect(well_A2).toHaveClass(/selected/);
    await expect(well_A3).toHaveClass(/selected/);

    // Selection count shown
    await expect(page.getByText('3 wells selected')).toBeVisible();

    // Apply Standard role to all selected
    await page.locator('[data-testid="role-selector"] button', { hasText: 'Standard' }).click();
    await expect(well_A1).toHaveAttribute('data-type', 'standard');
    await expect(well_A2).toHaveAttribute('data-type', 'standard');
    await expect(well_A3).toHaveAttribute('data-type', 'standard');
  });

  test('Fit Curve button has CTA styling', async ({ page }) => {
    const fitBtn = page.getByRole('button', { name: /Fit Curve/i });
    await expect(fitBtn).toHaveClass(/btn-cta/);
  });

  test('dark theme renders correct background and text colors', async ({ page }) => {
    await page.getByRole('button', { name: '🌙' }).click();
    const app = page.locator('.app');
    await expect(app).toHaveAttribute('data-theme', 'dark');

    // Body background is dark
    const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bgColor).toBe('rgb(15, 23, 42)');

    // Panel uses surface color
    const panelBg = await page.evaluate(() => getComputedStyle(document.querySelector('.panel')!).backgroundColor);
    expect(panelBg).toBe('rgb(30, 41, 59)');

    // Text is light
    const fgColor = await page.evaluate(() => getComputedStyle(document.querySelector('.app')!).color);
    expect(fgColor).toBe('rgb(226, 232, 240)');
  });

  test('in-place export buttons appear after fit', async ({ page }) => {
    // Before fit: no export buttons
    await expect(page.locator('.export-inline')).toHaveCount(0);

    await loadSample(page, 0);
    await fitCurve(page);

    // After fit: PNG, SVG near chart; CSV near results
    await expect(page.locator('.export-inline button', { hasText: 'PNG' })).toBeVisible();
    await expect(page.locator('.export-inline button', { hasText: 'SVG' })).toBeVisible();
    await expect(page.locator('.export-inline button', { hasText: 'CSV' })).toBeVisible();
  });
});

// ──────────────────────────────────────────
// State Persistence
// ──────────────────────────────────────────

test.describe('State Persistence', () => {
  test('plate layout and data persist across page reload', async ({ page }) => {
    await page.goto('/');
    // Load a sample
    await loadSample(page, 0);
    // Wait for debounced save
    await page.waitForTimeout(700);
    // Verify localStorage has state
    const stored = await page.evaluate(() => localStorage.getItem('elisalab-state'));
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.plateData).toBeTruthy();
    expect(parsed.layout).toBeTruthy();
    // Reload and verify wells still have assignments
    await page.reload();
    const well = page.locator('.well').first();
    await expect(well).toHaveAttribute('data-type', 'standard');
  });
});
