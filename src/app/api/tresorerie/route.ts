// GET /api/tresorerie — projection de trésorerie sur 6 mois
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface MoisProjection {
  mois: string;
  date: string;
  entrees: number;
  sorties: number;
  solde: number;
  soldeCumule: number;
  enRisque: boolean;
}

export async function GET() {
  const fin = await db.financement.findFirst({ include: { echeances: true } });
  const echeances = fin?.echeances ?? [];
  const payees = echeances.filter((e) => e.statut === "PAYEE");
  const montantUtilise = payees.reduce((s, e) => s + e.montant, 0);
  const soldeInitial = fin ? fin.montantFinance - montantUtilise : 0;

  const depenses = await db.depense.findMany();
  const depenseMensuelleMoy = depenses.length
    ? depenses.reduce((s, d) => s + d.montant, 0) / Math.max(1, 3)
    : 200000;

  const maintenant = new Date();
  const projection: MoisProjection[] = [];
  let soldeCumule = soldeInitial;

  for (let i = 0; i < 6; i++) {
    const d = new Date(maintenant.getFullYear(), maintenant.getMonth() + i, 1);
    const finMois = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const echeancesMois = echeances
      .filter((e) => e.statut !== "PAYEE")
      .filter((e) => {
        const dp = new Date(e.datePrevue);
        return dp >= d && dp <= finMois;
      })
      .reduce((s, e) => s + e.montant, 0);
    const ventesPrevues = i < 3 ? 540000 : 0;
    const entrees = ventesPrevues;
    const sorties = echeancesMois + depenseMensuelleMoy;
    const net = entrees - sorties;
    soldeCumule += net;
    projection.push({
      mois: d.toLocaleDateString("fr-FR", { month: "short" }),
      date: d.toISOString(),
      entrees,
      sorties,
      solde: net,
      soldeCumule,
      enRisque: soldeCumule < 0,
    });
  }

  return NextResponse.json({
    soldeInitial,
    depenseMensuelleMoy: Math.round(depenseMensuelleMoy),
    projection,
    moisARisque: projection.filter((m) => m.enRisque).length,
    totalEntrees: projection.reduce((s, m) => s + m.entrees, 0),
    totalSorties: projection.reduce((s, m) => s + m.sorties, 0),
  });
}
