// GET /api/backup — liste des sauvegardes (ADMIN only)
// POST /api/backup — crée une sauvegarde manuelle (ADMIN only)
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { listBackups, createBackup } from "@/lib/backup";

export async function GET() {
  const { forbidden } = await requireRole(["ADMIN", "GERANT"]);
  if (forbidden) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const backups = await listBackups();
  return NextResponse.json(backups);
}

export async function POST() {
  const { forbidden } = await requireRole(["ADMIN"]);
  if (forbidden) return NextResponse.json({ error: "Accès refusé — admin uniquement" }, { status: 403 });
  const backup = await createBackup("manual");
  return NextResponse.json(backup, { status: 201 });
}
