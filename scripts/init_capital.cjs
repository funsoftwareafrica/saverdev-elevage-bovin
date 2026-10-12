const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  console.log('=== Initialisation du capital initial (14 775 000 FCFA) ===');
  
  // Vérifier s'il existe déjà
  const existing = await db.parametre.findUnique({ where: { cle: 'capital_initial' } });
  if (existing) {
    console.log('  Paramètre capital_initial existe déjà:', existing.valeur, 'FCFA');
    return;
  }
  
  // Créer le paramètre capital_initial
  const param = await db.parametre.create({
    data: {
      cle: 'capital_initial',
      valeur: '14775000',
      description: 'Capital initial statique de SAVERDEV — ne pas modifier directement',
    }
  });
  console.log('  ✓ Paramètre capital_initial créé:', param.valeur, 'FCFA');
  
  // Vérifier
  const all = await db.parametre.findMany();
  console.log('  Parametres en DB:', JSON.stringify(all, null, 2));
}

main().catch(console.error).finally(() => db.$disconnect());
