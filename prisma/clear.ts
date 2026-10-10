import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Vidage des donnees...\n");
  
  let total = 0;
  
  const r3 = await db.alimentationBovin.deleteMany();
  console.log("alimentationBovin: " + r3.count); total += r3.count;
  
  const r4 = await db.alimentation.deleteMany();
  console.log("alimentation: " + r4.count); total += r4.count;
  
  const r5 = await db.depenseBovin.deleteMany();
  console.log("depenseBovin: " + r5.count); total += r5.count;
  
  const r6 = await db.depense.deleteMany();
  console.log("depense: " + r6.count); total += r6.count;
  
  const r7 = await db.echeance.deleteMany();
  console.log("echeance: " + r7.count); total += r7.count;
  
  const r8 = await db.financement.deleteMany();
  console.log("financement: " + r8.count); total += r8.count;
  
  const r9 = await db.tag.deleteMany();
  console.log("tag: " + r9.count); total += r9.count;
  
  const r10 = await db.photo.deleteMany();
  console.log("photo: " + r10.count); total += r10.count;
  
  const r11 = await db.validation.deleteMany();
  console.log("validation: " + r11.count); total += r11.count;
  
  const r12 = await db.alerte.deleteMany();
  console.log("alerte: " + r12.count); total += r12.count;
  
  const r13 = await db.historique.deleteMany();
  console.log("historique: " + r13.count); total += r13.count;
  
  const r14 = await db.bovin.deleteMany();
  console.log("bovin: " + r14.count); total += r14.count;
  
  const r15 = await db.user.deleteMany();
  console.log("user: " + r15.count); total += r15.count;
  
  console.log("\nTotal: " + total + " enregistrements supprimes");
  
  const remaining = await db.bovin.count();
  console.log("Verification - Bovins restants: " + remaining);
}

main()
  .catch((e) => console.error("Erreur:", e.message))
  .finally(() => db.$disconnect());
