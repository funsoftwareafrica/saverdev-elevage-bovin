// GET /api/paturages — liste des pâturages (géolocalisation)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const paturages = await db.paturage.findMany({ orderBy: { nom: "asc" } });
  return NextResponse.json(
    paturages.map((p) => ({
      id: p.id,
      nom: p.nom,
      surface: p.surface,
      coordonnees: p.coordonnees,
      capacite: p.capacite,
      createdAt: p.createdAt.toISOString(),
    }))
  );
}
