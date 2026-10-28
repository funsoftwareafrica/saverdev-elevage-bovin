const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  console.log('=== VIDAGE NEON POSTGRES ===\n');
  
  // État actuel
  const counts = {
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
    Parametre: await db.parametre.count(),
    User: await db.user.count(),
  };
  console.log('Avant:');
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);
  
  // Vider tout SAUF User et Parametre (capital_initial)
  console.log('\nVidage...');
  const order = [
    'photo', 'tag', 'capitalMouvement', 'stockMouvement', 'validation', 
    'backup', 'notification', 'soin', 'paturage', 'pese',
    'historique', 'alerte', 'echeance', 'financement',
    'depenseBovin', 'depense', 'alimentationBovin', 'alimentation', 'bovin'
  ];
  for (const t of order) {
    const r = await db[t].deleteMany({});
    console.log(`  ✓ ${t} vidé (${r.count} supprimés)`);
  }
  
  // Garder uniquement capital_initial dans Parametre
  await db.parametre.deleteMany({ where: { NOT: { cle: 'capital_initial' } } });
  console.log('  ✓ Parametre nettoyé (capital_initial conservé)');
  
  // Vérification finale
  console.log('\nAprès:');
  const final = {
    Bovin: await db.bovin.count(),
    Alimentation: await db.alimentation.count(),
    Depense: await db.depense.count(),
    Financement: await db.financement.count(),
    Echeance: await db.echeance.count(),
    CapitalMouvement: await db.capitalMouvement.count(),
    Parametre: await db.parametre.count(),
    User: await db.user.count(),
  };
  for (const [k, v] of Object.entries(final)) console.log(`  ${k}: ${v}`);
  
  // Vérifier capital_initial
  const cap = await db.parametre.findUnique({ where: { cle: 'capital_initial' } });
  console.log(`\n✓ Capital initial conservé: ${cap?.valeur} FCFA`);
  console.log(`✓ Users conservés: ${final.User} comptes`);
}

main().catch(console.error).finally(() => db.$disconnect());
