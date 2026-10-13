// GET /api/rapport-bailleur/export-pdf — génère un PDF du rapport bailleur
// via @react-pdf/renderer (renderToStream).
//
// Query params : ?annee=2025 (optionnel, défaut = année courante)
// Réponse : binaire PDF avec Content-Type: application/pdf et
// Content-Disposition: attachment; filename="rapport-bailleur-YYYY.pdf"
//
// On réutilise la même logique d'agrégation que /api/rapport-bailleur (route
// principale) — on appelle la route GET pour récupérer le JSON, puis on le
// passe au helper renderRapportBailleurPdf() (défini dans le composant
// .tsx) qui produit le stream PDF.
//
// La route reste un fichier .ts simple (pas de JSX) — la construction de
// l'élément React est déléguée au helper renderRapportBailleurPdf dans
// src/components/pdf/rapport-bailleur-pdf.tsx.

import { NextRequest, NextResponse } from "next/server";
import { renderRapportBailleurPdf } from "@/components/pdf/rapport-bailleur-pdf";
import type { RapportBailleur } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const yearParam = url.searchParams.get("annee");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  // Récupère le JSON du rapport bailleur depuis la route /api/rapport-bailleur
  // (on évite de dupliquer l'agrégation serveur). On appelle en interne via
  // fetch — c'est rapide en localhost et ça réutilise le code existant.
  const internalUrl = `http://localhost:3000/api/rapport-bailleur?annee=${year}`;
  let rapport: RapportBailleur;
  try {
    const res = await fetch(internalUrl, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Échec récupération rapport (HTTP ${res.status})` },
        { status: 502 }
      );
    }
    rapport = (await res.json()) as RapportBailleur;
  } catch (e) {
    return NextResponse.json(
      { error: "Échec génération PDF", details: (e as Error).message },
      { status: 500 }
    );
  }

  // Génère le PDF via le helper renderRapportBailleurPdf (qui appelle
  // @react-pdf/renderer renderToStream en interne). Retourne un stream
  // lisible qu'on branche directement sur la réponse HTTP.
  try {
    const pdfStream = await renderRapportBailleurPdf(rapport, year);

    const filename = `rapport-bailleur-${year}.pdf`;
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    headers.set("Cache-Control", "no-store");

    // NextResponse ne supporte pas directement les streams Web, on utilise
    // la primitive Response du runtime qui supporte ReadableStream.
    return new NextResponse(pdfStream as unknown as BodyInit, {
      status: 200,
      headers,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Échec rendu PDF", details: (e as Error).message },
      { status: 500 }
    );
  }
}
