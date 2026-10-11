#!/usr/bin/env python3
"""Guide d'utilisation SAVERDEV — PDF genere avec ReportLab."""
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)

PRIMARY = colors.HexColor('#10B981')
PRIMARY_DARK = colors.HexColor('#059669')
DARK = colors.HexColor('#0F172A')
LIGHT_BG = colors.HexColor('#F3F4F6')
CARD_BG = colors.HexColor('#FFFFFF')
BORDER = colors.HexColor('#E5E7EB')
TEXT = colors.HexColor('#111827')
MUTED = colors.HexColor('#6B7280')

OUTPUT = "/home/z/my-project/download/Guide_Utilisation_SAVERDEV.pdf"

def build():
    ss = getSampleStyleSheet()
    h1 = ParagraphStyle('H1', parent=ss['Heading1'], fontSize=18, textColor=DARK, spaceBefore=20, spaceAfter=10, fontName='Helvetica-Bold')
    h2 = ParagraphStyle('H2', parent=ss['Heading2'], fontSize=14, textColor=PRIMARY_DARK, spaceBefore=14, spaceAfter=6, fontName='Helvetica-Bold')
    body = ParagraphStyle('Body', parent=ss['Normal'], fontSize=10.5, textColor=TEXT, leading=16, spaceAfter=6, fontName='Helvetica')
    note = ParagraphStyle('Note', parent=ss['Normal'], fontSize=9, textColor=MUTED, leading=13, leftIndent=12, spaceAfter=4, fontName='Helvetica-Oblique')
    th = ParagraphStyle('TH', parent=ss['Normal'], fontSize=9, textColor=colors.white, fontName='Helvetica-Bold')
    tc = ParagraphStyle('TC', parent=ss['Normal'], fontSize=9, textColor=TEXT, fontName='Helvetica')
    cover_title = ParagraphStyle('CT', parent=ss['Title'], fontSize=36, textColor=colors.white, alignment=1, fontName='Helvetica-Bold')
    cover_sub = ParagraphStyle('CS', parent=ss['Normal'], fontSize=14, textColor=colors.white, alignment=1, fontName='Helvetica')

    doc = SimpleDocTemplate(OUTPUT, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm, topMargin=20*mm, bottomMargin=18*mm,
        title="Guide d'utilisation SAVERDEV", author="SAVERDEV", subject="Guide", creator="SAVERDEV")

    def P(t, s="body"): return Paragraph(t, {"body":body,"h1":h1,"h2":h2,"note":note}[s] if isinstance(s,str) else s)
    S = lambda h: Spacer(1, h)

    def tbl(data, cw):
        t = Table(data, colWidths=cw)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), PRIMARY),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('GRID', (0,0), (-1,-1), 0.5, BORDER),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [CARD_BG, LIGHT_BG]),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
        ]))
        return t

    def cover(c, d):
        c.saveState()
        c.setFillColor(DARK); c.rect(0,0,A4[0],A4[1],fill=1,stroke=0)
        c.setFillColor(PRIMARY); c.rect(0,A4[1]-8*mm,A4[0],8*mm,fill=1,stroke=0); c.rect(0,0,A4[0],8*mm,fill=1,stroke=0)
        cx = A4[0]/2; cy = A4[1]/2+40*mm
        c.setFillColor(colors.white); c.circle(cx,cy,22*mm,fill=1,stroke=0)
        c.setFillColor(PRIMARY); c.circle(cx,cy,18*mm,fill=1,stroke=0)
        c.setFillColor(colors.white); c.rect(cx-2*mm,cy-8*mm,4*mm,10*mm,fill=1,stroke=0)
        c.ellipse(cx-10*mm,cy+2*mm,cx+10*mm,cy+18*mm,fill=1,stroke=0)
        c.setFillColor(colors.white); c.setFont('Helvetica-Bold',32)
        c.drawCentredString(cx,A4[1]/2-5*mm,"SAVERDEV")
        c.setFont('Helvetica',14); c.drawCentredString(cx,A4[1]/2-15*mm,"Guide d'utilisation")
        c.setFont('Helvetica',11); c.drawCentredString(cx,A4[1]/2-25*mm,"Gestion d'elevage bovin & ovin")
        c.setFillColor(PRIMARY); c.setFont('Helvetica-Bold',10)
        c.drawCentredString(cx,A4[1]/2-40*mm,"Application web - Mobile - Hors ligne")
        c.setFillColor(colors.white); c.setFont('Helvetica',8)
        c.drawCentredString(cx,25*mm,"En partenariat avec : SAVERDEV - SINERGI SA - E2A")
        c.drawCentredString(cx,15*mm,"https://saverdev.vercel.app")
        c.restoreState()

    def hdr_ftr(c, d):
        c.saveState()
        c.setFillColor(PRIMARY); c.rect(0,A4[1]-12*mm,A4[0],12*mm,fill=1,stroke=0)
        c.setFillColor(colors.white); c.setFont('Helvetica-Bold',9)
        c.drawString(20*mm,A4[1]-8*mm,"SAVERDEV - Guide d'utilisation")
        c.drawRightString(A4[0]-20*mm,A4[1]-8*mm,"Sahel Vert pour un Developpement Durable")
        c.setFillColor(MUTED); c.setFont('Helvetica',8)
        c.drawCentredString(A4[0]/2,10*mm,f"Page {d.page} - SAVERDEV - Confidentiel")
        c.restoreState()

    st = []
    st.append(Spacer(1,250*mm)); st.append(PageBreak())

    # Page 2: Introduction
    st.append(P("1. Introduction",'h1'))
    st.append(P("Bienvenue dans l'application SAVERDEV, l'outil de gestion d'elevage bovin et ovin concu pour les eleveurs du Sahel. Cette application permet de suivre le cheptel, enregistrer les achats et ventes, gerer les stocks d'aliment, produire des journaux comptables en partie double (debit/credit), et suivre le financement accorde par les partenaires."))
    st.append(P("L'application est accessible sur ordinateur, smartphone et tablette. Elle fonctionne egalement hors ligne pour les zones a faible connectivite, avec synchronisation automatique des donnees des que la connexion revient."))

    st.append(P("1.1 Comptes de connexion",'h2'))
    st.append(P("Trois profils sont disponibles. Tous utilisent le mot de passe <b>demo</b>."))
    st.append(tbl([
        [P("Profil",th), P("Email",th), P("Role",th)],
        [P("Beneficiaire",tc), P("beneficiaire@saverdev.org",tc), P("Acces complet (saisie, cheptel, rapports)",tc)],
        [P("SINERGI SA",tc), P("sinergi@saverdev.org",tc), P("Lecture seule (tableaux de bord, rapports)",tc)],
        [P("E2A",tc), P("e2a@saverdev.org",tc), P("Administration technique",tc)],
    ], [35*mm,60*mm,75*mm]))
    st.append(P("Adresse de l'application : https://saverdev.vercel.app",note))

    # Page 3: Saisie
    st.append(PageBreak())
    st.append(P("2. Saisie des operations",'h1'))
    st.append(P("La saisie est le coeur de l'application. Cliquez sur <b>Saisie</b> dans le menu de gauche. Vous arrivez sur un ecran avec 4 journaux et 2 outils comptables."))

    st.append(P("2.1 Journal d'achats",'h2'))
    st.append(P("Pour enregistrer l'achat d'un animal (bovin ou ovin) :"))
    for t in ["Cliquez sur <b>Journal d'achats</b>",
        "<b>Date</b> : date de l'achat",
        "<b>Gestionnaire</b> : SAVERDEV (Souleymane Zakaria)",
        "<b>Espece</b> : Bovin (BOE) ou Ovin (OVN)",
        "<b>Race</b> : Zebu, Mouton Sokoto, Mouton Peul, etc.",
        "<b>Nombre de sujets</b> : quantite achetee",
        "<b>Prix unitaire</b> : prix par animal (FCFA)",
        "<b>Poids</b> : poids a l'achat (kg)",
        "<b>Observations</b> : marche, robe, etat sanitaire...",
        "Cliquez sur <b>Enregistrer l'achat</b>"]:
        st.append(Paragraph(f"&bull; &nbsp; {t}", ParagraphStyle('B',parent=body,leftIndent=20,bulletIndent=8,spaceAfter=4)))
    st.append(P("Le journal s'affiche en cascade avec les colonnes : <b>Date, N Compte, Libelle, Montant Debit, Montant Credit</b>. Chaque achat genere deux lignes : un debit sur le compte 6011 (Achat de betail) et un credit sur le compte 5711 (Caisse/Banque). En bas du journal, le solde est calcule avec une conclusion : <b>Solde debitaire</b> ou <b>Solde creditaire</b>."))

    st.append(P("2.2 Journal de ventes",'h2'))
    st.append(P("Meme principe que pour les achats, mais les montants apparaissent en <b>credit</b> (argent qui rentre). Chaque vente genere un debit sur le compte 4111 (Clients) et un credit sur le compte 7011 (Ventes de betail). Champs : Date, Acheteur, Nombre de sujets vendus, Prix unitaire, Observations."))

    st.append(P("2.3 Journal des depenses",'h2'))
    st.append(P("Pour enregistrer toute depense d'exploitation. Categories disponibles :"))
    st.append(tbl([
        [P("Categorie",th), P("Exemples",th)],
        [P("Veterinaire",tc), P("Vaccins, soins, deparasitage",tc)],
        [P("Salariat",tc), P("Salaires eleveurs, gardiens",tc)],
        [P("Immobilisation",tc), P("Materiel, amenagement du site",tc)],
        [P("Aliment betail",tc), P("Tourteau de coton, son, concentre",tc)],
        [P("Transport",tc), P("Deplacement, livraison",tc)],
        [P("Autre",tc), P("Toute autre depense",tc)],
    ], [50*mm,120*mm]))

    st.append(P("2.4 Gestion de stock (aliment betail)",'h2'))
    st.append(P("Permet de suivre les entrees et sorties de sacs d'aliment :"))
    for t in ["<b>Type d'aliment</b> : Tourteau de coton, Son, Concentre, Autre",
        "<b>Entree (sacs)</b> : sacs achetes",
        "<b>Sortie (sacs)</b> : sacs consommes",
        "Le <b>stock restant</b> est calcule automatiquement"]:
        st.append(Paragraph(f"&bull; &nbsp; {t}", ParagraphStyle('B2',parent=body,leftIndent=20,bulletIndent=8,spaceAfter=4)))
    st.append(P("Une alerte apparait si le stock descend sous 20 sacs (warning) ou 10 sacs (critique).",note))

    # Page 4: Outils comptables
    st.append(PageBreak())
    st.append(P("3. Outils comptables",'h1'))

    st.append(P("3.1 Balance comptable",'h2'))
    st.append(P("La balance regroupe tous les mouvements par numero de compte. Cliquez sur <b>Balance comptable</b> depuis l'ecran de saisie."))
    st.append(tbl([
        [P("Compte",th), P("Libelle",th), P("Solde N-1",th), P("Mouvt N",th), P("Solde N",th)],
        [P("4111",tc), P("Clients",tc), P("-",tc), P("2 315 000 D",tc), P("2 315 000 D",tc)],
        [P("5711",tc), P("Caisse/Banque",tc), P("-",tc), P("7 300 000 C",tc), P("7 300 000 C",tc)],
        [P("6011",tc), P("Achats de betail",tc), P("-",tc), P("6 700 000 D",tc), P("6 700 000 D",tc)],
        [P("7011",tc), P("Ventes de betail",tc), P("-",tc), P("2 315 000 C",tc), P("2 315 000 C",tc)],
    ], [20*mm,35*mm,30*mm,40*mm,40*mm]))
    st.append(P("La balance affiche le solde general avec une conclusion : <b>Solde general debitaire</b> ou <b>Solde general creditaire</b>."))

    st.append(P("3.2 Suivi du financement",'h2'))
    st.append(P("Le capital initial de <b>14 775 000 FCFA</b> est suivi en temps reel. Cliquez sur <b>Suivi financement</b>."))
    for t in ["Chaque <b>achat</b> soustrait le montant du capital (en rouge)",
        "Chaque <b>vente</b> ajoute le montant au capital (en vert)",
        "Le <b>solde restant</b> est affiche apres chaque mouvement",
        "Les mouvements sont affiches en cascade (du plus recent au plus ancien)"]:
        st.append(Paragraph(f"&bull; &nbsp; {t}", ParagraphStyle('B3',parent=body,leftIndent=20,bulletIndent=8,spaceAfter=4)))

    # Page 5: Cheptel + Hors ligne
    st.append(PageBreak())
    st.append(P("4. Gestion du cheptel",'h1'))
    st.append(P("Cliquez sur <b>Cheptel</b> dans le menu de gauche. Le cheptel regroupe les <b>bovins</b> (BOE-xxx) et les <b>ovins</b> (OVN-xxx). Chaque animal a une fiche detaillee."))
    st.append(tbl([
        [P("Espece",th), P("Prefixe",th), P("Exemple",th), P("Gestionnaire",th)],
        [P("Bovin",tc), P("BOE-",tc), P("BOE-001, BOE-002...",tc), P("SAVERDEV",tc)],
        [P("Ovin",tc), P("OVN-",tc), P("OVN-001, OVN-002...",tc), P("SAVERDEV",tc)],
    ], [30*mm,25*mm,55*mm,40*mm]))

    st.append(P("5. Mode hors ligne",'h1'))
    st.append(P("L'application fonctionne sans connexion internet, essentiel pour les eleveurs sur le terrain."))
    st.append(P("5.1 Comment ca marche",'h2'))
    for t in ["Si vous etes hors ligne, un <b>bandeau ambre</b> apparait en haut",
        "Vos saisies sont <b>enregistrees sur l'appareil</b>",
        "Quand la connexion revient, un <b>bouton vert</b> apparait en bas a droite",
        "Cliquez dessus pour <b>synchroniser</b> toutes les saisies en attente"]:
        st.append(Paragraph(f"&bull; &nbsp; {t}", ParagraphStyle('B4',parent=body,leftIndent=20,bulletIndent=8,spaceAfter=4)))
    st.append(P("5.2 Installation sur smartphone (PWA)",'h2'))
    for t in ["Ouvrez https://saverdev.vercel.app sur votre telephone",
        "Menu du navigateur (3 points) > <b>Ajouter a l'ecran d'accueil</b>",
        "L'application s'installe comme une application native"]:
        st.append(Paragraph(f"&bull; &nbsp; {t}", ParagraphStyle('B5',parent=body,leftIndent=20,bulletIndent=8,spaceAfter=4)))

    # Page 6: Tableau de bord + Rapport
    st.append(PageBreak())
    st.append(P("6. Tableau de bord",'h1'))
    st.append(P("Le tableau de bord affiche une vue synthetique de l'exploitation :"))
    for t in ["<b>Bovins actifs</b> : nombre d'animaux en engraissement",
        "<b>Valeur du cheptel</b> : estimation (achat + engraissement)",
        "<b>Chiffre d'affaires</b> : total des ventes realisees",
        "<b>Marge totale</b> et marge par tete",
        "<b>Zone d'alertes</b> : stock bas, depenses elevees, echeances en retard",
        "<b>Graphiques</b> : evolution mensuelle, repartition du cheptel, ventes"]:
        st.append(Paragraph(f"&bull; &nbsp; {t}", ParagraphStyle('B6',parent=body,leftIndent=20,bulletIndent=8,spaceAfter=4)))

    st.append(P("7. Rapport bailleur",'h1'))
    st.append(P("Document de synthese destine aux partenaires financiers (SINERGI SA, E2A) :"))
    for t in ["6 KPI colores (bovins actifs, CA cumule, marge totale, marge/tete, financement, tresorerie)",
        "6 graphiques (evolution, achats vs ventes, CA & marge, couts, structure, financement)",
        "Tableau recapitulatif mensuel (12 mois)",
        "Tableau d'amortissement des echeances",
        "Boutons <b>Imprimer</b> et <b>Export PDF</b>"]:
        st.append(Paragraph(f"&bull; &nbsp; {t}", ParagraphStyle('B7',parent=body,leftIndent=20,bulletIndent=8,spaceAfter=4)))

    st.append(P("8. Astuces",'h1'))
    for t in ["<b>Mode sombre</b> : cliquez sur l'icone soleil/lune dans le header",
        "<b>Connexion rapide</b> : cliquez sur un compte dans la page de connexion",
        "<b>Deconnexion</b> : bouton en haut a droite ou en bas de la sidebar",
        "<b>Filtre par statut</b> : onglets Engraissement / Vendu / Mort"]:
        st.append(Paragraph(f"&bull; &nbsp; {t}", ParagraphStyle('B8',parent=body,leftIndent=20,bulletIndent=8,spaceAfter=4)))

    st.append(S(10))
    st.append(P("Application developpee par E2A - En partenariat avec SAVERDEV et SINERGI SA.",note))

    doc.build(st, onFirstPage=cover, onLaterPages=hdr_ftr)
    print(f"PDF: {OUTPUT} ({os.path.getsize(OUTPUT)//1024} KB)")

if __name__ == "__main__":
    build()
