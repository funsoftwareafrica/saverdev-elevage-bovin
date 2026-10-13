import { test, expect } from '@playwright/test';

// Mission 1 — Capital e2e : rapport bailleur (Section B/C/D).
// On se connecte en SINERGI (lecture seule, accès au rapport bailleur).

async function loginAsSinergi(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.getByText('SAVERDEV', { exact: true }).first()).toBeVisible();
  const demoGrid = page.locator('div.grid.grid-cols-2').first();
  await demoGrid.getByRole('button', { name: /SINERGI SA/ }).click();
  await expect(page.locator('header h1', { hasText: 'Tableau de bord' })).toBeVisible();
}

async function openRapportBailleur(page: import('@playwright/test').Page) {
  await loginAsSinergi(page);
  await page.locator('aside').first().getByRole('button', { name: 'Rapport bailleur' }).click();
  await expect(page.locator('header h1', { hasText: 'Rapport bailleur' })).toBeVisible();
  // Attend que la data soit chargée (la section B contient "Capital initial (figé)").
  await expect(page.getByText(/capital initial \(figé\)/i)).toBeVisible();
}

// 14 775 000 FCFA affiché via Intl.NumberFormat("fr-FR") = "14 775 000 FCFA"
// (séparateurs de milliers en espaces insécables \u00A0).
const CAPITAL_REGEX = /14[ \u00A0\u202F]?775[ \u00A0\u202F]?000\s?FCFA/u;

test.describe('Rapport bailleur — Sections B, C, D', () => {
  test('Vue Rapport bailleur affiche CAPITAL INITIAL (FIGÉ) avec 14 775 000 FCFA', async ({ page }) => {
    await openRapportBailleur(page);

    // Le libellé est en CSS uppercase → le DOM contient la casse mixte
    // "Capital initial (figé)". On le matche en insensible à la casse.
    await expect(page.getByText(/capital initial \(figé\)/i)).toBeVisible();

    // Le montant 14 775 000 FCFA est affiché juste en dessous.
    await expect(page.getByText(CAPITAL_REGEX)).toBeVisible();
  });

  test('Section Suivi budgétaire avec colonnes Poste/Prévision/Réel/Écart/%', async ({ page }) => {
    await openRapportBailleur(page);

    // Le titre de la section C contient "Suivi budgétaire".
    await expect(page.getByText(/Suivi budgétaire/).first()).toBeVisible();

    // La table budget contient les 5 colonnes attendues dans l'en-tête.
    const tableHeaders = page.locator('main th');
    for (const col of ['Poste', 'Prévision', 'Réel', 'Écart', '%']) {
      await expect(tableHeaders.filter({ hasText: col })).toHaveCount(1);
    }
  });

  test('Section Dépenses d\'investissement en immobilisations visible', async ({ page }) => {
    await openRapportBailleur(page);

    // Le titre de la section D doit être présent.
    await expect(page.getByText(/Dépenses d'investissement en immobilisations/i).first()).toBeVisible();
    // Et le bouton d'ajout d'investissement doit être présent (zone no-print).
    await expect(page.locator('main').getByRole('button', { name: /Ajouter une dépense d'investissement/i })).toBeVisible();
  });
});
