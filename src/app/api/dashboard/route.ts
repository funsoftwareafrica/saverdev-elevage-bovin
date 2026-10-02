// GET /api/dashboard — tableau de bord agrégé (KPI 6 blocs + graphiques + alertes)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toBovin, toAlimentation, toDepense, toFinancement, toAlerte } from "@/lib/server-mappers";
import { computeDashboardFromData } from "@/lib/calculations";

export async function GET() {
  const [bovins, alimentations, depenses, financementRows, alertes] = await Promise.all([
    db.bovin.findMany({ orderBy: { identifiant: "asc" } }),
    db.alimentation.findMany({ orderBy: { date: "desc" } }),
    db.depense.findMany({ orderBy: { date: "desc" } }),
    db.financement.findMany({ include: { echeances: true } }),
    db.alerte.findMany({ orderBy: { date: "desc" } }),
  ]);

  // Pour la démo : on prend le 1er financement (SAVERDEV)
  const financement = financementRows[0]
    ? toFinancement(financementRows[0])
    : {
        id: "",
        bailleur: "—",
        montantFinance: 0,
        dateOctroi: new Date().toISOString(),
        tauxInteret: 0,
        dureeMois: 0,
        echeances: [],
      };

  const dashboard = computeDashboardFromData({
    bovins: bovins.map(toBovin),
    alimentations: alimentations.map(toAlimentation),
    depenses: depenses.map(toDepense),
    financement,
    alertes: alertes.map(toAlerte),
  });

  return NextResponse.json(dashboard);
}
