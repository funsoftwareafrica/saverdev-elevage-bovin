// API route : sert le guide PDF avec Content-Disposition: attachment
// pour forcer le téléchargement au lieu de l'ouverture dans le navigateur.
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    const pdfPath = path.join(process.cwd(), "public", "guide-saverdev.pdf");
    const fileBuffer = await fs.readFile(pdfPath);

    // Force le téléchargement avec Content-Disposition: attachment
    // Le navigateur proposera de télécharger le fichier sous le nom "guide-saverdev.pdf"
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="guide-saverdev.pdf"',
        "Content-Length": fileBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Erreur lors de la lecture du guide PDF:", err);
    return NextResponse.json(
      { error: "Guide PDF introuvable" },
      { status: 404 }
    );
  }
}
