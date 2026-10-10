// GET /api/parametres — seuils configurables (crée les défauts si absents)
// PUT /api/parametres — met à jour un paramètre
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULTS: { cle: string; valeur: string; description: string }[] = [
  { cle: "margeMin", valeur: "60000", description: "Marge minimale par bovin vendu (FCFA) — en dessous, alerte" },
  { cle: "budgetAlimentationMax", valeur: "150000", description: "Coût alimentation max par tête (FCFA) — au-dessus, alerte" },
  { cle: "dureeEngraissementMax", valeur: "180", description: "Durée d'engraissement max (jours) — au-dessus, alerte" },
  { cle: "tauxUtilisationAlerte", valeur: "80", description: "Taux d'utilisation financement déclenchant une alerte (%)" },
];

export async function GET() {
  for (const d of DEFAULTS) {
    const exists = await db.parametre.findUnique({ where: { cle: d.cle } });
    if (!exists) {
      await db.parametre.create({ data: d });
    }
  }
  const params = await db.parametre.findMany({ orderBy: { cle: "asc" } });
  return NextResponse.json(
    params.map((p) => ({ id: p.id, cle: p.cle, valeur: p.valeur, description: p.description }))
  );
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { cle, valeur } = body;
  const param = await db.parametre.upsert({
    where: { cle },
    update: { valeur },
    create: { cle, valeur, description: "" },
  });
  return NextResponse.json(param);
}
