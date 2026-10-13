import { test, expect } from '@playwright/test';

// Mission 1 — Auth e2e : page de connexion, login/démo, déconnexion.
// L'app utilise un état local Zustand (pas de JWT) pour la démo — les boutons
// démo court-circuitent le formulaire et positionnent l'utilisateur courant.

const DEMO_LABELS = ['Bénéficiaire', 'SINERGI SA', 'E2A'] as const;

async function gotoLogin(page: import('@playwright/test').Page) {
  await page.goto('/');
  // Attend que la carte de connexion soit montée (titre "SAVERDEV").
  await expect(page.getByText('SAVERDEV', { exact: true }).first()).toBeVisible();
}

test.describe('Auth — page de connexion', () => {
  test('Page de connexion s\'affiche avec 3 boutons de comptes démo', async ({ page }) => {
    await gotoLogin(page);

    // Le sous-titre "Comptes démo" sépare le formulaire des boutons démo.
    await expect(page.getByText('Comptes démo')).toBeVisible();

    // On identifie la grille contenant les boutons démo (grid-cols-2).
    const demoGrid = page.locator('div.grid.grid-cols-2').first();
    const demoButtons = demoGrid.getByRole('button');
    await expect(demoButtons).toHaveCount(3);

    // Vérifie que les 3 rôles attendus sont bien représentés.
    for (const label of DEMO_LABELS) {
      await expect(demoGrid.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test('Connexion en Bénéficiaire redirige vers le tableau de bord', async ({ page }) => {
    await gotoLogin(page);
    const demoGrid = page.locator('div.grid.grid-cols-2').first();
    await demoGrid.getByRole('button', { name: /Bénéficiaire/ }).click();

    // Le header affiche le titre de la vue courante = "Tableau de bord".
    await expect(page.locator('header h1', { hasText: 'Tableau de bord' })).toBeVisible();
    // Le footer confirme que l'app est chargée.
    await expect(page.getByText(/Sahel Vert/i).first()).toBeVisible();
  });

  test('Connexion en E2A redirige vers le tableau de bord', async ({ page }) => {
    await gotoLogin(page);
    const demoGrid = page.locator('div.grid.grid-cols-2').first();
    await demoGrid.getByRole('button', { name: /E2A/ }).click();

    await expect(page.locator('header h1', { hasText: 'Tableau de bord' })).toBeVisible();
    // E2A a accès à la vue Validations — elle doit être présente dans la sidebar.
    await expect(page.locator('aside').getByText('Validations', { exact: true })).toBeVisible();
  });

  test('Déconnexion ramène à la page de connexion', async ({ page }) => {
    await gotoLogin(page);
    const demoGrid = page.locator('div.grid.grid-cols-2').first();
    await demoGrid.getByRole('button', { name: /E2A/ }).click();
    await expect(page.locator('header h1', { hasText: 'Tableau de bord' })).toBeVisible();

    // Le bouton de déconnexion est dans le header (aria-label).
    await page.getByRole('button', { name: 'Se déconnecter' }).first().click();

    // De retour sur la page de connexion : le formulaire email/mot de passe est là.
    // On cible l'input directement (le bouton "Afficher le mot de passe" a aussi
    // aria-label contenant "Mot de passe" — d'où le sélecteur précis).
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
  });
});
