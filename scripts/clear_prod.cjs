const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  console.log('=== ÉTAT ACTUEL (Neon Postgres prod) ===');
  const tables = {
    User: await db.user.count(),
    Parametre: await db.parametre.count(),
    Bovin: await db.bovin.count(),
    Alimentation: await db.alimentation.count(),
    AlimentationBovin: await db.alimentationBovin.count(),
    Depense: await db.depense.count(),
    DepenseBovin: await db.depenseBovin.count(),
    Financement: await db.financement.count(),
    Echeance: await db.echeance.count(),
    Alerte: await db.alerte.count(),
    Historique: await db.historique.count(),
    Pese: await db.pese.count(),
    Paturage: await db.paturage.count(),
    Soin: await db.soin.count(),
    Notification: await db.notification.count(),
    Backup: await db.backup.count(),
    Validation: await db.validation.count(),
    StockMouvement: await db.stockMouvement.count(),
    CapitalMouvement: await db.capitalMouvement.count(),
    Tag: await db.tag.count(),
    Photo: await db.photo.count(),
  };
  for (const [t, n] of Object.entries(tables)) {
    console.log(`  ${t}: ${n}`);
  }

  console.log('\n=== VIDAGE DES DONNÉES (Prisma transactions) ===');
  // Ordre pour respecter les foreign keys (enfants d'abord)
  const tablesToClear = [
    'photo', 'tag',
    'capitalMouvement', 'stockMouvement', 'validation', 'backup', 'notification',
    'soin', 'paturage', 'pese',
    'historique', 'alerte', 'echeance', 'financement',
    'depenseBovin', 'depense', 'alimentationBovin', 'alimentation', 'bovin'
  ];
  for (const t of tablesToClear) {
    try {
      const result = await db[t].deleteMany({});
      console.log(`  ✓ ${t} vidé (${result.count} supprimés)`);
    } catch (e) {
      console.log(`  ⚠ ${t}: ${e.message}`);
    }
  }

  // Garder uniquement capital_initial dans Parametre
  console.log('\n=== NETTOYAGE PARAMETRE ===');
  await db.parametre.deleteMany({ where: { NOT: { cle: 'capital_initial' } } });
  const params = await db.parametre.findMany();
  console.log('  Parametres restants:', JSON.stringify(params, null, 2));

  // Vérification users conservés
  console.log('\n=== USERS (conservés) ===');
  const users = await db.user.findMany({ select: { email: true, name: true, role: true } });
  console.log(JSON.stringify(users, null, 2));

  // État final
  console.log('\n=== ÉTAT FINAL (prod) ===');
  const finalCounts = {
    Bovin: await db.bovin.count(),
    Alimentation: await db.alimentation.count(),
    Depense: await db.depense.count(),
    Financement: await db.financement.count(),
    Echeance: await db.echeance.count(),
    Alerte: await db.alerte.count(),
    Historique: await db.historique.count(),
    Pese: await db.pese.count(),
    Paturage: await db.paturage.count(),
    Soin: await db.soin.count(),
    Notification: await db.notification.count(),
    Backup: await db.backup.count(),
    Validation: await db.validation.count(),
    StockMouvement: await db.stockMouvement.count(),
    CapitalMouvement: await db.capitalMouvement.count(),
    Parametre: await db.parametre.count(),
    User: await db.user.count(),
  };
  for (const [t, n] of Object.entries(finalCounts)) {
    console.log(`  ${t}: ${n}`);
  }
}

main().catch(console.error).finally(() => db.$disconnect());
