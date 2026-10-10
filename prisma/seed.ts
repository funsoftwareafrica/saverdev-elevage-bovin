// Seed script — peupler la base SQLite avec des données réalistes SAVERDEV.
// Lancez avec : bun run db:seed

import { PrismaClient, StatutBovin, StatutEcheance, Role } from "@prisma/client";
import { MOCK_BOVINS, MOCK_ALIMENTATIONS, MOCK_DEPENSES, MOCK_FINANCEMENT, MOCK_ALERTES, MOCK_HISTORIQUES } from "../src/lib/mock-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Début du seed SAVERDEV...");

  // Nettoyage (ordre respectant les foreign keys)
  await prisma.historique.deleteMany();
  await prisma.alerte.deleteMany();
  await prisma.echeance.deleteMany();
  await prisma.financement.deleteMany();
  await prisma.depenseBovin.deleteMany();
  await prisma.depense.deleteMany();
  await prisma.alimentationBovin.deleteMany();
  await prisma.alimentation.deleteMany();
  await prisma.bovin.deleteMany();
  await prisma.user.deleteMany();
  console.log("  OK Tables nettoyées");

  // ---- Users (4 rôles) ----
  const users = await Promise.all([
    prisma.user.create({ data: { email: "beneficiaire@saverdev.org", name: "Bénéficiaire 1", role: Role.BENEFICIAIRE, password: "demo" } }),
    prisma.user.create({ data: { email: "sinergi@saverdev.org", name: "SINERGI SA", role: Role.SINERGI, password: "demo" } }),
    prisma.user.create({ data: { email: "e2a@saverdev.org", name: "E2A", role: Role.E2A, password: "demo" } }),
  ]);
  console.log(`  OK ${users.length} utilisateurs créés (4 rôles)`);

  // ---- Bovins ----
  const bovinIdMap = new Map<string, string>(); // mockId -> dbId
  for (const b of MOCK_BOVINS) {
    const created = await prisma.bovin.create({
      data: {
        identifiant: b.identifiant,
        race: b.race,
        sexe: b.sexe,
        dateAchat: new Date(b.dateAchat),
        prixAchat: b.prixAchat,
        poidsAchat: b.poidsAchat,
        statut: b.statut as StatutBovin,
        dateVente: b.dateVente ? new Date(b.dateVente) : null,
        prixVente: b.prixVente,
        coutsEngraissement: b.coutsEngraissement,
        autresCouts: b.autresCouts,
        clientVente: b.clientVente,
      },
    });
    bovinIdMap.set(b.id, created.id);
  }
  console.log(`  OK ${MOCK_BOVINS.length} bovins créés (BOE-001 à BOE-015, OVN-001 à OVN-005)`);

  // ---- Alimentations + imputation par tête ----
  // Pour la démo, on impute aux N premiers bovins actifs/vendus
  const allBovinsArr = [...MOCK_BOVINS];
  for (const a of MOCK_ALIMENTATIONS) {
    const created = await prisma.alimentation.create({
      data: {
        date: new Date(a.date),
        produit: a.produit,
        quantite: a.quantite,
        unite: a.unite,
        coutTotal: a.coutTotal,
        nbBovinsConcernes: a.nbBovinsConcernes,
        coutParTete: a.coutParTete,
        commentaire: a.commentaire,
      },
    });
    // Lier aux N premiers bovins du mock
    const concerned = allBovinsArr.slice(0, a.nbBovinsConcernes);
    await prisma.alimentationBovin.createMany({
      data: concerned.map((b) => ({
        alimentationId: created.id,
        bovinId: bovinIdMap.get(b.id)!,
        partImputee: a.coutParTete,
      })),
    });
  }
  console.log(`  OK ${MOCK_ALIMENTATIONS.length} alimentations créées (avec imputation par tête)`);

  // ---- Dépenses ----
  for (const d of MOCK_DEPENSES) {
    const created = await prisma.depense.create({
      data: {
        date: new Date(d.date),
        categorie: d.categorie,
        libelle: d.libelle,
        montant: d.montant,
        nbBovinsConcernes: d.nbBovinsConcernes,
      },
    });
    // Si nbBovinsConcernes > 0, lier aux N premiers
    if (d.nbBovinsConcernes > 0) {
      const concerned = allBovinsArr.slice(0, d.nbBovinsConcernes);
      const part = d.montant / d.nbBovinsConcernes;
      await prisma.depenseBovin.createMany({
        data: concerned.map((b) => ({
          depenseId: created.id,
          bovinId: bovinIdMap.get(b.id)!,
          partImputee: part,
        })),
      });
    }
  }
  console.log(`  OK ${MOCK_DEPENSES.length} dépenses créées`);

  // ---- Financement + échéances ----
  const fin = await prisma.financement.create({
    data: {
      bailleur: MOCK_FINANCEMENT.bailleur,
      montantFinance: MOCK_FINANCEMENT.montantFinance,
      dateOctroi: new Date(MOCK_FINANCEMENT.dateOctroi),
      tauxInteret: MOCK_FINANCEMENT.tauxInteret,
      dureeMois: MOCK_FINANCEMENT.dureeMois,
    },
  });
  for (const e of MOCK_FINANCEMENT.echeances) {
    await prisma.echeance.create({
      data: {
        financementId: fin.id,
        numero: e.numero,
        datePrevue: new Date(e.datePrevue),
        montant: e.montant,
        statut: e.statut as StatutEcheance,
        datePayee: e.datePayee ? new Date(e.datePayee) : null,
      },
    });
  }
  console.log(`  OK Financement ${MOCK_FINANCEMENT.bailleur} (${MOCK_FINANCEMENT.montantFinance} FCFA) + ${MOCK_FINANCEMENT.echeances.length} échéances`);

  // ---- Alertes ----
  for (const a of MOCK_ALERTES) {
    await prisma.alerte.create({
      data: {
        date: new Date(a.date),
        type: a.type,
        severite: a.severite,
        message: a.message,
        resolved: a.resolved,
      },
    });
  }
  console.log(`  OK ${MOCK_ALERTES.length} alertes créées`);

  // ---- Historique ----
  const gerant = users[1]; // Aïssa
  const eleveur = users[0]; // Moussa
  for (const h of MOCK_HISTORIQUES) {
    const userId = h.user?.name === "Bénéficiaire 2" ? gerant.id : h.user?.name === "Bénéficiaire 1" ? eleveur.id : null;
    await prisma.historique.create({
      data: {
        date: new Date(h.date),
        userId,
        action: h.action,
        entiteType: h.entiteType,
        entiteId: h.entiteId,
        details: h.details,
      },
    });
  }
  console.log(`  OK ${MOCK_HISTORIQUES.length} entrées d'historique créées`);

  console.log("\nSeed terminé avec succès !");
  console.log("   Comptes démo :");
  console.log("   - beneficiaire@saverdev.org / demo");
  console.log("   - beneficiaire2@saverdev.org / demo");
  console.log("   - sinergi@saverdev.org / demo");
  console.log("   - e2a@saverdev.org / demo");
}

main()
  .catch((e) => {
    console.error("Erreur de seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
