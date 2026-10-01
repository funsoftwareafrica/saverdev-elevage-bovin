// GET /api/stats/comparaison — mois courant vs mois précédent
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeBovinMarge } from "@/lib/calculations";

export async function GET() {
  const now = new Date();
  const debutCourant = new Date(now.getFullYear(), now.getMonth(), 1);
  const debutPrec = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const finPrec = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const bovins = await db.bovin.findMany();
  const ventesCourant = bovins.filter((b) => b.dateVente && b.dateVente >= debutCourant && b.dateVente <= now);
  const ventesPrec = bovins.filter((b) => b.dateVente && b.dateVente >= debutPrec && b.dateVente <= finPrec);

  const caC = ventesCourant.reduce((s,b)=>s+b.prixVente,0);
  const caP = ventesPrec.reduce((s,b)=>s+b.prixVente,0);
  const margeC = ventesCourant.reduce((s,b)=>{const {marge}=computeBovinMarge({ ...b, dateAchat: b.dateAchat.toISOString(), dateVente: b.dateVente?.toISOString() ?? null } as any); return s+(marge??0)},0);
  const margeP = ventesPrec.reduce((s,b)=>{const {marge}=computeBovinMarge({ ...b, dateAchat: b.dateAchat.toISOString(), dateVente: b.dateVente?.toISOString() ?? null } as any); return s+(marge??0)},0);

  const depC = await db.depense.aggregate({ _sum: { montant: true }, where: { date: { gte: debutCourant, lte: now } } });
  const depP = await db.depense.aggregate({ _sum: { montant: true }, where: { date: { gte: debutPrec, lte: finPrec } } });
  const alimC = await db.alimentation.aggregate({ _sum: { coutTotal: true }, where: { date: { gte: debutCourant, lte: now } } });
  const alimP = await db.alimentation.aggregate({ _sum: { coutTotal: true }, where: { date: { gte: debutPrec, lte: finPrec } } });

  const delta = (c:number,p:number) => p===0?{abs:c,pct:c>0?100:0}:{abs:c-p,pct:Math.round(((c-p)/p)*100)};

  return NextResponse.json({
    moisCourant: now.toLocaleDateString("fr-FR",{month:"long",year:"numeric"}),
    moisPrecedent: debutPrec.toLocaleDateString("fr-FR",{month:"long",year:"numeric"}),
    ventes: { courant: ventesCourant.length, prec: ventesPrec.length, delta: delta(ventesCourant.length, ventesPrec.length) },
    ca: { courant: caC, prec: caP, delta: delta(caC,caP) },
    marge: { courant: margeC, prec: margeP, delta: delta(margeC,margeP) },
    depenses: { courant: depC._sum.montant??0, prec: depP._sum.montant??0, delta: delta(depC._sum.montant??0, depP._sum.montant??0) },
    alimentation: { courant: alimC._sum.coutTotal??0, prec: alimP._sum.coutTotal??0, delta: delta(alimC._sum.coutTotal??0, alimP._sum.coutTotal??0) },
  });
}
