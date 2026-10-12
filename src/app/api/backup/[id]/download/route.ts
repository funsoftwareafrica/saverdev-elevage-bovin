// GET /api/backup/[id]/download — télécharge le fichier JSON d'une sauvegarde (E2A only)
// Si le fichier disque n'existe pas (prod Vercel serverless), régénère le JSON à la volée depuis la DB courante.
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBackupFilePath, exportAllData } from "@/lib/backup";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { forbidden } = await requireRole(["E2A", "SINERGI"]);
  if (forbidden) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const backup = await db.backup.findUnique({ where: { id } });
  if (!backup) return NextResponse.json({ error: "Sauvegarde introuvable" }, { status: 404 });

  // Tente d'abord de lire le fichier disque (dev local)
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
    // Fallback : régénère le JSON à la volée depuis la DB courante (prod serverless, fs read-only)
    try {
      const { data } = await exportAllData();
      const regenerated = JSON.stringify(data, null, 2);
      return new NextResponse(regenerated, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${backup.filename}"`,
        },
      });
    } catch (regenErr) {
      console.error("Backup download régénération échouée :", regenErr);
      return NextResponse.json({ error: "Impossible de générer la sauvegarde" }, { status: 500 });
    }
  }
}
