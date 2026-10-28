// Helper commun aux tests e2e : connexion manuelle via formulaire (email + password).
// Les boutons démo ont été supprimés de la page de connexion (production-ready).
import { Page, expect } from '@playwright/test';

export const TEST_USERS = {
  beneficiaire: { email: 'beneficiaire@saverdev.org', password: 'demo', name: 'Bénéficiaire' },
  e2a: { email: 'e2a@saverdev.org', password: 'demo', name: 'E2A' },
  sinergi: { email: 'sinergi@saverdev.org', password: 'demo', name: 'SINERGI SA' },
} as const;

export async function loginManual(page: Page, email: string, password: string = 'demo') {
  await page.goto('/');
  await page.locator('input#email').fill(email);
  await page.locator('input#password').fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
  await expect(page.getByRole('heading', { level: 1, name: /tableau de bord/i })).toBeVisible({ timeout: 15000 });
}

export async function loginAsBeneficiaire(page: Page) {
  await loginManual(page, TEST_USERS.beneficiaire.email, TEST_USERS.beneficiaire.password);
}

export async function loginAsE2A(page: Page) {
  await loginManual(page, TEST_USERS.e2a.email, TEST_USERS.e2a.password);
}

export async function loginAsSinergi(page: Page) {
  await loginManual(page, TEST_USERS.sinergi.email, TEST_USERS.sinergi.password);
}
