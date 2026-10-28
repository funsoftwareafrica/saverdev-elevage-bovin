const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  // Vérifier si l'ancienne clé existe
  const old = await db.parametre.findUnique({ where: { cle: 'capital_initial' } });
  if (old) {
    // Supprimer l'ancienne et créer la nouvelle
    await db.parametre.delete({ where: { cle: 'capital_initial' } });
    await db.parametre.create({
      data: {
        cle: 'financement',
        valeur: old.valeur,
        description: 'Financement initial statique de SAVERDEV — ne pas modifier directement',
      }
    });
    console.log('✓ Clé renommée: capital_initial → financement');
    console.log('  Valeur:', old.valeur, 'FCFA');
  } else {
    // Vérifier si "financement" existe déjà
    const existing = await db.parametre.findUnique({ where: { cle: 'financement' } });
    if (existing) {
      console.log('✓ Clé "financement" existe déjà:', existing.valeur);
    } else {
      // Créer avec valeur par défaut
      await db.parametre.create({
        data: {
          cle: 'financement',
          valeur: '14775000',
          description: 'Financement initial statique de SAVERDEV',
        }
      });
      console.log('✓ Clé "financement" créée: 14775000');
    }
  }
  
  // Vérification
  const params = await db.parametre.findMany();
  console.log('\nParametres en DB:', JSON.stringify(params, null, 2));
}

main().catch(console.error).finally(() => db.$disconnect());
