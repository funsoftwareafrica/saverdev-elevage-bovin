// GET /api/rapport-bailleur/export-xlsx — génère un fichier Excel .xlsx du
// rapport bailleur (modèle E2A — Tableau de Bord SAVERDEV).
//
// Feuilles générées :
//   1. "Données" — 12 mois × 18 colonnes (bovinsActifs, achats, ventes,
//      mortalité, valeurCheptel, sacs, coutAlim, CA, coutAchat, coutEngrais,
//      marge, coutAlimTete, margeTete, financementUtilise, tresorerie,
//      tauxUtil, ...)
//   2. "Tableau de bord" — 6 KPI colorés (modèle E2A) + structure des coûts
//   3. "Détail ventes" — liste des bovins vendus avec marge
//
// Header Content-Disposition: attachment; filename="rapport-bailleur-YYYY.xlsx"

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toBovin, toFinancement, toAlerte } from "@/lib/server-mappers";
import { computeBovinMarge } from "@/lib/calculations";
import ExcelJS from "exceljs";

function monthKey(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function exerciceMonths(year: number): { key: string; label: string }[] {
  const labels = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
  return labels.map((label, i) => ({
    key: `${year}-${String(i + 1).padStart(2, "0")}`,
    label,
  }));
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const yearParam = url.searchParams.get("annee");
  const now = new Date();

  const [bovinsRaw, alimentations, financementRows, alertes] = await Promise.all([
    db.bovin.findMany({ orderBy: { identifiant: "asc" } }),
    db.alimentation.findMany({ orderBy: { date: "desc" } }),
    db.financement.findMany({ include: { echeances: true } }),
    db.alerte.findMany({ orderBy: { date: "desc" } }),
  ]);
  const bovins = bovinsRaw.map(toBovin);

  // Auto-détection de l'année
  let year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
  const hasDataInYear = (y: number) =>
    bovins.some((b) => new Date(b.dateAchat).getFullYear() === y || (b.dateVente && new Date(b.dateVente).getFullYear() === y));
  if (!hasDataInYear(year)) {
    const years = new Set<number>();
    for (const b of bovins) {
      years.add(new Date(b.dateAchat).getFullYear());
      if (b.dateVente) years.add(new Date(b.dateVente).getFullYear());
    }
    if (years.size > 0) year = Math.max(...years);
  }

  const financement = financementRows[0] ? toFinancement(financementRows[0]) : null;
  const montantFinance = financement?.montantFinance ?? 0;
  const months = exerciceMonths(year);
  const echeancesPayees = financement?.echeances.filter((e) => e.statut === "PAYEE") ?? [];

  type Row = {
    mois: string;
    bovinsActifs: number;
    achats: number;
    ventes: number;
    mortalite: number;
    valeurCheptel: number;
    sacsConsommes: number;
    coutAlimentation: number;
    ca: number;
    coutAchat: number;
    coutEngraissement: number;
    margeTotale: number;
    coutAlimParTete: number;
    margeParTete: number;
    financementAccorde: number;
    financementUtilise: number;
    tresorerie: number;
    tauxUtilisation: number;
  };

  const monthly: Row[] = months.map((m) => {
    const endOfMonth = new Date(year, parseInt(m.key.split("-")[1], 10), 0, 23, 59, 59);
    const bovinsActifsMois = bovins.filter((b) => {
      const achat = new Date(b.dateAchat);
      if (achat > endOfMonth) return false;
      if (b.statut === "EN_ENGRAISSEMENT") return true;
      if (b.statut === "VENDU" && b.dateVente) return new Date(b.dateVente) > endOfMonth;
      return false;
    });

    const achatsMois = bovins.filter((b) => monthKey(b.dateAchat) === m.key);
    const ventesMois = bovins.filter((b) => b.statut === "VENDU" && b.dateVente && monthKey(b.dateVente) === m.key);
    const mortaliteMois = bovins.filter((b) => b.statut === "MORT" && monthKey(b.dateAchat) === m.key);

    const valeurCheptel = bovinsActifsMois.reduce((s, b) => s + b.prixAchat + b.coutsEngraissement, 0);

    const alimMois = alimentations.filter((a) => monthKey(a.date.toISOString()) === m.key);
    const sacsConsommes = alimMois.reduce((s, a) => s + a.quantite, 0);
    const coutAlimentation = alimMois.reduce((s, a) => s + a.coutTotal, 0);

    const ca = ventesMois.reduce((s, b) => s + b.prixVente, 0);
    const coutAchat = ventesMois.reduce((s, b) => s + b.prixAchat, 0);
    const coutEngraissement = ventesMois.reduce((s, b) => s + b.coutsEngraissement + b.autresCouts, 0);
    const margeTotale = ca - coutAchat - coutEngraissement;

    const coutAlimParTete = bovinsActifsMois.length > 0 ? coutAlimentation / bovinsActifsMois.length : 0;
    const margeParTete = ventesMois.length > 0 ? margeTotale / ventesMois.length : 0;

    const financementUtilise = echeancesPayees
      .filter((e) => e.datePayee && new Date(e.datePayee) <= endOfMonth)
      .reduce((s, e) => s + e.montant, 0);
    const tauxUtilisation = montantFinance > 0 ? (financementUtilise / montantFinance) * 100 : 0;

    const caCumulMois = bovins
      .filter((b) => b.statut === "VENDU" && b.dateVente && new Date(b.dateVente) <= endOfMonth)
      .reduce((s, b) => s + b.prixVente, 0);
    const coutsCumulMois = bovins
      .filter((b) => b.dateAchat && new Date(b.dateAchat) <= endOfMonth)
      .reduce((s, b) => s + b.prixAchat + b.coutsEngraissement + b.autresCouts, 0);
    const tresorerie = montantFinance - financementUtilise + caCumulMois - coutsCumulMois;

    return {
      mois: m.label,
      bovinsActifs: bovinsActifsMois.length,
      achats: achatsMois.length,
      ventes: ventesMois.length,
      mortalite: mortaliteMois.length,
      valeurCheptel,
      sacsConsommes,
      coutAlimentation,
      ca,
      coutAchat,
      coutEngraissement,
      margeTotale,
      coutAlimParTete,
      margeParTete,
      financementAccorde: montantFinance,
      financementUtilise,
      tresorerie,
      tauxUtilisation,
    };
  });

  const dernier = monthly[monthly.length - 1];
  const caCumul = monthly.reduce((s, m) => s + m.ca, 0);
  const margeCumul = monthly.reduce((s, m) => s + m.margeTotale, 0);
  const ventesCumul = monthly.reduce((s, m) => s + m.ventes, 0);

  const costStructure = {
    achatBovins: monthly.reduce((s, m) => s + m.coutAchat, 0),
    alimentation: monthly.reduce((s, m) => s + m.coutAlimentation, 0),
    engraissement: monthly.reduce((s, m) => s + m.coutEngraissement, 0),
  };

  const kpis = {
    bovinsActifs: dernier?.bovinsActifs ?? 0,
    caCumul,
    margeTotale: margeCumul,
    margeParTete: ventesCumul > 0 ? margeCumul / ventesCumul : 0,
    tauxUtilisation: dernier?.tauxUtilisation ?? 0,
    tresorerie: dernier?.tresorerie ?? 0,
  };

  // ==== Construction du classeur Excel ====
  const wb = new ExcelJS.Workbook();
  wb.creator = "SAVERDEV — Sahel Vert pour un Développement Durable";
  wb.created = new Date();
  wb.modified = new Date();

  // ---------- Feuille 1 : Données (12 mois × 18 colonnes) ----------
  const ws1 = wb.addWorksheet("Données", {
    properties: { defaultColWidth: 14 },
    pageSetup: { orientation: "landscape", fitToPage: true },
  });

  // En-tête SAVERDEV (bandeau vert foncé)
  const headerRow = ws1.addRow(["SAVERDEV DURABLE — Tableau de bord bailleur", `Exercice ${year}`, "Montants en FCFA"]);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF14532A" } };
    cell.alignment = { vertical: "middle" };
  });

  ws1.addRow([]); // ligne vide

  // Ligne d'en-têtes de colonnes
  const columns = [
    "Mois", "Animaux actifs", "Achats", "Ventes", "Mortalité", "Valeur cheptel",
    "Sacs consommés", "Coût alimentation", "CA", "Coût achat", "Coût engrais.",
    "Marge totale", "Coût alim./tête", "Marge/tête", "Fin. accordé",
    "Fin. utilisé", "Trésorerie", "Taux util. (%)",
  ];
  const headerDataRow = ws1.addRow(columns);
  headerDataRow.height = 30;
  headerDataRow.eachCell((cell, col) => {
    cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E7B34" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
      left: { style: "thin", color: { argb: "FFCCCCCC" } },
      right: { style: "thin", color: { argb: "FFCCCCCC" } },
    };
    ws1.getColumn(col).width = col === 1 ? 10 : 14;
  });

  // Données mensuelles
  for (const row of monthly) {
    const r = ws1.addRow([
      row.mois,
      row.bovinsActifs,
      row.achats,
      row.ventes,
      row.mortalite,
      Math.round(row.valeurCheptel),
      Math.round(row.sacsConsommes),
      Math.round(row.coutAlimentation),
      Math.round(row.ca),
      Math.round(row.coutAchat),
      Math.round(row.coutEngraissement),
      Math.round(row.margeTotale),
      Math.round(row.coutAlimParTete),
      Math.round(row.margeParTete),
      Math.round(row.financementAccorde),
      Math.round(row.financementUtilise),
      Math.round(row.tresorerie),
      Math.round(row.tauxUtilisation * 100) / 100,
    ]);
    r.eachCell((cell, col) => {
      cell.alignment = { horizontal: col === 1 ? "left" : "right", vertical: "middle" };
      cell.font = { size: 10 };
      cell.border = {
        top: { style: "hair", color: { argb: "FFE5E7EB" } },
        bottom: { style: "hair", color: { argb: "FFE5E7EB" } },
      };
      if (col >= 6 && col <= 18) {
        cell.numFmt = "#,##0";
      }
      // Marge négative → rouge
      if (col === 12 && row.margeTotale < 0) {
        cell.font = { color: { argb: "FFDC2626" }, bold: true, size: 10 };
      }
      // Marge positive → vert
      if (col === 12 && row.margeTotale > 0) {
        cell.font = { color: { argb: "FF059669" }, bold: true, size: 10 };
      }
    });
  }

  // Ligne de totaux
  const totalRow = ws1.addRow([
    "TOTAL",
    monthly.reduce((s, m) => s + m.bovinsActifs, 0), // sommé pour info
    monthly.reduce((s, m) => s + m.achats, 0),
    monthly.reduce((s, m) => s + m.ventes, 0),
    monthly.reduce((s, m) => s + m.mortalite, 0),
    0, // valeur cheptel non sommable
    monthly.reduce((s, m) => s + m.sacsConsommes, 0),
    monthly.reduce((s, m) => s + m.coutAlimentation, 0),
    monthly.reduce((s, m) => s + m.ca, 0),
    monthly.reduce((s, m) => s + m.coutAchat, 0),
    monthly.reduce((s, m) => s + m.coutEngraissement, 0),
    monthly.reduce((s, m) => s + m.margeTotale, 0),
    0,
    0,
    montantFinance,
    monthly.reduce((s, m) => s + m.financementUtilise, 0) - monthly.reduce((s, m) => s + m.financementUtilise, 0) === 0
      ? dernier?.financementUtilise ?? 0
      : dernier?.financementUtilise ?? 0,
    dernier?.tresorerie ?? 0,
    dernier?.tauxUtilisation ?? 0,
  ]);
  totalRow.eachCell((cell, col) => {
    cell.font = { bold: true, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
    cell.alignment = { horizontal: col === 1 ? "left" : "right" };
    if (col >= 6 && col <= 18) cell.numFmt = "#,##0";
  });

  // Fige la ligne d'en-tête SAVERDEV (l'en-tête de colonnes est ligne 3)
  ws1.views = [{ state: "frozen", ySplit: 3, xSplit: 0, topLeftCell: "A4" }];

  // ---------- Feuille 2 : Tableau de bord (KPI + structure des coûts) ----------
  const ws2 = wb.addWorksheet("Tableau de bord", {
    properties: { defaultColWidth: 22 },
    pageSetup: { orientation: "portrait", fitToPage: true },
  });

  const titleRow = ws2.addRow(["SAVERDEV DURABLE — Tableau de bord", `Exercice ${year}`]);
  titleRow.height = 28;
  titleRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 14 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF14532A" } };
    cell.alignment = { vertical: "middle" };
  });

  ws2.addRow([]);
  ws2.addRow(["Synthèse annuelle — destiné au bailleur de fonds"]).font = { italic: true, size: 10, color: { argb: "FF6B7280" } };
  ws2.addRow([]);

  // 6 KPI colorés (3×2 grille)
  const kpiData = [
    { label: "Animaux actifs (fin)", value: kpis.bovinsActifs, color: "FF1E7B34", fmt: "0" },
    { label: "Chiffre d'affaires cumulé", value: Math.round(kpis.caCumul), color: "FF1E6091", fmt: "#,##0" },
    { label: "Marge totale cumulée", value: Math.round(kpis.margeTotale), color: "FF14532A", fmt: "#,##0" },
    { label: "Marge moyenne / tête", value: Math.round(kpis.margeParTete), color: "FF0F766E", fmt: "#,##0" },
    { label: "Taux util. fin.", value: Math.round(kpis.tauxUtilisation * 100) / 100, color: "FFE0A008", fmt: "0.0" },
    { label: "Trésorerie disponible", value: Math.round(kpis.tresorerie), color: "FF8D6E63", fmt: "#,##0" },
  ];

  for (let i = 0; i < kpiData.length; i += 2) {
    const left = kpiData[i];
    const right = kpiData[i + 1];
    const labelRow = ws2.addRow([left.label, "", right?.label ?? "", ""]);
    const valueRow = ws2.addRow([left.value, "", right?.value ?? "", ""]);

    [labelRow, valueRow].forEach((r) => {
      r.height = r === valueRow ? 30 : 18;
    });

    [1, 3].forEach((col) => {
      const k = col === 1 ? left : right;
      if (!k) return;
      const labelCell = labelRow.getCell(col);
      labelCell.value = k.label;
      labelCell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 };
      labelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: k.color } };
      labelCell.alignment = { horizontal: "center", vertical: "middle" };

      const valueCell = valueRow.getCell(col);
      valueCell.value = k.value;
      valueCell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 18 };
      valueCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: k.color } };
      valueCell.alignment = { horizontal: "center", vertical: "middle" };
      valueCell.numFmt = k.fmt;
    });

    // Fusionner les 2 colonnes par KPI
    ws2.mergeCells(labelRow.number, 1, labelRow.number, 2);
    ws2.mergeCells(valueRow.number, 1, valueRow.number, 2);
    ws2.mergeCells(labelRow.number, 3, labelRow.number, 4);
    ws2.mergeCells(valueRow.number, 3, valueRow.number, 4);
  }

  ws2.addRow([]);
  ws2.addRow(["Structure des coûts (cumul annuel)"]).font = { bold: true, size: 12, color: { argb: "FF14532A" } };
  ws2.addRow([]);

  // Structure des coûts
  const structData = [
    { label: "Achat des bovins", value: Math.round(costStructure.achatBovins), color: "FFE0A008" },
    { label: "Alimentation", value: Math.round(costStructure.alimentation), color: "FF10B981" },
    { label: "Engraissement (autres)", value: Math.round(costStructure.engraissement), color: "FF3B82F6" },
  ];
  for (const s of structData) {
    const r = ws2.addRow([s.label, s.value]);
    r.getCell(1).font = { size: 11 };
    r.getCell(2).font = { bold: true, size: 11, color: { argb: s.color } };
    r.getCell(2).numFmt = "#,##0";
    r.getCell(2).alignment = { horizontal: "right" };
  }

  // ---------- Feuille 3 : Détail des ventes ----------
  const ws3 = wb.addWorksheet("Détail ventes", {
    properties: { defaultColWidth: 14 },
    pageSetup: { orientation: "landscape", fitToPage: true },
  });

  ws3.addRow(["Détail des ventes — exercice " + year]).font = { bold: true, size: 12, color: { argb: "FF14532A" } };
  ws3.addRow([]);

  const ventesCols = ["Identifiant", "Espèce", "Race", "Client", "Date vente", "Prix vente", "Coût revient", "Marge", "Marge %"];
  const vHeaderRow = ws3.addRow(ventesCols);
  vHeaderRow.height = 24;
  vHeaderRow.eachCell((cell, col) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E7B34" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    ws3.getColumn(col).width = col <= 5 ? 14 : 16;
  });

  const ventesDetail = bovins.filter((b) => b.statut === "VENDU" && b.dateVente && new Date(b.dateVente).getFullYear() === year);
  for (const b of ventesDetail) {
    const { coutRevient, marge } = computeBovinMarge(b);
    const pct = coutRevient > 0 ? (marge / coutRevient) * 100 : 0;
    const r = ws3.addRow([
      b.identifiant,
      b.espece === "OVIN" ? "Ovin" : "Bovin",
      b.race,
      b.clientVente ?? "Client",
      new Date(b.dateVente!).toLocaleDateString("fr-FR"),
      Math.round(b.prixVente),
      Math.round(coutRevient),
      Math.round(marge),
      Math.round(pct * 100) / 100,
    ]);
    r.eachCell((cell, col) => {
      cell.alignment = { horizontal: col >= 6 ? "right" : "left", vertical: "middle" };
      cell.font = { size: 10 };
      if (col >= 6 && col <= 8) cell.numFmt = "#,##0";
      if (col === 9) cell.numFmt = "0.0";
      if (col === 8) {
        const v = (marge as number) ?? 0;
        cell.font = { bold: true, color: { argb: v >= 0 ? "FF059669" : "FFDC2626" }, size: 10 };
      }
    });
  }

  if (ventesDetail.length === 0) {
    ws3.addRow(["Aucune vente sur l'exercice", "", "", "", "", "", "", "", ""]).font = { italic: true, color: { argb: "FF6B7280" } };
  }

  // Ligne alertes
  ws3.addRow([]);
  ws3.addRow(["Alertes actives"]).font = { bold: true, size: 12, color: { argb: "FF14532A" } };
  const alertesMapped = alertes.map(toAlerte).filter((a) => !a.resolved);
  if (alertesMapped.length === 0) {
    ws3.addRow(["Aucune alerte active"]).font = { italic: true, color: { argb: "FF6B7280" } };
  } else {
    for (const a of alertesMapped) {
      ws3.addRow([a.severite, a.type, a.message]).font = { size: 10, color: { argb: a.severite === "CRITICAL" ? "FFDC2626" : a.severite === "WARNING" ? "FFD97706" : "FF0284C7" } };
    }
  }

  // Pied de page
  ws3.addRow([]);
  const footerRow = ws3.addRow([`Document généré le ${new Date().toLocaleDateString("fr-FR")} · SAVERDEV DURABLE — Confidentiel`]);
  footerRow.font = { italic: true, size: 9, color: { argb: "FF6B7280" } };

  // ==== Sérialisation ====
  const buffer = await wb.xlsx.writeBuffer();
  const filename = `rapport-bailleur-${year}.xlsx`;

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
