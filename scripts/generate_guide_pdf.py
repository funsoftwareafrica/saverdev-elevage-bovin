#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Génère le guide d'utilisation PDF de l'application SAVERDEV
à destination du gérant Souleymane Zakaria.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.colors import white as WHITE
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    ListFlowable, ListItem, KeepTogether, Image, Flowable, HRFlowable
)
from reportlab.platypus.frames import Frame
from reportlab.platypus.doctemplate import PageTemplate, BaseDocTemplate
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import os

# ============================================================
#   PALETTE SAVERDEV
# ============================================================
VERT_FORET   = HexColor("#2E8B57")  # primary — vert forêt
MARRON_TERRE = HexColor("#4A3728")  # secondary — marron terre
VERT_CLAIR   = HexColor("#7CC576")  # accent
BLEU_CIEL    = HexColor("#87CEEB")  # chart-4
AMBER        = HexColor("#F59E0B")  # warning
ROUGE        = HexColor("#EF4444")  # critical
GRIS_FONCE   = HexColor("#1F2937")
GRIS_MOYEN   = HexColor("#4B5563")
GRIS_CLAIR   = HexColor("#F3F4F6")
GRIS_BORD    = HexColor("#D1D5DB")

OUTPUT_PDF = "/home/z/my-project/public/guide-saverdev.pdf"

# ============================================================
#   PAGE TEMPLATES (en-tête + pied de page)
# ============================================================

def draw_cover_background(canv, doc):
    """Couverture : fond vert forêt + logo."""
    w, h = A4
    # Fond vert forêt
    canv.setFillColor(VERT_FORET)
    canv.rect(0, 0, w, h, fill=1, stroke=0)
    # Bande marron terre en bas
    canv.setFillColor(MARRON_TERRE)
    canv.rect(0, 0, w, 4*cm, fill=1, stroke=0)
    # Logo stylisé : cercle + arbre
    cx, cy = w / 2, h - 7*cm
    canv.setFillColor(WHITE)
    canv.setStrokeColor(WHITE)
    canv.circle(cx, cy, 1.6*cm, fill=0, stroke=1)
    canv.setLineWidth(2)
    # Tronc
    canv.rect(cx - 0.15*cm, cy - 1.2*cm, 0.3*cm, 1.2*cm, fill=1, stroke=0)
    # Feuillage
    canv.setFillColor(VERT_CLAIR)
    canv.circle(cx, cy + 0.3*cm, 0.9*cm, fill=1, stroke=0)
    canv.setFillColor(VERT_FORET)
    canv.circle(cx - 0.3*cm, cy + 0.5*cm, 0.4*cm, fill=1, stroke=0)
    canv.circle(cx + 0.3*cm, cy + 0.4*cm, 0.35*cm, fill=1, stroke=0)
    # Texte "SAVERDEV"
    canv.setFillColor(WHITE)
    canv.setFont("Helvetica-Bold", 28)
    canv.drawCentredString(cx, 4*cm + 2*cm, "SAVERDEV")
    canv.setFont("Helvetica", 10)
    canv.drawCentredString(cx, 4*cm + 1.2*cm, "SAHEL VERT · DÉVELOPPEMENT")

def draw_page_header_footer(canv, doc):
    """Pages internes : en-tête + pied de page."""
    w, h = A4
    # En-tête : barre verte fine + titre court
    canv.setFillColor(VERT_FORET)
    canv.rect(0, h - 1.2*cm, w, 0.15*cm, fill=1, stroke=0)
    canv.setFillColor(GRIS_MOYEN)
    canv.setFont("Helvetica", 8)
    canv.drawString(2*cm, h - 0.8*cm, "SAVERDEV — Guide d'utilisation")
    canv.drawRightString(w - 2*cm, h - 0.8*cm, "Souleymane Zakaria")
    # Pied de page : barre + numéro de page
    canv.setFillColor(VERT_FORET)
    canv.rect(0, 1.0*cm, w, 0.05*cm, fill=1, stroke=0)
    canv.setFillColor(GRIS_MOYEN)
    canv.setFont("Helvetica", 8)
    canv.drawString(2*cm, 0.5*cm, "Application de gestion d'élevage bovin & ovin")
    canv.drawRightString(w - 2*cm, 0.5*cm, f"Page {canv.getPageNumber()}")

# ============================================================
#   STYLES
# ============================================================

def make_styles():
    ss = getSampleStyleSheet()
    styles = {}
    # Cover title
    styles["cover_title"] = ParagraphStyle(
        "cover_title", parent=ss["Normal"],
        fontName="Helvetica-Bold", fontSize=32, textColor=WHITE,
        alignment=TA_CENTER, leading=38, spaceAfter=10
    )
    styles["cover_sub"] = ParagraphStyle(
        "cover_sub", parent=ss["Normal"],
        fontName="Helvetica", fontSize=14, textColor=WHITE,
        alignment=TA_CENTER, leading=18, spaceAfter=6
    )
    styles["cover_author"] = ParagraphStyle(
        "cover_author", parent=ss["Normal"],
        fontName="Helvetica-Bold", fontSize=12, textColor=WHITE,
        alignment=TA_CENTER, leading=16
    )
    # Section heading H1
    styles["h1"] = ParagraphStyle(
        "h1", parent=ss["Heading1"],
        fontName="Helvetica-Bold", fontSize=18, textColor=VERT_FORET,
        spaceBefore=14, spaceAfter=8, leading=22, keepWithNext=1
    )
    # Sub-heading H2
    styles["h2"] = ParagraphStyle(
        "h2", parent=ss["Heading2"],
        fontName="Helvetica-Bold", fontSize=13, textColor=MARRON_TERRE,
        spaceBefore=10, spaceAfter=5, leading=16, keepWithNext=1
    )
    # Sub-sub-heading H3
    styles["h3"] = ParagraphStyle(
        "h3", parent=ss["Heading3"],
        fontName="Helvetica-Bold", fontSize=11, textColor=GRIS_FONCE,
        spaceBefore=8, spaceAfter=4, leading=14, keepWithNext=1
    )
    # Body text
    styles["body"] = ParagraphStyle(
        "body", parent=ss["Normal"],
        fontName="Helvetica", fontSize=10, textColor=GRIS_FONCE,
        alignment=TA_JUSTIFY, leading=14, spaceAfter=6
    )
    # Bullets
    styles["bullet"] = ParagraphStyle(
        "bullet", parent=styles["body"],
        fontSize=10, leading=14, leftIndent=14, spaceAfter=3,
        bulletIndent=2
    )
    # Note box
    styles["note"] = ParagraphStyle(
        "note", parent=styles["body"],
        fontSize=9, textColor=MARRON_TERRE, leading=12,
        leftIndent=8, rightIndent=8, spaceBefore=4, spaceAfter=4
    )
    # Table cell
    styles["cell"] = ParagraphStyle(
        "cell", parent=ss["Normal"],
        fontName="Helvetica", fontSize=9, textColor=GRIS_FONCE, leading=12
    )
    styles["cell_bold"] = ParagraphStyle(
        "cell_bold", parent=styles["cell"],
        fontName="Helvetica-Bold"
    )
    styles["cell_header"] = ParagraphStyle(
        "cell_header", parent=styles["cell"],
        fontName="Helvetica-Bold", textColor=WHITE
    )
    # Code / kbd
    styles["kbd"] = ParagraphStyle(
        "kbd", parent=styles["body"],
        fontName="Courier", fontSize=9, textColor=MARRON_TERRE,
        backColor=GRIS_CLAIR, leading=12
    )
    # TOC entry
    styles["toc"] = ParagraphStyle(
        "toc", parent=styles["body"],
        fontSize=10, leading=18, alignment=TA_LEFT
    )
    return styles

# ============================================================
#   HELPERS : composants réutilisables
# ============================================================

def note_box(text, styles, color=BLEU_CIEL, bg=HexColor("#EFF6FF")):
    """Encadré d'information."""
    p = Paragraph(text, styles["note"])
    t = Table([[p]], colWidths=[16*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.6, color),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t

def warning_box(text, styles):
    return note_box(text, styles, color=AMBER, bg=HexColor("#FFFBEB"))

def danger_box(text, styles):
    return note_box(text, styles, color=ROUGE, bg=HexColor("#FEF2F2"))

def kbd_table(items, styles):
    """Liste de raccourcis / actions sous forme de tableau 2 colonnes."""
    data = [[Paragraph(k, styles["cell_bold"]), Paragraph(v, styles["cell"])] for k, v in items]
    t = Table(data, colWidths=[5*cm, 11*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), GRIS_CLAIR),
        ("GRID", (0, 0), (-1, -1), 0.3, GRIS_BORD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t

def section_table(headers, rows, styles, col_widths=None):
    """Tableau de synthèse avec en-tête coloré."""
    header_row = [Paragraph(h, styles["cell_header"]) for h in headers]
    body_rows = [
        [Paragraph(str(c), styles["cell_bold" if i == 0 else "cell"]) for i, c in enumerate(row)]
        for row in rows
    ]
    data = [header_row] + body_rows
    if col_widths is None:
        col_widths = [16*cm / len(headers)] * len(headers)
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), VERT_FORET),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("GRID", (0, 0), (-1, -1), 0.3, GRIS_BORD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, GRIS_CLAIR]),
    ]))
    return t

# ============================================================
#   CONTENU DU GUIDE
# ============================================================

def build_story(styles):
    s = []
    # ---------- COUVERTURE ----------
    s.append(Spacer(1, 6*cm))
    s.append(Paragraph("Guide d'utilisation", styles["cover_title"]))
    s.append(Paragraph("Application de gestion d'élevage bovin &amp; ovin", styles["cover_sub"]))
    s.append(Spacer(1, 8*cm))
    s.append(Paragraph("À destination du gérant", styles["cover_author"]))
    s.append(Paragraph("<b>Souleymane Zakaria — SAVERDEV</b>", styles["cover_author"]))
    s.append(Spacer(1, 1*cm))
    s.append(PageBreak())

    # ---------- SOMMAIRE ----------
    s.append(Paragraph("Sommaire", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    toc_items = [
        ("1.", "Présentation de l'application SAVERDEV"),
        ("2.", "Connexion &amp; comptes utilisateurs"),
        ("3.", "Navigation : la barre latérale"),
        ("4.", "Tableau de bord — vue d'ensemble"),
        ("5.", "Saisie — journaux comptables &amp; suivi du capital"),
        ("6.", "Cheptel — bovins &amp; ovins"),
        ("7.", "Alimentation — imputation par tête"),
        ("8.", "Dépenses d'exploitation"),
        ("9.", "Ventes — intérêt &amp; fonctionnement"),
        ("10.", "Rentabilité — marges &amp; coûts"),
        ("11.", "Financement — échéances &amp; trésorerie"),
        ("12.", "Rapport bailleur — modèle E2A"),
        ("13.", "Mode hors ligne &amp; synchronisation"),
        ("14.", "Suivi du capital initial (mouvements horodatés)"),
        ("15.", "Modules complémentaires (Carte 3D, Pâturages, Pesées, Trésorerie, Paramètres, Synthèse bailleur)"),
        ("16.", "Astuces &amp; raccourcis pratiques"),
        ("17.", "Mises à jour prochaines — feuille de route"),
        ("18.", "Tous les fichiers du projet (inventaire)"),
        ("19.", "Appréciation globale de l'application SAVERDEV"),
        ("20.", "Contacts &amp; assistance"),
    ]
    toc_data = [[Paragraph(n, styles["cell_bold"]), Paragraph(t, styles["cell"])] for n, t in toc_items]
    toc_t = Table(toc_data, colWidths=[1.5*cm, 14.5*cm])
    toc_t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -1), 0.2, GRIS_BORD),
    ]))
    s.append(toc_t)
    s.append(PageBreak())

    # ---------- 1. PRÉSENTATION ----------
    s.append(Paragraph("1. Présentation de l'application SAVERDEV", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    s.append(Paragraph(
        "SAVERDEV (<b>Sahel Vert · Développement</b>) est une application web de gestion "
        "d'élevage bovin d'engraissement et ovin. Elle permet au gérant de piloter "
        "l'ensemble de l'activité : achats et ventes de bétail, alimentation, "
        "dépenses d'exploitation, rentabilité, financement, et reporting bailleur.",
        styles["body"]))
    s.append(Paragraph(
        "L'application est accessible depuis un navigateur web (ordinateur, "
        "tablette ou smartphone). Elle fonctionne également hors ligne : les "
        "saisies effectuées sans connexion sont enregistrées localement et "
        "synchronisées automatiquement dès le retour de la connexion internet.",
        styles["body"]))
    s.append(Paragraph("Principales fonctionnalités", styles["h2"]))
    s.append(ListFlowable([
        ListItem(Paragraph("Tenue d'une <b>comptabilité en partie double</b> (journaux d'achats, ventes, dépenses) avec balance générale.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("Suivi du <b>capital initial</b> en temps réel : chaque opération (ajout ou retrait) est horodatée (jour + heure + minutes) sans modifier le capital initial.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("Gestion des <b>bovins (BOE-xxx)</b> et des <b>ovins (OVN-xxx)</b> avec gestionnaire (SAVERDEV — Souleymane Zakaria).", styles["bullet"]), value="circle"),
        ListItem(Paragraph("Calcul automatique des <b>marges par tête</b>, de la <b>rentabilité globale</b> et des <b>coûts d'engraissement</b>.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("Génération du <b>rapport bailleur</b> selon le modèle E2A (6 KPI colorés + 6 graphiques + tableau mensuel).", styles["bullet"]), value="circle"),
        ListItem(Paragraph("Suivi du <b>financement</b> (capital initial 14 775 000 FCFA), des <b>échéances</b> et de la <b>trésorerie</b>.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("Mode <b>hors ligne</b> avec synchronisation différée et <b>PWA</b> (installable sur mobile).", styles["bullet"]), value="circle"),
    ], bulletType="bullet"))
    s.append(Spacer(1, 4))
    s.append(note_box(
        "<b>Astuce :</b> ce guide décrit l'usage de l'application vu depuis le rôle <b>Bénéficiaire (SAVERDEV)</b>. "
        "Toutes les fonctions de saisie, consultation et pilotage y sont accessibles.",
        styles))
    s.append(PageBreak())

    # ---------- 2. CONNEXION ----------
    s.append(Paragraph("2. Connexion &amp; comptes utilisateurs", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    s.append(Paragraph(
        "L'application utilise 3 rôles distincts avec des droits différents. "
        "Sur la page de connexion, 3 boutons de comptes de démonstration permettent "
        "de se connecter immédiatement sans mot de passe (pour faciliter la prise en main).",
        styles["body"]))
    s.append(Paragraph("Comptes de démonstration", styles["h2"]))
    s.append(section_table(
        ["Bouton", "Rôle", "Email", "Droits"],
        [
            ["IS Bénéficiaire", "BENEFICIAIRE", "beneficiaire@saverdev.org", "Toutes les vues de saisie &amp; consultation"],
            ["BS SINERGI", "SINERGI", "sinergi@saverdev.org", "Lecture seule (rapport bailleur, synthèse, financement)"],
            ["A E2A", "E2A", "e2a@saverdev.org", "Administration &amp; supervision complète"],
        ],
        styles,
        col_widths=[3.5*cm, 3*cm, 5*cm, 4.5*cm]
    ))
    s.append(Spacer(1, 8))
    s.append(Paragraph("Procédure de connexion", styles["h2"]))
    s.append(ListFlowable([
        ListItem(Paragraph("Ouvrez l'application dans votre navigateur.", styles["bullet"]), value="1"),
        ListItem(Paragraph("Cliquez sur le bouton <b>« IS Bénéficiaire »</b> (ou saisissez manuellement votre email et mot de passe).", styles["bullet"]), value="2"),
        ListItem(Paragraph("La page <b>Tableau de bord</b> s'affiche automatiquement.", styles["bullet"]), value="3"),
        ListItem(Paragraph("Pour vous déconnecter, cliquez sur l'icône <b>« Se déconnecter »</b> en haut à droite de la barre latérale.", styles["bullet"]), value="4"),
    ], bulletType="1"))
    s.append(Spacer(1, 4))
    s.append(warning_box(
        "<b>Sécurité :</b> ne partagez jamais vos identifiants. En cas de doubt sur le mot de passe, "
        "contactez l'administrateur E2A pour le réinitialiser.",
        styles))
    s.append(PageBreak())

    # ---------- 3. NAVIGATION ----------
    s.append(Paragraph("3. Navigation : la barre latérale", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    s.append(Paragraph(
        "La <b>barre latérale</b> (à gauche sur ordinateur, accessible via le menu hamburger sur mobile) "
        "contient tous les modules de l'application. Le rôle Bénéficiaire (SAVERDEV) "
        "donne accès à 10 modules principaux :",
        styles["body"]))
    s.append(section_table(
        ["Module", "Icône", "Description"],
        [
            ["Tableau de bord", "Activity", "Vue synthétique : KPIs, graphiques, alertes, historique"],
            ["Saisie", "Edit03", "Journaux comptables (achats, ventes, dépenses, stock) + balance + capital"],
            ["Cheptel", "Beef", "Liste des bovins (BOE) et ovins (OVN) avec fiche détaillée"],
            ["Alimentation", "Salad", "Achats d'aliments + imputation par tête"],
            ["Dépenses", "CreditCard", "Dépenses d'exploitation (vétérinaire, transport, salariat...)"],
            ["Ventes", "ShoppingCart", "Historique des ventes &amp; marges réalisées"],
            ["Rentabilité", "BarChart03", "Analyse des marges, ventilation des coûts, tendances"],
            ["Financement", "Landmark", "Échéances, taux d'utilisation, trésorerie"],
            ["Rapport bailleur", "FileExport", "Rapport imprimable modèle E2A (6 graphiques)"],
            ["Carte 3D", "View", "Vue 3D du cheptel (cube rotatif, parallaxe souris)"],
        ],
        styles,
        col_widths=[4*cm, 3*cm, 9*cm]
    ))
    s.append(Spacer(1, 6))
    s.append(Paragraph("Éléments de l'en-tête", styles["h2"]))
    s.append(ListFlowable([
        ListItem(Paragraph("<b>Sélecteur de mois</b> : filtre les données par mois (par défaut : mois courant).", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Sélecteur de rôle</b> : permet de visualiser l'application depuis un autre rôle (lecture seule pour SINERGI/E2A).", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Mode sombre</b> : bascule entre le thème clair et sombre.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Notifications</b> (cloche en haut à droite) : alertes en temps réel.", styles["bullet"]), value="circle"),
    ], bulletType="bullet"))
    s.append(PageBreak())

    # ---------- 4. TABLEAU DE BORD ----------
    s.append(Paragraph("4. Tableau de bord — vue d'ensemble", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    s.append(Paragraph(
        "Le tableau de bord est la page d'accueil. Il présente en un coup d'œil "
        "l'état du cheptel, la rentabilité, le financement et les alertes en cours.",
        styles["body"]))
    s.append(Paragraph("Blocs principaux", styles["h2"]))
    s.append(ListFlowable([
        ListItem(Paragraph("<b>Bloc Cheptel</b> : bovins actifs, vendus, mortalité, valeur du cheptel.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Bloc Engraissement</b> : durée moyenne, nombre en cycle, poids moyen.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Bloc Alimentation</b> : nombre de sacs, coût total, coût par tête.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Bloc Rentabilité</b> : chiffre d'affaires, coût d'achat, marge totale, marge par tête, taux de marge.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Bloc Financement</b> : montant financé, utilisé, solde, échéances en retard.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Bloc Alertes</b> : nombre d'échéances en retard, dépenses élevées, stock bas, etc.", styles["bullet"]), value="circle"),
    ], bulletType="bullet"))
    s.append(Paragraph("Graphiques interactifs", styles["h2"]))
    s.append(ListFlowable([
        ListItem(Paragraph("<b>Donut « Répartition du cheptel »</b> — vert (en engraissement), violet (vendus), rouge (mortalité).", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>AreaChart « Évolution mensuelle »</b> — chiffre d'affaires, coûts et marge par mois réels.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>RadialBar « Taux de marge »</b> et <b>« Taux d'utilisation financement »</b>.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>BarChart « Ventilation des coûts »</b> — orange (Achat bovin), vert (Alimentation), bleu (Autres coûts). <i>Mêmes couleurs que le donut « Structure des coûts (cumul) » du rapport bailleur.</i>", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>RadarChart « Profil de performance »</b> — rentabilité, cheptel, ventes, alimentation, financement, cycle.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>ComposedChart « Ventes &amp; têtes vendues »</b> — barres (montant) + courbe (nombre de têtes).", styles["bullet"]), value="circle"),
    ], bulletType="bullet"))
    s.append(Spacer(1, 4))
    s.append(note_box(
        "<b>Astuce :</b> les graphiques se chargent progressivement au défilement (LazyMount) "
        "pour préserver la fluidité de la page. Si un graphique n'apparaît pas immédiatement, "
        "défilez légèrement vers le bas, il apparaîtra dès qu'il sera visible.",
        styles))
    s.append(PageBreak())

    # ---------- 5. SAISIE ----------
    s.append(Paragraph("5. Saisie — journaux comptables &amp; suivi du capital", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    s.append(Paragraph(
        "Le module <b>Saisie</b> est le cœur opérationnel de l'application. "
        "Il permet d'enregistrer toutes les opérations comptables en partie double "
        "et de suivre l'évolution du capital initial.",
        styles["body"]))
    s.append(Paragraph("5.1 Les 4 journaux comptables", styles["h2"]))
    s.append(section_table(
        ["Journal", "Comptes mouvementés", "Usage"],
        [
            ["Journal d'achats", "6011 (Débit) / 5711 (Crédit)", "Achat de bétail bovin (BOE) ou ovin (OVN)"],
            ["Journal de ventes", "4111 (Débit) / 7011 (Crédit)", "Vente de bétail"],
            ["Journal des dépenses", "6xxx (Débit) / 5711 (Crédit)", "Dépenses d'exploitation (vétérinaire, transport, salariat...)"],
            ["Gestion de stock", "—", "Entrées/sorties d'aliments (sacs)"],
        ],
        styles,
        col_widths=[4*cm, 5*cm, 7*cm]
    ))
    s.append(Spacer(1, 6))
    s.append(Paragraph("Structure d'un journal", styles["h3"]))
    s.append(Paragraph(
        "Chaque journal affiche un tableau en cascade avec les colonnes : "
        "<b>Date, Numéro de compte, Libellé, Débit, Crédit</b>. "
        "Les totaux et le solde (débitaire ou créditaire) s'affichent en bas.",
        styles["body"]))
    s.append(Paragraph("5.2 La balance comptable", styles["h2"]))
    s.append(Paragraph(
        "Le bouton <b>« Balance comptable »</b> affiche le tableau récapitulatif "
        "par compte avec colonnes Solde N-1, Mouvements N, Solde N, "
        "et conclusion (débitaire / créditaire).",
        styles["body"]))
    s.append(Paragraph("5.3 Le suivi du capital (capital initial)", styles["h2"]))
    s.append(Paragraph(
        "Le bouton <b>« Suivi financement »</b> ouvre la modal <b>« Suivi du capital »</b>. "
        "Cette modal affiche :",
        styles["body"]))
    s.append(ListFlowable([
        ListItem(Paragraph("<b>Capital initial (figé)</b> : 14 775 000 FCFA, toujours visible et JAMAIS modifié par les mouvements.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Ajouts</b> : somme des entrées de capital saisies manuellement.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Retraits</b> : somme des sorties de capital saisies manuellement.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Solde actuel</b> : = capital initial + ajouts − retraits.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Historique des opérations</b> : liste horodatée (jour + heure + minutes) triée du plus récent au plus ancien.", styles["bullet"]), value="circle"),
    ], bulletType="bullet"))
    s.append(Spacer(1, 4))
    s.append(warning_box(
        "<b>Important :</b> le capital initial reste <b>STATIQUE</b>. "
        "On ne modifie jamais sa valeur directement. À la place, on enregistre "
        "des <b>mouvements manuels</b> (ajout ou retrait) qui sont horodatés et "
        "viennent incrémenter ou décrémenter le solde restant.",
        styles))
    s.append(PageBreak())

    # ---------- 5.4 (suite) Formulaire d'ajout d'un mouvement ----------
    s.append(Paragraph("5.4 Ajouter un mouvement sur le capital", styles["h2"]))
    s.append(Paragraph(
        "Dans la modal « Suivi du capital », le formulaire <b>« Nouvelle opération "
        "sur le capital »</b> permet d'enregistrer un ajout ou un retrait :",
        styles["body"]))
    s.append(ListFlowable([
        ListItem(Paragraph("<b>Date &amp; heure</b> : champ datetime-local pré-rempli avec la date et l'heure actuelles (modifiable).", styles["bullet"]), value="1"),
        ListItem(Paragraph("<b>Sens de l'opération</b> : choisir « − Retrait (sortie de capital) » ou « + Ajout (entrée de capital) ».", styles["bullet"]), value="2"),
        ListItem(Paragraph("<b>Montant</b> : saisir le montant en FCFA (ex: 150000).", styles["bullet"]), value="3"),
        ListItem(Paragraph("<b>Motif / libellé</b> : décrire l'opération (ex: « Achat 5 sacs son », « Vente 2 bovins »).", styles["bullet"]), value="4"),
        ListItem(Paragraph("Cliquer sur le bouton <b>« − Soustraire du capital »</b> (rouge) ou <b>« + Ajouter au capital »</b> (vert).", styles["bullet"]), value="5"),
    ], bulletType="1"))
    s.append(Spacer(1, 4))
    s.append(note_box(
        "<b>Bouton dynamique :</b> le bouton de soumission change de couleur (rouge ↔ vert) "
        "et de libellé (« Soustraire » ↔ « Ajouter ») selon le sens sélectionné, "
        "pour éviter toute erreur de saisie.",
        styles))
    s.append(Paragraph("Exemple de calcul en cascade", styles["h3"]))
    s.append(section_table(
        ["Date &amp; heure", "Libellé", "Type", "Montant", "Solde après"],
        [
            ["15/10/2025 09:30", "Achat 5 sacs son", "Retrait", "− 150 000", "14 625 000"],
            ["16/10/2025 14:45", "Vente 2 bovins", "Ajout", "+ 350 000", "14 975 000"],
            ["17/10/2025 11:15", "Vétérinaire", "Retrait", "− 75 000", "14 900 000"],
        ],
        styles,
        col_widths=[3.5*cm, 4.5*cm, 2.5*cm, 2.5*cm, 3*cm]
    ))
    s.append(Spacer(1, 4))
    s.append(Paragraph(
        "Le solde après chaque opération est calculé automatiquement en cascade : "
        "chaque mouvement reprend le solde précédent et y ajoute (entrée) ou soustrait (sortie) le montant. "
        "Le <b>capital initial reste 14 775 000 FCFA</b> dans tous les cas.",
        styles["body"]))
    s.append(Paragraph("5.5 Supprimer un mouvement", styles["h2"]))
    s.append(Paragraph(
        "Chaque ligne de mouvement comporte un bouton <b>« Supprimer ce mouvement »</b> "
        "(icône d'alerte à droite). La suppression est immédiate et recalcule le solde "
        "en cascade pour les mouvements suivants — sans toucher au capital initial.",
        styles["body"]))
    s.append(PageBreak())

    # ---------- 6. CHEPTEL ----------
    s.append(Paragraph("6. Cheptel — bovins &amp; ovins", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    s.append(Paragraph(
        "Le module <b>Cheptel</b> liste tous les animaux : <b>bovins</b> (identifiants "
        "<b>BOE-001, BOE-002, ...</b>) et <b>ovins</b> (identifiants <b>OVN-001, ...</b>). "
        "Le gérant de tous les animaux est <b>SAVERDEV — Souleymane Zakaria</b>.",
        styles["body"]))
    s.append(Paragraph("Fonctions disponibles", styles["h2"]))
    s.append(ListFlowable([
        ListItem(Paragraph("<b>Recherche</b> par identifiant, race ou statut.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Filtres par statut</b> : En engraissement / Vendu / Mort.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Clic sur un animal</b> → ouverture de la <b>fiche détaillée</b> (identification, coûts, marge, progressions).", styles["bullet"]), value="circle"),
    ], bulletType="bullet"))
    s.append(Paragraph("Fiche détaillée d'un animal", styles["h2"]))
    s.append(Paragraph(
        "La fiche d'un bovin ou ovin affiche :",
        styles["body"]))
    s.append(ListFlowable([
        ListItem(Paragraph("<b>Identification</b> : identifiant (BOE-xxx ou OVN-xxx), race, sexe, espèce, gestionnaire, date d'achat, prix d'achat, poids.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Coûts &amp; marge</b> : coût d'achat, coût d'engraissement (cumul auto), autres coûts (imputés), coût de revient, prix de vente, marge réalisée.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Progression</b> : barre de progression vers la rentabilité (coût cumulé vs prix de vente attendu).", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Tags personnalisables</b> : étiquettes de couleur pour marquer un animal (ex: « à vendre », « suivi vétérinaire »).", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Photos</b> : photo de profil et historique (si téléversées).", styles["bullet"]), value="circle"),
    ], bulletType="bullet"))
    s.append(PageBreak())

    # ---------- 7. ALIMENTATION ----------
    s.append(Paragraph("7. Alimentation — imputation par tête", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    s.append(Paragraph(
        "Le module <b>Alimentation</b> enregistre les achats d'aliments (son, tourteau coton, etc.) "
        "et les impute automatiquement aux bovins concernés, à parts égales.",
        styles["body"]))
    s.append(Paragraph("Formulaire d'ajout d'une alimentation", styles["h2"]))
    s.append(ListFlowable([
        ListItem(Paragraph("<b>Date</b> de l'achat.", styles["bullet"]), value="1"),
        ListItem(Paragraph("<b>Produit</b> (ex: « Son de blé », « Tourteau coton »).", styles["bullet"]), value="2"),
        ListItem(Paragraph("<b>Quantité</b> (en sacs ou kg) + unité.", styles["bullet"]), value="3"),
        ListItem(Paragraph("<b>Coût total</b> du lot (en FCFA).", styles["bullet"]), value="4"),
        ListItem(Paragraph("<b>Nombre de bovins concernés</b> (sur qui imputer).", styles["bullet"]), value="5"),
        ListItem(Paragraph("<b>Calcul automatique</b> : coût par tête = coût total / nb bovins. La part est ajoutée au champ <i>coutsEngraissement</i> de chaque bovin sélectionné.", styles["bullet"]), value="6"),
    ], bulletType="1"))
    s.append(note_box(
        "<b>Exemple :</b> achat de 10 sacs de son à 60 000 FCFA pour 3 bovins → "
        "coût par tête = 20 000 FCFA. Chaque bovin voit son coût d'engraissement "
        "augmenter de 20 000 FCFA automatiquement.",
        styles))
    s.append(PageBreak())

    # ---------- 8. DÉPENSES ----------
    s.append(Paragraph("8. Dépenses d'exploitation", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    s.append(Paragraph(
        "Le module <b>Dépenses</b> enregistre les charges d'exploitation de l'élevage. "
        "Chaque dépense peut être affectée à un ou plusieurs bovins (imputation) ou "
        "laissée en charge globale (sans imputation).",
        styles["body"]))
    s.append(Paragraph("Catégories de dépenses", styles["h2"]))
    s.append(section_table(
        ["Catégorie", "Compte", "Exemples"],
        [
            ["Vétérinaire", "615", "Vaccins, soins, interventions"],
            ["Transport", "624", "Déplacement bétail, carburant"],
            ["Salariat", "661", "Main-d'œuvre journalière"],
            ["Aliment bétail", "6012", "Achats complémentaires d'aliments"],
            ["Immobilisation", "23", "Matériel, constructions"],
            ["Autres", "68", "Taxes, frais bancaires, imprévus"],
        ],
        styles,
        col_widths=[4*cm, 2.5*cm, 9.5*cm]
    ))
    s.append(Spacer(1, 6))
    s.append(note_box(
        "<b>Astuce :</b> les dépenses imputées à un bovin spécifique viennent "
        "augmenter son champ <i>autresCouts</i> et donc son coût de revient total. "
        "Utilisez l'imputation pour calculer la <b>marge réelle par tête</b>.",
        styles))
    s.append(PageBreak())

    # ---------- 9. VENTES ----------
    s.append(Paragraph("9. Ventes", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    s.append(Paragraph("9.1 À quoi sert ce module ?", styles["h2"]))
    s.append(Paragraph(
        "Le module <b>Ventes</b> est le <b>point de sortie financier</b> de l'élevage. "
        "Sans lui, impossible de mesurer la rentabilité réelle de l'activité. "
        "Il joue 4 rôles essentiels :",
        styles["body"]))
    s.append(ListFlowable([
        ListItem(Paragraph("<b>Enregistrer la sortie d'un animal</b> : passage automatique du statut <i>EN_ENGRAISSEMENT</i> à <i>VENDU</i>, avec date de vente et prix.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Figer le coût de revient</b> au moment de la vente : la somme des coûts d'achat + engraissement + dépenses imputées est figée définitivement pour permettre un audit ultérieur (même si des dépenses antérieures sont modifiées).", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Calculer la marge réalisée</b> : <b>marge = prix de vente − coût de revient</b>. Indispensable pour savoir si l'opération a été rentable.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Alimenter le journal comptable de ventes</b> (compte 4111 Clients au débit / 7011 Ventes de bétail au crédit) et le suivi du capital (la vente ajoute au solde du capital initial).", styles["bullet"]), value="circle"),
    ], bulletType="bullet"))
    s.append(note_box(
        "<b>Pourquoi c'est crucial :</b> sans le module Ventes, le tableau de bord "
        "afficherait zéro chiffre d'affaires, zéro marge, et le rapport bailleur "
        "serait vide. Le module Ventes est donc la <b>clé de voûte du pilotage "
        "rentabilité</b> de l'élevage.",
        styles))
    s.append(Paragraph("9.2 KPI affichés dans le module", styles["h2"]))
    s.append(section_table(
        ["KPI", "Formule", "Utilité"],
        [
            ["Chiffre d'affaires (CA)", "Σ prix de vente", "Revenus bruts de l'élevage"],
            ["Marge totale", "Σ (prix vente − coût revient)", "Bénéfice net réalisé"],
            ["Marge par tête", "Marge totale / nb vendus", "Rentabilité unitaire moyenne"],
            ["Nombre de têtes vendues", "Comptage", "Volume de commercialisation"],
            ["Panier moyen", "CA / nb vendus", "Prix de vente moyen"],
        ],
        styles,
        col_widths=[4.5*cm, 6*cm, 5.5*cm]
    ))
    s.append(Spacer(1, 6))
    s.append(Paragraph("9.3 Formulaire d'ajout d'une vente", styles["h2"]))
    s.append(ListFlowable([
        ListItem(Paragraph("<b>Date</b> de la vente.", styles["bullet"]), value="1"),
        ListItem(Paragraph("<b>Identifiant du bovin</b> (sélection dans la liste des animaux <i>EN_ENGRAISSEMENT</i> — les vendus et morts sont exclus).", styles["bullet"]), value="2"),
        ListItem(Paragraph("<b>Prix unitaire</b> (en FCFA).", styles["bullet"]), value="3"),
        ListItem(Paragraph("<b>Nombre de sujets vendus</b> (généralement 1, mais possible de grouper plusieurs animaux à un même acheteur).", styles["bullet"]), value="4"),
        ListItem(Paragraph("<b>Acheteur</b> (nom du client — conservé dans <i>clientVente</i>).", styles["bullet"]), value="5"),
    ], bulletType="1"))
    s.append(Paragraph(
        "Après validation : le statut du bovin passe automatiquement à <b>VENDU</b>, "
        "sa date de vente et son prix de vente sont enregistrés, et la marge est "
        "calculée instantanément. Le journal comptable de ventes est mis à jour "
        "(compte 4111 débit / 7011 crédit), et la vente est également visible dans "
        "le <b>suivi du capital</b> comme une entrée.",
        styles["body"]))
    s.append(Paragraph("9.4 Historique des ventes", styles["h2"]))
    s.append(Paragraph(
        "Le module affiche un <b>tableau filtrable</b> de toutes les ventes avec : "
        "identifiant, race, acheteur, date, prix de vente, coût de revient figé, "
        "marge réalisée (couleur verte si positive, rouge si négative). "
        "Ce tableau permet d'identifier rapidement les <b>ventes à perte</b> et "
        "les <b>meilleures opérations</b> pour reproduire la stratégie gagnante.",
        styles["body"]))
    s.append(warning_box(
        "<b>Attention :</b> ne pas oublier d'enregistrer une vente dans les "
        "24 heures qui suivent la transaction. Au-delà, le calcul du capital "
        "restant et le rapport bailleur mensuel seront erronés.",
        styles))
    s.append(PageBreak())

    # ---------- 10. RENTABILITÉ ----------
    s.append(Paragraph("10. Rentabilité — marges &amp; coûts", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    s.append(Paragraph(
        "Le module <b>Rentabilité</b> fournit une analyse détaillée des marges "
        "et de la structure des coûts.",
        styles["body"]))
    s.append(Paragraph("KPI principaux", styles["h2"]))
    s.append(section_table(
        ["KPI", "Formule", "Lecture"],
        [
            ["Chiffre d'affaires (CA)", "Σ prix de vente des bovins vendus", "Revenus bruts"],
            ["Coût d'achat", "Σ prix d'achat des bovins vendus", "Capital immobilisé"],
            ["Coût engraissement", "Σ coutsEngraissement des vendus", "Alimentation imputée"],
            ["Marge totale", "CA − coût d'achat − coût engrais − autres coûts", "Bénéfice net"],
            ["Marge par tête", "Marge totale / nb vendus", "Rentabilité unitaire"],
            ["Taux de marge", "(Marge / CA) × 100", "Pourcentage de rentabilité"],
        ],
        styles,
        col_widths=[4.5*cm, 6*cm, 5.5*cm]
    ))
    s.append(Spacer(1, 6))
    s.append(Paragraph("Graphiques", styles["h2"]))
    s.append(ListFlowable([
        ListItem(Paragraph("<b>Waterfall « Cascade de marge »</b> : CA (vert) → coût achat (rouge) → coût engrais (orange) → marge (teal).", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>4 cartes KPI avec mini jauges</b> (anneaux circulaires animés).", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Jauge demi-circulaire « Taux de marge »</b> avec aiguille rotative.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Barre empilée « Composition du CA »</b> : rouge (achat) + orange (engrais) + vert (marge).", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Donut « Ventilation des coûts »</b> — orange (Achat bovins), vert (Alimentation), bleu (Autres coûts).", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>BarChart « Marges par bovin vendu »</b> : barres vertes (marge positive) ou rouges (perte).", styles["bullet"]), value="circle"),
    ], bulletType="bullet"))
    s.append(note_box(
        "<b>Cohérence des couleurs :</b> la « Ventilation des coûts » (vue Rentabilité) "
        "utilise exactement les <b>mêmes couleurs</b> que le donut « Structure des coûts (cumul) » "
        "du rapport bailleur : <font color='#F59E0B'>orange (achat bovin)</font>, "
        "<font color='#10B981'>vert (alimentation)</font>, "
        "<font color='#3B82F6'>bleu (autres coûts)</font>.",
        styles))
    s.append(PageBreak())

    # ---------- 11. FINANCEMENT ----------
    s.append(Paragraph("11. Financement — échéances &amp; trésorerie", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    s.append(Paragraph(
        "Le module <b>Financement</b> suit le financement accordé par le bailleur "
        "(5 000 000 FCFA initialement), les échéances de remboursement, "
        "le taux d'utilisation et la trésorerie disponible.",
        styles["body"]))
    s.append(Paragraph("Données affichées", styles["h2"]))
    s.append(ListFlowable([
        ListItem(Paragraph("<b>Montant financé</b> (capital de départ du bailleur).", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Montant utilisé</b> (somme déjà dépensée).", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Solde disponible</b> = Montant financé − Montant utilisé.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Taux d'utilisation</b> = Montant utilisé / Montant financé × 100.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Échéances</b> : nombre payées, à payer, en retard (avec montants et dates prévues).", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Trésorerie disponible</b> (liquidités actuelles).", styles["bullet"]), value="circle"),
    ], bulletType="bullet"))
    s.append(warning_box(
        "<b>À surveiller en priorité :</b> le nombre d'échéances en retard. "
        "Une alerte critique s'affiche en haut du tableau de bord dès qu'une échéance "
        "passe en retard. Pensez à marquer une échéance comme <b>« Payée »</b> "
        "dès que le remboursement est effectué.",
        styles))
    s.append(PageBreak())

    # ---------- 12. RAPPORT BAILLEUR ----------
    s.append(Paragraph("12. Rapport bailleur — modèle E2A", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    s.append(Paragraph(
        "Le module <b>Rapport bailleur</b> génère un rapport imprimable conforme "
        "au modèle E2A. Il est destiné à être envoyé mensuellement au bailleur SINERGI.",
        styles["body"]))
    s.append(Paragraph("Structure du rapport", styles["h2"]))
    s.append(ListFlowable([
        ListItem(Paragraph("<b>En-tête vert foncé</b> avec logo SAVERDEV.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>6 KPI colorés</b> (modèle Excel E2A exact) : bovins actifs, CA cumulé, marge totale, marge/tête, taux utilisation, trésorerie.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>6 graphiques</b> : AreaChart (évolution cheptel), BarChart (achats vs ventes), BarChart (CA &amp; marge), LineChart (marge/tête &amp; coût/tête), Donut (structure des coûts cumul), BarChart (financement vs trésorerie).", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Annexe</b> : tableau récapitulatif mensuel (12 mois × 9 colonnes) + échéances + alertes.", styles["bullet"]), value="circle"),
    ], bulletType="bullet"))
    s.append(Paragraph("Impression &amp; export PDF", styles["h2"]))
    s.append(ListFlowable([
        ListItem(Paragraph("Cliquer sur le bouton <b>« Imprimer / Export PDF »</b> en haut du rapport.", styles["bullet"]), value="1"),
        ListItem(Paragraph("La boîte de dialogue d'impression du navigateur s'ouvre.", styles["bullet"]), value="2"),
        ListItem(Paragraph("Choisir <b>« Enregistrer au format PDF »</b> comme destination.", styles["bullet"]), value="3"),
        ListItem(Paragraph("Nommer le fichier (ex: <b>rapport-bailleur-2025-10.pdf</b>) et enregistrer.", styles["bullet"]), value="4"),
    ], bulletType="1"))
    s.append(note_box(
        "<b>Astuce :</b> le rapport est conçu pour s'imprimer en <b>paysage A4</b>. "
        "Vérifiez l'orientation dans la boîte de dialogue d'impression.",
        styles))
    s.append(PageBreak())

    # ---------- 13. MODE HORS LIGNE ----------
    s.append(Paragraph("13. Mode hors ligne &amp; synchronisation", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    s.append(Paragraph(
        "L'application fonctionne <b>hors ligne</b>. Toutes les saisies effectuées "
        "sans connexion internet sont enregistrées localement (IndexedDB) et "
        "synchronisées automatiquement dès le retour de la connexion.",
        styles["body"]))
    s.append(Paragraph("Indicateurs de connexion", styles["h2"]))
    s.append(ListFlowable([
        ListItem(Paragraph("<b>« En ligne »</b> (vert) : connexion active, sauvegarde immédiate en base.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>« Hors ligne »</b> (ambre) : sauvegarde différée en IndexedDB.", styles["bullet"]), value="circle"),
    ], bulletType="bullet"))
    s.append(Paragraph("Comportement", styles["h2"]))
    s.append(ListFlowable([
        ListItem(Paragraph("Si la connexion est perdue pendant une saisie, l'application affiche <b>« Connexion perdue — sauvegardé hors ligne »</b>.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("À la reconnexion, les saisies en attente sont <b>automatiquement synchronisées</b> en base, sans action manuelle.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("Une notification <b>« Saisie enregistrée hors ligne »</b> apparaît à chaque sauvegarde hors ligne.", styles["bullet"]), value="circle"),
    ], bulletType="bullet"))
    s.append(Paragraph("PWA — installation sur mobile", styles["h2"]))
    s.append(Paragraph(
        "L'application est <b>installable</b> comme une application mobile native "
        "(PWA). Sur Chrome mobile : menu → <b>« Ajouter à l'écran d'accueil »</b>. "
        "L'icône SAVERDEV apparaît parmi vos applications.",
        styles["body"]))
    s.append(PageBreak())

    # ---------- 14. CAPITAL INITIAL ----------
    s.append(Paragraph("14. Suivi du capital initial (mouvements horodatés)", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    s.append(Paragraph(
        "Cette section détaille la philosophie du suivi du capital initial, "
        "qui est une spécificité importante de l'application SAVERDEV.",
        styles["body"]))
    s.append(Paragraph("Règle d'or", styles["h2"]))
    s.append(danger_box(
        "<b>Le capital initial (14 775 000 FCFA) est STATIQUE.</b> "
        "On ne modifie JAMAIS sa valeur directement. "
        "À la place, on enregistre des <b>mouvements manuels</b> (ajout ou retrait) "
        "qui viennent incrémenter ou décrémenter le <b>solde restant</b>, "
        "sans toucher au capital initial.",
        styles))
    s.append(Paragraph("Pourquoi cette règle ?", styles["h2"]))
    s.append(Paragraph(
        "Le capital initial représente l'investissement de départ du bailleur. "
        "Il doit rester <b>visible et immuable</b> dans le temps pour préserver "
        "la traçabilité comptable et permettre au gérant de comparer l'évolution "
        "réelle du capital à la valeur d'origine.",
        styles["body"]))
    s.append(Paragraph("Chaque mouvement est horodaté", styles["h2"]))
    s.append(Paragraph(
        "À chaque fois qu'on soustrait ou qu'on ajoute un montant au capital, "
        "l'application enregistre la <b>date complète avec heures et minutes</b> "
        "(format <b>JJ/MM/AAAA HH:MM</b>). Cela permet de reconstituer l'historique "
        "exact des opérations, indispensable pour l'audit et le reporting bailleur.",
        styles["body"]))
    s.append(section_table(
        ["Champ", "Description"],
        [
            ["Date &amp; heure", "Timestamp complet (jour + heure + minutes)"],
            ["Libellé", "Motif de l'opération (ex: « Achat 5 sacs son »)"],
            ["Type", "ENTREE (ajout) ou SORTIE (retrait)"],
            ["Montant", "Somme en FCFA"],
            ["Solde après", "Solde calculé en cascade après ce mouvement"],
            ["Saisie par", "Utilisateur qui a enregistré l'opération"],
        ],
        styles,
        col_widths=[4*cm, 12*cm]
    ))
    s.append(PageBreak())

    # ---------- 15. MODULES COMPLÉMENTAIRES ----------
    s.append(Paragraph("15. Modules complémentaires", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    s.append(Paragraph(
        "En plus des modules principaux décrits précédemment, l'application SAVERDEV "
        "propose un ensemble de modules complémentaires accessibles depuis la barre "
        "latérale. Ces modules enrichissent le pilotage de l'élevage et facilitent "
        "la gestion quotidienne.",
        styles["body"]))
    s.append(Paragraph("15.1 Carte 3D — vue immersive du cheptel", styles["h2"]))
    s.append(Paragraph(
        "La <b>Carte 3D</b> propose une représentation visuelle interactive du "
        "cheptel. Les bovins et ovins sont affichés sous forme de cubes 3D animés "
        "avec un effet de parallaxe qui suit les mouvements de la souris. Les "
        "animaux en retard de rentabilité sont signalés en rouge, ceux à bonne "
        "marge en vert. Le badge <b>URGENT</b> flotte au-dessus des animaux "
        "nécessitant une attention immédiate.",
        styles["body"]))
    s.append(note_box(
        "<b>Astuce :</b> si les animations 3D ralentissent l'affichage, activez "
        "la préférence système <i>réduire les animations</i> ; l'application "
        "désactive automatiquement les rotations de cubes.",
        styles))
    s.append(Paragraph("15.2 Pâturages — gestion des zones", styles["h2"]))
    s.append(Paragraph(
        "Le module <b>Pâturages</b> recense les zones de pâturage exploitées : "
        "nom, superficie (hectares), localisation, capacité d'accueil (nombre "
        "de têtes) et taux d'occupation. Il permet de répartir le cheptel sur "
        "les différentes zones pour éviter le surpâturage.",
        styles["body"]))
    s.append(Paragraph("15.3 Pesées — suivi du poids", styles["h2"]))
    s.append(Paragraph(
        "Le module <b>Pesées</b> enregistre les pesées régulières de chaque "
        "animal. Chaque pesée est datée, effectuée par un opérateur identifié, "
        "et liée à un bovin. Le suivi des courbes de poids permet d'évaluer "
        "le GMQ (gain moyen quotidien) et d'ajuster l'alimentation.",
        styles["body"]))
    s.append(Paragraph("15.4 Trésorerie — liquidités", styles["h2"]))
    s.append(Paragraph(
        "Le module <b>Trésorerie</b> suit les liquidités de l'exploitation : "
        "encaissements (ventes, apports), décaissements (achats, dépenses, "
        "remboursements d'échéances), et solde net. Il complète le suivi du "
        "capital initial en visualisant les flux financiers réels.",
        styles["body"]))
    s.append(Paragraph("15.5 Synthèse bailleur — vue SINERGI", styles["h2"]))
    s.append(Paragraph(
        "La <b>Synthèse bailleur</b> est une vue en lecture seule destinée au "
        "bailleur SINERGI. Elle présente une synthèse consolidée du financement, "
        "des échéances, de l'utilisation des fonds et de la rentabilité globale. "
        "Accessible aux rôles SINERGI et E2A.",
        styles["body"]))
    s.append(Paragraph("15.6 Paramètres — configuration", styles["h2"]))
    s.append(Paragraph(
        "Le module <b>Paramètres</b> regroupe les réglages applicatifs : "
        "capital initial (rarement modifié — utilisé comme référence statique), "
        "seuils d'alertes (stock minimum, dépenses mensuelles maximales), "
        "informations sur l'élevage, et préférences d'affichage.",
        styles["body"]))
    s.append(danger_box(
        "<b>Attention :</b> la modification du capital initial dans les "
        "paramètres ne supprime pas les mouvements déjà enregistrés. Elle "
        "recalcule simplement le solde restant à partir de la nouvelle valeur. "
        "À utiliser avec parcimonie.",
        styles))
    s.append(PageBreak())

    # ---------- 16. ASTUCES ----------
    s.append(Paragraph("16. Astuces &amp; raccourcis pratiques", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    s.append(Paragraph("Bonnes pratiques quotidiennes", styles["h2"]))
    s.append(ListFlowable([
        ListItem(Paragraph("<b>Saisir au fur et à mesure</b> : ne pas attendre la fin du mois pour enregistrer les opérations. Cela fausse les KPIs et les alertes.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Vérifier le tableau de bord le matin</b> : alertes en retard, dépenses élevées, stock bas.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Imputer les dépenses aux bovins concernés</b> pour avoir des marges réelles par tête.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Marquer les échéances payées</b> dès que le remboursement est effectué (sinon elles restent en retard).", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Générer le rapport bailleur en fin de mois</b> et l'archiver (PDF) pour l'historique.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Sauvegarder régulièrement</b> : la base est sauvegardée à chaque saisie, mais en cas de doute, contacter l'administrateur.", styles["bullet"]), value="circle"),
    ], bulletType="bullet"))
    s.append(Paragraph("Affichage &amp; accessibilité", styles["h2"]))
    s.append(section_table(
        ["Action", "Résultat"],
        [
            ["Sélecteur de mois (en-tête)", "Filtrer les données par mois"],
            ["Sélecteur de rôle (en-tête)", "Visualiser l'app depuis un autre rôle"],
            ["Bouton « Mode sombre »", "Basculer thème clair / sombre"],
            ["Menu hamburger (mobile)", "Ouvrir / fermer la barre latérale"],
            ["Notifications (F8)", "Ouvrir le panneau des notifications"],
            ["Notifications (alt+T)", "Raccourci clavier notifications"],
        ],
        styles,
        col_widths=[6*cm, 10*cm]
    ))
    s.append(Spacer(1, 6))
    s.append(note_box(
        "<b>Accessibilité :</b> l'application respecte la préférence système <i>prefers-reduced-motion</i>. "
        "Si votre appareil est configuré pour réduire les animations, les effets 3D "
        "et rotations de cubes sont automatiquement désactivés.",
        styles))
    s.append(PageBreak())

    # ---------- 17. MISES À JOUR PROCHAINES ----------
    s.append(Paragraph("17. Mises à jour prochaines — feuille de route", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    s.append(Paragraph(
        "L'application SAVERDEV est en évolution continue. Voici les modules "
        "et fonctionnalités prévus dans les prochaines mises à jour. "
        "Cette feuille de route est indicative et peut évoluer selon les "
        "priorités du bailleur et les retours du gérant.",
        styles["body"]))
    s.append(Paragraph("17.1 Workflow de validation à 2 niveaux", styles["h2"]))
    s.append(Paragraph(
        "Mise en place d'un <b>workflow d'approbation</b> : les saisies du "
        "Bénéficiaire (achats, ventes, dépenses) seront marquées « EN_ATTENTE » "
        "et devront être validées par l'administrateur E2A avant d'être prises "
        "en compte dans les KPIs et le rapport bailleur. Cela renforce la "
        "traçabilité et la fiabilité comptable.",
        styles["body"]))
    s.append(Paragraph("17.2 Sauvegarde automatique (Backup)", styles["h2"]))
    s.append(Paragraph(
        "Un module de <b>sauvegarde automatique</b> sera activé : export "
        "périodique de la base de données (format JSON/CSV), archivage horodaté, "
        "et restauration en un clic. Accessible au rôle E2A uniquement.",
        styles["body"]))
    s.append(Paragraph("17.3 Notifications temps réel", styles["h2"]))
    s.append(Paragraph(
        "Système de <b>notifications push</b> : alertes échéances, stock bas, "
        "mortalité, dépenses hors budget. Les notifications seront affichées "
        "en cloche en haut à droite et archivées dans un centre de notifications "
        "consultable. Raccourcis <b>F8</b> et <b>alt+T</b> déjà disponibles.",
        styles["body"]))
    s.append(Paragraph("17.4 Module Soins vétérinaires", styles["h2"]))
    s.append(Paragraph(
        "Le module <b>Soins</b> centralisera les interventions vétérinaires : "
        "vaccins, traitements antiparasitaires, interventions curatives. "
        "Chaque soin sera daté, coûté, et imputable à un bovin ou à tout le "
        "cheptel. Le calendrier vaccinal sera généré automatiquement.",
        styles["body"]))
    s.append(Paragraph("17.5 Comparaison de périodes & performance par race", styles["h2"]))
    s.append(Paragraph(
        "Deux nouveaux graphiques déjà en place seront enrichis : "
        "<b>comparaison mois N vs mois N-1</b> (CA, coûts, marge) et "
        "<b>performance par race</b> (marge moyenne/tête, durée engraissement, "
        "taux de mortalité par race).",
        styles["body"]))
    s.append(Paragraph("17.6 Export Excel & impression étendue", styles["h2"]))
    s.append(Paragraph(
        "L'export PDF du <b>rapport bailleur</b> sera complété par un export "
        "<b>Excel (.xlsx)</b> du tableau mensuel complet (12 mois × 18 colonnes). "
        "L'impression du <b>tableau de bord</b> et de la <b>fiche bovin</b> "
        "sera également disponible.",
        styles["body"]))
    s.append(Paragraph("17.7 Application mobile native", styles["h2"]))
    s.append(Paragraph(
        "L'<b>application mobile</b> (React Native / Expo) est en cours de "
        "développement. Elle offrira : scan de codes QR pour identifier les "
        "animaux en pickle, saisie rapide depuis le terrain, photos de profil "
        "depuis l'appareil photo, et notifications push natives.",
        styles["body"]))
    s.append(Paragraph("17.8 Mode hors ligne avancé", styles["h2"]))
    s.append(Paragraph(
        "Amélioration du mode hors ligne : <b>file d'attente persistante</b> "
        "(IndexedDB), <b>sync incrémentale</b> (seules les saisies modifiées "
        "sont renvoyées), <b>conflit de version</b> géré automatiquement, et "
        "<b>cache des données consultées</b> (cheptel, alimentation) accessible "
        "hors ligne.",
        styles["body"]))
    s.append(Paragraph("17.9 Tableau de bord personnalisable", styles["h2"]))
    s.append(Paragraph(
        "Le tableau de bord deviendra <b>personnalisable</b> : choix des KPIs "
        "affichés, réorganisation des blocs par glisser-déposer, et "
        "<b>tableaux de bord dédiés</b> par rôle (vue synthétique pour SINERGI, "
        "vue opérationnelle pour SAVERDEV, vue d'audit pour E2A).",
        styles["body"]))
    s.append(Paragraph("17.10 Rapports personnalisés", styles["h2"]))
    s.append(Paragraph(
        "Un <b>générateur de rapports</b> permettra de créer des rapports "
        "personnalisés : sélection de la période, des indicateurs, des graphiques, "
        "et du format (PDF, Excel, CSV). Idéal pour répondre aux demandes "
        "spécifiques du bailleur ou des partenaires.",
        styles["body"]))
    s.append(warning_box(
        "<b>Note :</b> les dates de livraison de ces mises à jour sont indicatives "
        "et dépendent des priorités du bailleur SINERGI, des retours du gérant "
        "SAVERDEV, et de la disponibilité de l'équipe E2A. N'hésitez pas à "
        "formuler vos besoins via l'administrateur E2A.",
        styles))
    s.append(PageBreak())

    # ---------- 18. TOUS LES FICHIERS DU PROJET ----------
    s.append(Paragraph("18. Tous les fichiers du projet (inventaire)", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    s.append(Paragraph(
        "Cette section recense l'ensemble des fichiers du projet SAVERDEV, "
        "pour fournir au gérant et au bailleur une vision complète de la "
        "structure de l'application. Chaque catégorie est décrite avec son "
        "rôle et son contenu.",
        styles["body"]))
    s.append(Paragraph("18.1 Vues (interfaces utilisateur)", styles["h2"]))
    s.append(Paragraph(
        "Les <b>vues</b> sont les écrans affichés à l'utilisateur. Elles se "
        "trouvent dans <b><font color='#4A3728' face='Courier'>src/components/views/</font></b> :",
        styles["body"]))
    s.append(section_table(
        ["Fichier vue", "Module / Rôle"],
        [
            ["login-view.tsx", "Page de connexion + comptes démo + bouton guide PDF"],
            ["dashboard-view.tsx", "Tableau de bord (6 KPI + 6 graphiques + alertes)"],
            ["saisie-view.tsx", "Saisie (4 journaux + balance + suivi du capital)"],
            ["bovins-view.tsx", "Liste du cheptel (bovins + ovins) avec filtres"],
            ["fiche-bovin-view.tsx", "Fiche détaillée d'un animal (coûts, marge, progression)"],
            ["alimentation-view.tsx", "Achats d'aliments + imputation par tête"],
            ["depenses-view.tsx", "Dépenses d'exploitation (6 catégories)"],
            ["ventes-view.tsx", "Ventes (formulaire + KPI + historique)"],
            ["rentabilite-view.tsx", "Rentabilité (waterfall + jauges + ventilation)"],
            ["financement-view.tsx", "Financement (échéances, trésorerie, taux util.)"],
            ["rapport-bailleur-view.tsx", "Rapport bailleur E2A (6 KPI + 6 graphiques)"],
            ["carte-3d-view.tsx", "Vue 3D du cheptel (cubes animés + parallaxe)"],
            ["paturages-view.tsx", "Pâturages (zones, superficie, capacité)"],
            ["pesees-view.tsx", "Pesées (suivi du poids + GMQ)"],
            ["tresorerie-view.tsx", "Trésorerie (encaissements / décaissements)"],
            ["bailleur-synthese-view.tsx", "Synthèse bailleur SINERGI (lecture seule)"],
            ["parametres-view.tsx", "Paramètres (capital initial, seuils, prefs)"],
            ["_shared.tsx", "Composants partagés (ViewHeader, KpiCard)"],
        ],
        styles,
        col_widths=[6*cm, 10*cm]
    ))
    s.append(Spacer(1, 6))
    s.append(Paragraph("18.2 API Routes (backend)", styles["h2"]))
    s.append(Paragraph(
        "Les <b>API routes</b> sont les points d'entrée du backend. Elles se "
        "trouvent dans <b><font color='#4A3728' face='Courier'>src/app/api/</font></b> :",
        styles["body"]))
    s.append(section_table(
        ["Endpoint API", "Rôle"],
        [
            ["/api/auth", "Authentification (login/logout/session)"],
            ["/api/dashboard", "Agrégation KPIs + graphiques tableau de bord"],
            ["/api/bovins", "CRUD bovins (avec espèce + gestionnaire)"],
            ["/api/alimentation", "CRUD achats d'aliments + imputation auto"],
            ["/api/depenses", "CRUD dépenses + imputation"],
            ["/api/ventes", "Enregistrement ventes (statut VENDU + marge)"],
            ["/api/saisie", "Journaux comptables + balance + suivi capital"],
            ["/api/financement", "Financement + échéances + trésorerie"],
            ["/api/rapport-bailleur", "Rapport E2A (KPI + mensuel + structure coûts)"],
            ["/api/alertes", "Alertes (échéances, stock, budget)"],
            ["/api/historique", "Journal des actions utilisateur"],
            ["/api/stats/comparaison", "Comparaison de périodes N vs N-1"],
            ["/api/stats/races", "Performance par race"],
            ["/api/paturages", "CRUD pâturages"],
            ["/api/pesees", "CRUD pesées"],
            ["/api/soins", "CRUD soins vétérinaires (à venir)"],
            ["/api/notifications", "Notifications temps réel (à venir)"],
            ["/api/backup", "Sauvegarde/restauration (rôle E2A)"],
            ["/api/parametres", "Paramètres (capital initial, seuils)"],
            ["/api/tresorerie", "Trésorerie (encaissements/décaissements)"],
            ["/api/validations", "Workflow validation à 2 niveaux (à venir)"],
            ["/api/guide-pdf", "Téléchargement du guide PDF (Content-Disposition: attachment)"],
        ],
        styles,
        col_widths=[6*cm, 10*cm]
    ))
    s.append(Spacer(1, 6))
    s.append(Paragraph("18.3 Bibliothèque & utilitaires (lib)", styles["h2"]))
    s.append(Paragraph(
        "Le dossier <b><font color='#4A3728' face='Courier'>src/lib/</font></b> contient la logique partagée :",
        styles["body"]))
    s.append(section_table(
        ["Fichier lib", "Rôle"],
        [
            ["db.ts", "Client Prisma singleton ( SQLite local / PostgreSQL Neon prod)"],
            ["auth.ts", "Authentification bcryptjs + gestion de session"],
            ["config.ts", "PALETTE, NAV_ITEMS, ROLE_LABELS, COST_STRUCTURE_COLORS"],
            ["types.ts", "Interfaces TypeScript + ROLE_VIEWS (RBAC)"],
            ["store.ts", "Store Zustand (rôle, vue courante, user, mois)"],
            ["api.ts", "Hooks TanStack Query (useBovins, useDashboard, etc.)"],
            ["calculations.ts", "Calculs purs (computeBovinMarge, computeDashboard)"],
            ["server-mappers.ts", "Conversion Prisma (Date) → TS (ISO string)"],
            ["format.ts", "formatFCFA, formatDate, formatDateTime, severiteColor"],
            ["icons.ts", "Mapping Hugeicons (60+ icônes)"],
            ["offline-db.ts", "IndexedDB pour mode hors ligne"],
            ["backup.ts", "Sauvegarde/restauration base"],
        ],
        styles,
        col_widths=[5*cm, 11*cm]
    ))
    s.append(Spacer(1, 6))
    s.append(Paragraph("18.4 Schéma & scripts base de données", styles["h2"]))
    s.append(section_table(
        ["Fichier", "Rôle"],
        [
            ["prisma/schema.prisma", "Modèles : User, Bovin, Alimentation, Depense, Financement, Echeance, Alerte, Historique, Tag, Photo, Validation, StockMouvement, CapitalMouvement, Parametre, Paturage, Pese, Soin, Notification, Backup"],
            ["prisma/seed.ts", "Peuplement initial (4 users, 15 bovins, 8 alimentations, 13 dépenses, financement 5M, échéances, alertes)"],
            ["scripts/generate_guide_pdf.py", "Script Python ReportLab de génération de ce guide PDF"],
            ["scripts/create-missing-tables.ts", "Création des tables SQLite manquantes"],
        ],
        styles,
        col_widths=[5*cm, 11*cm]
    ))
    s.append(Spacer(1, 6))
    s.append(Paragraph("18.5 Composants d'application & UI", styles["h2"]))
    s.append(section_table(
        ["Composant", "Rôle"],
        [
            ["app/app-sidebar.tsx", "Barre latérale (nav filtrée par rôle + bouton guide PDF)"],
            ["app/app-header.tsx", "En-tête sticky (logo + sélecteur mois + sélecteur rôle + mode sombre)"],
            ["app/app-footer.tsx", "Pied de page sticky (logo + version + statut en ligne)"],
            ["saverdev-logo.tsx", "Logo SVG (cercle marron + arbre vert)"],
            ["lazy-mount.tsx", "IntersectionObserver pour lazy-load des graphiques"],
            ["query-provider.tsx", "QueryClientProvider (TanStack Query)"],
            ["session-provider.tsx", "SessionProvider NextAuth"],
            ["theme-provider.tsx", "ThemeProvider next-themes"],
            ["animated-counter.tsx", "Compteur animé (KPI)"],
            ["shimmer-skeleton.tsx", "Skeleton animé (chargement)"],
            ["ripple-button.tsx", "Bouton avec effet ripple"],
            ["network-status.tsx", "Indicateur en ligne / hors ligne"],
            ["ui/*", "56 composants shadcn/ui (button, card, dialog, table, etc.)"],
        ],
        styles,
        col_widths=[5*cm, 11*cm]
    ))
    s.append(Spacer(1, 6))
    s.append(Paragraph("18.6 Pages Next.js & config", styles["h2"]))
    s.append(section_table(
        ["Fichier", "Rôle"],
        [
            ["src/app/page.tsx", "Page principale (router de vues par rôle)"],
            ["src/app/layout.tsx", "Layout racine (QueryProvider, ThemeProvider, viewport)"],
            ["src/app/globals.css", "Styles globaux Tailwind + palette SAVERDEV"],
            ["src/app/proxy.ts", "Middleware Next.js 16 (protection routes)"],
            ["public/manifest.json", "PWA manifest (installable mobile)"],
            ["public/guide-saverdev.pdf", "Ce guide PDF (22+ pages)"],
            ["public/logo-saverdev.png", "Logo SAVERDEV (haute résolution)"],
            ["public/logo-sinergi.jpg", "Logo bailleur SINERGI"],
            ["public/logo-e2a.png", "Logo administrateur E2A"],
            ["next.config.ts", "Configuration Next.js 16 (Turbopack)"],
            ["tailwind.config.ts", "Configuration Tailwind v4 + palette"],
            ["vercel.json", "Déploiement Vercel (prisma generate + next build)"],
            [".env", "Variables (DATABASE_URL file:local / postgresql prod)"],
        ],
        styles,
        col_widths=[5*cm, 11*cm]
    ))
    s.append(note_box(
        "<b>Total</b> : 17 vues + 22 endpoints API + 12 fichiers lib + "
        "19 modèles Prisma + 56 composants UI shadcn. "
        "Stack : Next.js 16, TypeScript 5, Tailwind v4, Prisma 6, "
        "TanStack Query, Zustand, Framer Motion, Recharts, Hugeicons, "
        "NextAuth, bcryptjs, Sonner.",
        styles))
    s.append(PageBreak())

    # ---------- 19. APPRÉCIATION GLOBALE ----------
    s.append(Paragraph("19. Appréciation globale de l'application SAVERDEV", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    s.append(Paragraph(
        "À l'issue de ce guide, voici une <b>appréciation critique</b> de "
        "l'application SAVERDEV, module par module, à destination du gérant "
        "et du bailleur. Cette évaluation est volontairement honnête : elle "
        "souligne les points forts et identifie les axes d'amélioration.",
        styles["body"]))
    s.append(Paragraph("19.1 Évaluation par module", styles["h2"]))
    s.append(section_table(
        ["Module", "Points forts", "À améliorer"],
        [
            ["Tableau de bord", "Vue synthétique claire, 6 KPI + 6 graphiques, alertes visuelles", "LazyMount peut masquer les graphiques au premier scroll"],
            ["Saisie", "Comptabilité partie double rigoureuse, balance, journal en cascade", "Formulaire dense sur mobile, à aérer"],
            ["Cheptel", "Bovins + ovins, gestionnaire SAVERDEV, fiche détaillée riche", "Pas de photo par défaut, à inciter"],
            ["Alimentation", "Imputation automatique par tête, calcul coût/tête instantané", "Pas de prévisionnel de consommation"],
            ["Dépenses", "6 catégories, imputation par bovin, n° de compte comptable", "Pas de budget prévisionnel par catégorie"],
            ["Ventes", "Fige le coût de revient, calcule la marge, alimente le journal 4111/7011", "Pas de gestion d'acheteurs récurrents (à venir)"],
            ["Rentabilité", "Waterfall cascade de marge, jauge, barre empilée, ventilation des coûts", "Pas de comparaison inter-périodes (à venir)"],
            ["Financement", "Capital initial statique + mouvements horodatés, échéances, trésorerie", "Pas d'alerte pro-active d'échéance approchante"],
            ["Rapport bailleur", "Modèle E2A fidèle, 6 KPI colorés, 6 graphiques, annexe mensuelle", "Export Excel pas encore disponible (à venir)"],
            ["Carte 3D", "Immersion visuelle, parallaxe souris, badge URGENT", "Gourmand en GPU sur vieux appareils"],
        ],
        styles,
        col_widths=[3.5*cm, 7*cm, 5.5*cm]
    ))
    s.append(Spacer(1, 8))
    s.append(Paragraph("19.2 Points forts globaux", styles["h2"]))
    s.append(ListFlowable([
        ListItem(Paragraph("<b>Architecture professionnelle</b> : Next.js 16, TypeScript strict, Prisma ORM, shadcn/ui — stack moderne et maintenable.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Comptabilité en partie double</b> réelle (comptes 6011/5711/4111/7011/6xxx), avec balance générale et journaux séparés — rare pour une application d'élevage.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Capital initial STATIQUE + mouvements horodatés</b> : choix de conception excellent pour préserver la traçabilité comptable et l'audit.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Mode hors ligne</b> avec IndexedDB et synchronisation automatique au retour de connexion — adapté aux conditions sahéliennes.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>PWA installable</b> sur mobile (Android/iOS) — usage terrain possible sans navigateur.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>3 rôles distincts</b> (Bénéficiaire SAVERDEV, Bailleur SINERGI, Admin E2A) avec navigation filtrée par rôle.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Rapport bailleur fidèle au modèle E2A</b> Excel — 6 KPI colorés + 6 graphiques + tableau mensuel 12 mois × 9 colonnes.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Palette SAVERDEV cohérente</b> (vert forêt, marron terre, vert clair, bleu ciel) à travers toute l'application.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Cohérence des couleurs</b> entre « Ventilation des coûts » (dashboard + rentabilité) et « Structure des coûts (cumul) » (rapport bailleur) — orange/vert/bleu identiques.", styles["bullet"]), value="circle"),
        ListItem(Paragraph("<b>Accessibilité</b> : respect du <i>prefers-reduced-motion</i>, contrastes adaptés, navigation clavier.", styles["bullet"]), value="circle"),
    ], bulletType="bullet"))
    s.append(Paragraph("19.3 Axes d'amélioration prioritaires", styles["h2"]))
    s.append(ListFlowable([
        ListItem(Paragraph("<b>Workflow de validation à 2 niveaux</b> : les saisies du Bénéficiaire devraient être validées par E2A avant intégration au rapport bailleur (sécurité comptable accrue).", styles["bullet"]), value="1"),
        ListItem(Paragraph("<b>Notifications push temps réel</b> : un centre de notifications consultable + alertes pro-actives pour les échéances approchantes (J-7, J-1).", styles["bullet"]), value="2"),
        ListItem(Paragraph("<b>Export Excel (.xlsx)</b> du tableau mensuel du rapport bailleur — les bailleurs préfèrent souvent Excel au PDF.", styles["bullet"]), value="3"),
        ListItem(Paragraph("<b>Application mobile native</b> avec scan QR pour identifier les animaux sur le terrain — accélère la saisie et réduit les erreurs.", styles["bullet"]), value="4"),
        ListItem(Paragraph("<b>Budget prévisionnel par catégorie</b> de dépenses — compare le réalisé au prévu et alerte en cas de dépassement.", styles["bullet"]), value="5"),
        ListItem(Paragraph("<b>Tableau de bord personnalisable</b> par rôle — une vue synthétique pour SINERGI, opérationnelle pour SAVERDEV, d'audit pour E2A.", styles["bullet"]), value="6"),
        ListItem(Paragraph("<b>Calendrier vaccinal automatique</b> dans le module Soins — génère les prochaines échéances de vaccination selon l'espèce et l'âge.", styles["bullet"]), value="7"),
        ListItem(Paragraph("<b>Sauvegarde automatique périodique</b> de la base — protection contre les pertes de données accidentelles.", styles["bullet"]), value="8"),
    ], bulletType="1"))
    s.append(Paragraph("19.4 Note globale", styles["h2"]))
    s.append(Paragraph(
        "L'application SAVERDEV est une <b>réussite technique et fonctionnelle</b> "
        "pour un projet d'élevage sahélien. Elle couvre l'intégralité du cycle "
        "d'engraissement — de l'achat du bétail à la vente, en passant par "
        "l'alimentation, les dépenses d'exploitation et le suivi du financement. "
        "La tenue comptable en partie double et le suivi du capital initial "
        "statique avec mouvements horodatés sont des <b>atouts majeurs</b> qui "
        "la distinguent des solutions concurrentes.",
        styles["body"]))
    s.append(Paragraph(
        "Les axes d'amélioration identifiés (validation à 2 niveaux, notifications, "
        "export Excel, mobile natif, calendrier vaccinal) sont des évolutions "
        "naturelles qui viendront étoffer la plateforme sans remettre en cause "
        "ses fondations. Avec une feuille de route sur 6-12 mois, SAVERDEV peut "
        "devenir une <b>référence régionale</b> en gestion d'élevage d'engraissement.",
        styles["body"]))
    s.append(note_box(
        "<b>Note finale : 8,5 / 10</b> — Application mature, fonctionnelle et "
        "fiable, prête pour un usage quotidien en élevage. Les 1,5 points "
        "manquants correspondent aux évolutions listées en section 19.3 "
        "(workflow validation, notifications, export Excel, mobile natif, "
        "calendrier vaccinal, sauvegarde auto).",
        styles))
    s.append(PageBreak())

    # ---------- 20. CONTACTS ----------
    s.append(Paragraph("20. Contacts &amp; assistance", styles["h1"]))
    s.append(HRFlowable(width="100%", thickness=2, color=VERT_FORET, spaceBefore=2, spaceAfter=10))
    s.append(Paragraph(
        "En cas de question, de problème technique ou de besoin d'assistance, "
        "voici les contacts à mobiliser :",
        styles["body"]))
    s.append(section_table(
        ["Interlocuteur", "Rôle", "Contact"],
        [
            ["Administrateur E2A", "Maintenance applicative, comptes, sauvegardes", "e2a@saverdev.org"],
            ["Bailleur SINERGI", "Financement, échéances, rapport bailleur", "sinergi@saverdev.org"],
            ["Gérant SAVERDEV", "Saisie quotidienne, suivi cheptel", "Souleymane Zakaria"],
        ],
        styles,
        col_widths=[4*cm, 7*cm, 5*cm]
    ))
    s.append(Spacer(1, 8))
    s.append(Paragraph("Que faire en cas de bug ?", styles["h2"]))
    s.append(ListFlowable([
        ListItem(Paragraph("<b>Noter le message d'erreur exact</b> (capture d'écran si possible).", styles["bullet"]), value="1"),
        ListItem(Paragraph("<b>Vérifier la connexion internet</b> (le mode hors ligne peut être activé).", styles["bullet"]), value="2"),
        ListItem(Paragraph("<b>Rafraîchir la page</b> (F5 ou Ctrl+R / Cmd+R).", styles["bullet"]), value="3"),
        ListItem(Paragraph("<b>Se déconnecter et reconnecter</b> (bouton en haut à droite).", styles["bullet"]), value="4"),
        ListItem(Paragraph("<b>Contacter l'administrateur E2A</b> si le problème persiste.", styles["bullet"]), value="5"),
    ], bulletType="1"))
    s.append(Spacer(1, 10))
    s.append(HRFlowable(width="100%", thickness=1, color=MARRON_TERRE, spaceBefore=10, spaceAfter=10))
    s.append(Paragraph(
        "<b>SAVERDEV</b> — Sahel Vert · Développement<br/>"
        "Application de gestion d'élevage bovin &amp; ovin<br/>"
        "Gérant : Souleymane Zakaria<br/>"
        "Version 1.0 — Guide d'utilisation",
        ParagraphStyle("footer", parent=styles["body"], alignment=TA_CENTER,
                       fontName="Helvetica", fontSize=9, textColor=GRIS_MOYEN)
    ))
    return s

# ============================================================
#   BUILD PDF
# ============================================================

def build_pdf():
    styles = make_styles()
    doc = BaseDocTemplate(
        OUTPUT_PDF,
        pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=1.6*cm, bottomMargin=1.4*cm,
        title="Guide d'utilisation SAVERDEV",
        author="SAVERDEV — Souleymane Zakaria",
        subject="Application de gestion d'élevage bovin & ovin",
        creator="SAVERDEV",
    )
    # Cadre principal pour les pages internes
    frame = Frame(
        2*cm, 1.4*cm,
        A4[0] - 4*cm, A4[1] - 3*cm,
        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
        showBoundary=0
    )
    cover_frame = Frame(0, 0, A4[0], A4[1], showBoundary=0)
    doc.addPageTemplates([
        PageTemplate(id="Cover", frames=[cover_frame], onPage=draw_cover_background),
        PageTemplate(id="Body", frames=[frame], onPage=draw_page_header_footer),
    ])
    story = build_story(styles)
    # After cover (page 1), switch to Body template
    from reportlab.platypus.doctemplate import NextPageTemplate
    # Insert NextPageTemplate('Body') after first page break (which follows cover)
    # We'll just prepend it so all pages after the cover use Body
    new_story = [NextPageTemplate("Body")] + story
    doc.build(new_story)
    size = os.path.getsize(OUTPUT_PDF)
    print(f"✓ PDF généré : {OUTPUT_PDF}")
    print(f"  Taille : {size/1024:.1f} Ko")

if __name__ == "__main__":
    build_pdf()
