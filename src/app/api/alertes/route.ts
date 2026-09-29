// GET /api/alertes — liste des alertes (non résolues d'abord)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toAlerte } from "@/lib/server-mappers";

export async function GET() {
  const alertes = await db.alerte.findMany({
    orderBy: [{ resolved: "asc" }, { date: "desc" }],
  });
  return NextResponse.json(alertes.map(toAlerte));
}
