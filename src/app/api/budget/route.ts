// GET  /api/budget — budgets prévisionnels par catégorie pour le mois en cours
// PUT  /api/budget — met à jour un budget (body: { cle, valeur })
//
// Catégories gérées (cahier des charges §9) :
//   - budget_veto        → "Soins vétérinaires"
//   - budget_transport   → "Transport"
//   - budget_salariat    → "Main-d'œuvre"
//   - budget_aliment     → "Aliment bétail" (catégorie d'alimentation)
//   - budget_autres      → "Autres"
//
// Pour chaque catégorie, calcule en temps réel les dépenses réalisées sur
// le mois en cours (depuis la table Depense pour les catégories classiques,
// depuis la table Alimentation pour "Aliment bétail").

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import type { BudgetItem } from "@/lib/types";

interface BudgetSpec {
  cle: string;
  categorie: string;
  defaut: number;
  source: "depense" | "alimentation";
}

const BUDGET_SPECS: BudgetSpec[] = [
  { cle: "budget_veto", categorie: "Soins vétérinaires", defaut: 200_000, source: "depense" },
  { cle: "budget_transport", categorie: "Transport", defaut: 100_000, source: "depense" },
  { cle: "budget_salariat", categorie: "Main-d'œuvre", defaut: 300_000, source: "depense" },
  { cle: "budget_aliment", categorie: "Aliment bétail", defaut: 1_000_000, source: "alimentation" },
  { cle: "budget_autres", categorie: "Autres", defaut: 50_000, source: "depense" },
];

/** Crée les Parametres de budget par défaut s'ils n'existent pas. */
async function ensureBudgetDefaults() {
  for (const spec of BUDGET_SPECS) {
    const existing = await db.parametre.findUnique({ where: { cle: spec.cle } });
    if (!existing) {
      await db.parametre.create({
        data: {
          cle: spec.cle,
          valeur: String(spec.defaut),
          description: `Budget mensuel — ${spec.categorie} (FCFA)`,
        },
      });
    }
  }
}

export async function GET() {
  await ensureBudgetDefaults();
  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const params = await db.parametre.findMany({
    where: { cle: { in: BUDGET_SPECS.map((s) => s.cle) } },
  });
  const map = new Map(params.map((p) => [p.cle, p.valeur]));

  // Dépenses du mois par catégorie
  const depensesMois = await db.depense.findMany({
    where: { date: { gte: debutMois, lt: finMois } },
  });
  const depensesParCat: Record<string, number> = {};
  for (const d of depensesMois) {
    depensesParCat[d.categorie] = (depensesParCat[d.categorie] || 0) + d.montant;
  }

  // Alimentation du mois (catégorie "Aliment bétail")
  const alimentationsMois = await db.alimentation.findMany({
    where: { date: { gte: debutMois, lt: finMois } },
  });
  const totalAlim = alimentationsMois.reduce((s, a) => s + a.coutTotal, 0);

  const items: BudgetItem[] = BUDGET_SPECS.map((spec) => {
    const budget = Number(map.get(spec.cle) ?? String(spec.defaut));
    const realise =
      spec.source === "alimentation"
        ? totalAlim
        : depensesParCat[spec.categorie] ?? 0;
    const taux = budget > 0 ? (realise / budget) * 100 : 0;
    return {
      cle: spec.cle,
      categorie: spec.categorie,
      budget,
      realise,
      taux,
      depasse: realise > budget,
    };
  });

  return NextResponse.json(items);
}

export async function PUT(req: NextRequest) {
  const { forbidden } = await requireRole(["E2A", "BENEFICIAIRE"]);
  if (forbidden) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const body = await req.json();
  const { cle, valeur } = body as { cle: string; valeur: string };
  if (!cle || !valeur) {
    return NextResponse.json({ error: "cle + valeur requis" }, { status: 400 });
  }
  const num = Number(valeur);
  if (isNaN(num) || num < 0) {
    return NextResponse.json({ error: "Valeur invalide" }, { status: 400 });
  }
  const spec = BUDGET_SPECS.find((s) => s.cle === cle);
  const updated = await db.parametre.upsert({
    where: { cle },
    update: { valeur: String(num) },
    create: {
      cle,
      valeur: String(num),
      description: `Budget mensuel — ${spec?.categorie ?? cle} (FCFA)`,
    },
  });

  return NextResponse.json({
    cle: updated.cle,
    categorie: spec?.categorie ?? cle,
    budget: num,
    updatedAt: updated.updatedAt.toISOString(),
  });
}
