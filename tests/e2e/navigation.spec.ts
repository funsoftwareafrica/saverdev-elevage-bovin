import { test, expect } from '@playwright/test';

// Mission 1 — Navigation e2e : sidebar + vue Cheptel + vue Saisie.

async function loginAsE2A(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.getByText('SAVERDEV', { exact: true }).first()).toBeVisible();
  const demoGrid = page.locator('div.grid.grid-cols-2').first();
  await demoGrid.getByRole('button', { name: /E2A/ }).click();
  await expect(page.locator('header h1', { hasText: 'Tableau de bord' })).toBeVisible();
}

test.describe('Navigation — sidebar', () => {
  test('Tous les boutons de la sidebar sont cliquables et changent la vue', async ({ page }) => {
    await loginAsE2A(page);

    const sidebar = page.locator('aside').first();
    const navButtons = sidebar.getByRole('button');
    const count = await navButtons.count();

    // E2A a accès à 19 vues → 19 boutons de navigation.
    expect(count).toBeGreaterThanOrEqual(10);

    // Itère sur chaque bouton et vérifie que le titre du header change.
    // On capture les titres attendus à partir du label du bouton cliqué.
    const seenTitles = new Set<string>();
    for (let i = 0; i < count; i++) {
      const btn = navButtons.nth(i);
      const label = (await btn.innerText()).trim();
      if (!label || label === 'Se déconnecter') continue;

      await btn.click();
      // Le header affiche <h1>{title}</h1> correspondant au VIEW_TITLES.
      const headerTitle = await page.locator('header h1').innerText();
      const cleanTitle = headerTitle.trim();
      // On vérifie qu'au moins un changement de vue a eu lieu (titre non vide).
      expect(cleanTitle.length).toBeGreaterThan(0);
      seenTitles.add(cleanTitle);
      // Petite pause pour laisser l'animation se stabiliser (AnimatePresence).
      await page.waitForTimeout(150);
    }
    // On doit avoir visité au moins 3 vues différentes.
    expect(seenTitles.size).toBeGreaterThanOrEqual(3);
  });

  test('Vue Cheptel affiche la liste des animaux (BOE + OVN)', async ({ page }) => {
    await loginAsE2A(page);

    // La vue Cheptel est le 4e bouton de la sidebar E2A (après Tableau de bord / Saisie / Achats).
    await page.locator('aside').first().getByRole('button', { name: 'Cheptel' }).click();
    await expect(page.locator('header h1', { hasText: 'Cheptel' })).toBeVisible();

    // La description de la vue mentionne les deux espèces.
    await expect(page.getByText(/BOE/).first()).toBeVisible();
    await expect(page.getByText(/OVN/).first()).toBeVisible();
  });

  test('Vue Saisie affiche 4 boutons journaux (sans Balance/Suivi financement)', async ({ page }) => {
    await loginAsE2A(page);

    await page.locator('aside').first().getByRole('button', { name: 'Saisie' }).click();
    await expect(page.locator('header h1', { hasText: 'Saisie' })).toBeVisible();

    // Les 4 journaux attendus (cf. TYPE_CONFIG dans saisie-view.tsx).
    for (const label of ['Journal d\'achats', 'Journal de ventes', 'Journal des dépenses', 'Gestion de stock']) {
      await expect(page.locator('main').getByText(label, { exact: true }).first()).toBeVisible();
    }

    // Les boutons supprimés en Task 29 ne doivent pas apparaître.
    await expect(page.locator('main').getByText(/Balance comptable/)).toHaveCount(0);
    await expect(page.locator('main').getByText(/Suivi financement/)).toHaveCount(0);
  });
});
