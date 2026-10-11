// GET /api/backup/[id]/download — télécharge le fichier JSON d'une sauvegarde (E2A only)
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBackupFilePath } from "@/lib/backup";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { forbidden } = await requireRole(["E2A", "SINERGI"]);
  if (forbidden) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const backup = await db.backup.findUnique({ where: { id } });
  if (!backup) return NextResponse.json({ error: "Sauvegarde introuvable" }, { status: 404 });

  const filepath = getBackupFilePath(backup.filename);
  try {
    const content = await fs.readFile(filepath, "utf-8");
    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${backup.filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable sur le disque" }, { status: 404 });
  }
}
