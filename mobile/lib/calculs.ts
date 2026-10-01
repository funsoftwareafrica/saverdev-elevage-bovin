// Calculs purs
import type { Bovin } from "./types";
export function computeBovinMarge(b: Bovin): { coutRevient: number; marge: number | null } {
  const coutRevient = b.prixAchat + b.coutsEngraissement + b.autresCouts;
  const marge = b.statut === "VENDU" ? b.prixVente - coutRevient : null;
  return { coutRevient, marge };
}
