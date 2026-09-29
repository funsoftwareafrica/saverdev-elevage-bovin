// GET /api/bovins/[id] — détail d'un bovin
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toBovin } from "@/lib/server-mappers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bovin = await db.bovin.findUnique({ where: { id } });
  if (!bovin) return NextResponse.json({ error: "Bovin introuvable" }, { status: 404 });
  return NextResponse.json(toBovin(bovin));
}
