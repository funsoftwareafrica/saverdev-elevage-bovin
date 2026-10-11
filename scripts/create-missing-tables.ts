// Crée les tables SQLite manquantes + ajoute la colonne description à Parametre.
// Doit être lancé avec le schéma Prisma en provider = "sqlite" (override temporaire).
// Équivalent SQL de ce que `bun run db:push` ferait si le schéma était sqlite.

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// SQLite DDL — Prisma génère les DateTime en TEXT (ISO 8601) par défaut en SQLite.
// Les IDs sont TEXT (cuid générés côté app).
const DDL_STATEMENTS: string[] = [
  // 1. Parametre : ajout colonne description (idempotent via PRAGMA table_info check)
  // (SQLite ne supporte pas IF NOT EXISTS sur ALTER TABLE ADD COLUMN — géré en JS plus bas)

  // 2. Paturage
  `CREATE TABLE IF NOT EXISTS "Paturage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "surface" REAL NOT NULL,
    "coordonnees" TEXT,
    "capacite" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "Paturage_nom_idx" ON "Paturage"("nom")`,

  // 3. Pese (pesées)
  `CREATE TABLE IF NOT EXISTS "Pese" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bovinId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "poids" REAL NOT NULL,
    "methode" TEXT NOT NULL DEFAULT 'Manuelle',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("bovinId") REFERENCES "Bovin"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Pese_bovinId_idx" ON "Pese"("bovinId")`,
  `CREATE INDEX IF NOT EXISTS "Pese_date_idx" ON "Pese"("date")`,

  // 4. Soin (soins vétérinaires)
  `CREATE TABLE IF NOT EXISTS "Soin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bovinId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "cout" REAL NOT NULL DEFAULT 0,
    "prochainRappel" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("bovinId") REFERENCES "Bovin"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Soin_bovinId_idx" ON "Soin"("bovinId")`,
  `CREATE INDEX IF NOT EXISTS "Soin_date_idx" ON "Soin"("date")`,

  // 5. Notification
  `CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT 0,
    "lien" TEXT,
    "userId" TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS "Notification_date_idx" ON "Notification"("date")`,
  `CREATE INDEX IF NOT EXISTS "Notification_lu_idx" ON "Notification"("lu")`,

  // 6. Backup
  `CREATE TABLE IF NOT EXISTS "Backup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "entities" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Backup_filename_key" ON "Backup"("filename")`,
  `CREATE INDEX IF NOT EXISTS "Backup_date_idx" ON "Backup"("date")`,
  `CREATE INDEX IF NOT EXISTS "Backup_type_idx" ON "Backup"("type")`,
];

async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = await db.$queryRawUnsafe<{ name: string }[]>(
    `PRAGMA table_info("${table}")`
  );
  return rows.some((r) => r.name === column);
}

async function tableExists(table: string): Promise<boolean> {
  const rows = await db.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    table
  );
  return rows.length > 0;
}

async function main() {
  console.log("🛠  Création des tables SQLite manquantes...\n");

  // 0. Vérifie que la table Parametre existe
  if (!(await tableExists("Parametre"))) {
    console.error("❌ La table Parametre n'existe pas — lance d'abord le seed initial.");
    process.exit(1);
  }

  // 1. ALTER TABLE Parametre ADD COLUMN description (idempotent)
  if (!(await columnExists("Parametre", "description"))) {
    await db.$executeRawUnsafe(
      `ALTER TABLE "Parametre" ADD COLUMN "description" TEXT`
    );
    console.log("✓ Colonne 'description' ajoutée à Parametre");
  } else {
    console.log("• Colonne 'description' déjà présente sur Parametre (skip)");
  }

  // 2. Création des tables
  for (const ddl of DDL_STATEMENTS) {
    await db.$executeRawUnsafe(ddl);
  }
  console.log("✓ Tables créées : Paturage, Pese, Soin, Notification, Backup (+ indexes)");

  // 3. Vérifications
  for (const t of ["Paturage", "Pese", "Soin", "Notification", "Backup"]) {
    if (!(await tableExists(t))) {
      console.error(`❌ Table ${t} toujours absente après création !`);
      process.exit(1);
    }
  }
  console.log("\n✅ Toutes les tables sont présentes. Terminé.");
}

main()
  .catch((e) => {
    console.error("Erreur:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
