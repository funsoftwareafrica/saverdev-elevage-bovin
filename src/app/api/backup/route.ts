// GET /api/backup — liste des sauvegardes (E2A only)
// POST /api/backup — crée une sauvegarde manuelle (E2A only)
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { listBackups, createBackup } from "@/lib/backup";

export async function GET() {
  const { forbidden } = await requireRole(["E2A", "SINERGI"]);
  if (forbidden) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const backups = await listBackups();
  return NextResponse.json(backups);
}

export async function POST() {
  const { forbidden } = await requireRole(["E2A"]);
  if (forbidden) return NextResponse.json({ error: "Accès refusé — admin uniquement" }, { status: 403 });
  const backup = await createBackup("manual");
  return NextResponse.json(backup, { status: 201 });
}
