// GET /api/soins — liste des soins (carnet de santé)
// POST /api/soins — enregistre un soin
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const bovinId = url.searchParams.get("bovinId");
  const soins = await db.soin.findMany({
    where: bovinId ? { bovinId } : undefined,
    orderBy: { date: "desc" },
  });
  return NextResponse.json(
    soins.map((s) => ({
      id: s.id,
      bovinId: s.bovinId,
      date: s.date.toISOString(),
      type: s.type,
      libelle: s.libelle,
      cout: s.cout,
      prochainRappel: s.prochainRappel?.toISOString() ?? null,
      notes: s.notes,
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const soin = await db.soin.create({
    data: {
      bovinId: body.bovinId,
      type: body.type ?? "Contrôle",
      libelle: body.libelle,
      cout: Number(body.cout ?? 0),
      prochainRappel: body.prochainRappel ? new Date(body.prochainRappel) : null,
      notes: body.notes ?? null,
    },
  });
  await db.historique.create({
    data: {
      action: "SOIN",
      entiteType: "Bovin",
      entiteId: body.bovinId,
      details: `${body.type ?? "Contrôle"} — ${body.libelle} (${body.cout ?? 0} FCFA)`,
    },
  });
  return NextResponse.json(soin, { status: 201 });
}
