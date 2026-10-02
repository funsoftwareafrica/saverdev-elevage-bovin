// GET /api/historique — journal des opérations
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toHistorique } from "@/lib/server-mappers";

export async function GET() {
  const historique = await db.historique.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: 50,
  });
  return NextResponse.json(historique.map(toHistorique));
}
