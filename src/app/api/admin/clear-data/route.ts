// POST /api/admin/clear-data — Efface TOUTES les données sauf Users et Parametre (financement)
// Réservé à E2A uniquement.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function POST() {
  const { forbidden } = await requireRole(["E2A"]);
  if (forbidden) return NextResponse.json({ error: "Réservé à E2A" }, { status: 403 });

  try {
    // Ordre de suppression (respect des foreign keys)
    const tables = [
      "photo", "tag", "capitalMouvement", "stockMouvement", "validation",
      "backup", "notification", "soin", "paturage", "pese",
      "historique", "alerte", "echeance", "financement",
      "depenseBovin", "depense", "alimentationBovin", "alimentation", "bovin",
    ];

    const results: string[] = [];
    for (const t of tables) {
      const r = await db[t].deleteMany({});
      results.push(`${t}: ${r.count} supprimés`);
    }

    // Garder uniquement le paramètre "financement" (capital initial)
    await db.parametre.deleteMany({ where: { NOT: { cle: "financement" } } });
    results.push("parametres: nettoyé (financement conservé)");

    // Créer une entrée dans l'historique
    await db.historique.create({
      data: {
        action: "CLEAR_ALL_DATA",
        entiteType: "Admin",
        entiteId: "clear",
        details: `Toutes les données effacées par E2A. ${results.join("; ")}`,
      },
    }).catch(() => null);

    return NextResponse.json({ ok: true, message: "Données effacées", details: results });
  } catch (e) {
    return NextResponse.json({ error: "Erreur lors de l'effacement", details: String(e) }, { status: 500 });
  }
}
