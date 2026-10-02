// GET /api/stats/races — statistiques par race
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeBovinMarge } from "@/lib/calculations";

export async function GET() {
  const bovins = await db.bovin.findMany({ orderBy: { identifiant: "asc" } });
  const byRace = new Map<string, typeof bovins>();
  for (const b of bovins) {
    const arr = byRace.get(b.race) ?? [];
    arr.push(b);
    byRace.set(b.race, arr);
  }
  const stats = Array.from(byRace.entries()).map(([race, list]) => {
    const vendus = list.filter((b) => b.statut === "VENDU");
    const actifs = list.filter((b) => b.statut === "EN_ENGRAISSEMENT");
    const marges = vendus.map((b) => {
      const { marge } = computeBovinMarge({ ...b, dateAchat: b.dateAchat.toISOString(), dateVente: b.dateVente?.toISOString() ?? null } as any);
      return marge ?? 0;
    });
    const margeTotale = marges.reduce((s, m) => s + m, 0);
    const durees = vendus.map((b) => b.dateVente ? (b.dateVente.getTime() - b.dateAchat.getTime()) / (1000*60*60*24) : 0);
    return {
      race, total: list.length, actifs: actifs.length, vendus: vendus.length,
      margeTotale: Math.round(margeTotale),
      margeMoyenne: Math.round(vendus.length ? margeTotale / vendus.length : 0),
      dureeMoyenne: Math.round(durees.length ? durees.reduce((s,d)=>s+d,0)/durees.length : 0),
      poidsMoyen: Math.round(list.reduce((s,b)=>s+b.poidsAchat,0)/list.length),
    };
  }).sort((a,b) => b.margeMoyenne - a.margeMoyenne);
  return NextResponse.json(stats);
}
