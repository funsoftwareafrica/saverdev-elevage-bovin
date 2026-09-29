// GET /api/financement — détail du financement + échéances
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toFinancement } from "@/lib/server-mappers";

export async function GET() {
  const financements = await db.financement.findMany({
    include: { echeances: true },
    orderBy: { dateOctroi: "desc" },
  });
  if (financements.length === 0) {
    return NextResponse.json(null);
  }
  return NextResponse.json(toFinancement(financements[0]));
}
