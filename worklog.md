# Worklog — Application Élevage Bovin (SAVERDEV)

Projet : application de gestion et reporting d'élevage bovin d'engraissement.
Stack : Next.js 16 + shadcn/ui + Tailwind v4 + Prisma (SQLite) + TanStack Query.
Palette : SAVERDEV (vert forêt #2E8B57, marron terre #4A3728, vert clair #7CC576, bleu ciel #87CEEB, fond blanc).
4 profils : Éleveur, Gérant, Bailleur (lecture seule), Admin.

---
Task ID: 1
Agent: main
Task: Fondation + shell + 9 vues complètes avec mock-data (palette SAVERDEV)

Work Log:
- Lecture des 3 docx (cahier des charges, guidelines, support KPI) et du logo SAVERDEV via VLM
- Palette SAVERDEV dans globals.css (vert forêt primary, marron terre sidebar/secondary, vert clair accent, bleu ciel chart-4)
- Schema Prisma : User, Bovin, Alimentation, AlimentationBovin, Depense, DepenseBovin, Financement, Echeance, Alerte, Historique
- lib/types.ts (interfaces TypeScript + ROLE_VIEWS pour RBAC)
- lib/mock-data.ts (15 bovins, 8 alimentations, 13 dépenses, financement 5M FCFA + 10 échéances, 5 alertes, 6 historiques)
- lib/format.ts (formatFCFA, formatDate, moisLabel, statutBovinColor, CHART_COLORS hex)
- lib/store.ts (Zustand : rôle actif, vue courante, mois sélectionné, bovin sélectionné)
- Shell page.tsx : sidebar marron + header sticky (logo + sélecteur mois + sélecteur rôle + badge lecture seule bailleur) + footer sticky
- Composants app/ : app-sidebar (nav filtrée par rôle, mobile via Sheet), app-header, app-footer
- 9 vues complètes :
  - dashboard-view : 6 blocs KPI (Cheptel/Engraissement/Alimentation/Rentabilité/Financement/Alertes) + 3 graphiques (Line évolution, Pie répartition, Bar ventes) + historique
  - bovins-view : table filtrable (recherche + tabs statut) + clic → fiche
  - fiche-bovin-view : identification + coûts & marge + progress
  - alimentation-view : KPI + table + dialog d'ajout
  - depenses-view : 4 cards par catégorie + table filtrable + dialog d'ajout
  - ventes-view : KPI CA/marge + table + dialog d'ajout
  - rentabilite-view : KPI + pie ventilation coûts + bar marges par bovin + table détaillée
  - financement-view : KPI + carte taux utilisation (progress) + prochaines échéances + table amortissement
  - rapport-bailleur-view : rapport imprimable 2 pages (synthèse + annexes) + boutons Imprimer/Export PDF (window.print)
- Logo SAVERDEV en SVG (cercle marron + arbre vert + courbes sol/eau)

Stage Summary:
- Application complète et navigable
- 4 rôles fonctionnels avec nav restreinte (Bailleur = 4 vues, Gérant/Admin = 8 vues, Éleveur = 5 vues)
- Tous les montants en FCFA avec formatage fr-FR
- Graphiques Recharts avec couleurs hex SAVERDEV (var(--chart-X) ne fonctionne pas en attributs SVG stroke/fill)
- Layout responsive : sidebar → Sheet sur mobile
- Sticky footer en bas de page

---
Task ID: 2
Agent: main
Task: Vérification end-to-end avec Agent Browser

Work Log:
- Démarrage dev server (port 3000, Turbopack)
- Vérification lint : 0 erreur après fix useMemo (financement-view) et import manquant (statutEcheanceColor dans rapport)
- Inspection DOM des graphiques : les 3 rendent des paths SVG valides (Line=3 courbes, Pie=3 secteurs, Bar=3 barres)
- Capture + analyse VLM après scroll aux graphiques : les 3 graphiques visibles (courbes vert/marron/vert clair, donut 3 segments, barres vertes)
- Test navigation : Dashboard → Bovins (table avec BOV-001..015) → clic ligne BOV-001 → Fiche bovin
- Test RBAC : switch rôle Gérant → Bailleur : nav passe de 8 à 4 items (Dashboard, Rentabilité, Financement, Rapport)
- Test toutes les vues : Alimentation, Dépenses, Ventes, Rentabilité, Financement — toutes rendent leur heading + contenu
- Test Export PDF : bouton déclenche window.print() + toast "Préparation du PDF..."

Stage Summary:
- Frontend 100% fonctionnel et vérifié dans le navigateur
- Aucune erreur runtime/compile/hydratation
- Palette SAVERDEV correctement appliquée (sidebar marron, accents vert, fond blanc, alertes rouge/jaune)
- Prêt pour présentation utilisateur

Note : Les vues utilisent actuellement des données mockées (lib/mock-data.ts).
Le schéma Prisma est poussé en DB (db:push OK). L'ajout d'API routes + seed + branchement
TanStack Query est l'étape suivante pour persister les données réelles.

---
Task ID: 3
Agent: main
Task: Backend React — API routes + Prisma seed + TanStack Query (remplacement des imports mock)

Work Log:
- prisma/seed.ts : peuplement SQLite depuis mock-data (4 users, 15 bovins, 8 alimentations + imputation, 13 dépenses, 1 financement + 10 échéances, 5 alertes, 6 historiques)
- package.json : ajout scripts db:seed, db:studio + config prisma.seed
- Schema : renommé prixachat → prixAchat (cohérence camelCase) + db:push
- src/lib/calculations.ts : calculs purs (computeBovinMarge, computeDashboardFromData) réutilisables serveur + client
- src/lib/server-mappers.ts : conversion Prisma (Date) → TS (ISO string)
- 9 API routes :
  - GET /api/dashboard (agrégation serveur via computeDashboardFromData)
  - GET+POST /api/bovins, GET /api/bovins/[id]
  - GET+POST /api/alimentation (imputation auto + update coutsEngraissement)
  - GET+POST /api/depenses (imputation auto + update autresCouts)
  - GET+POST /api/ventes (fige coût + calcule marge)
  - GET /api/financement, /api/alertes, /api/historique
- src/components/query-provider.tsx : QueryClientProvider (staleTime 30s)
- src/app/layout.tsx : wrap app dans QueryProvider
- src/lib/api.ts : hooks TanStack Query (useBovins, useBovin, useDashboard, useAlimentations, useDepenses, useVentes, useFinancement, useAlertes, useHistorique + mutations useCreateBovin/Alimentation/Depense/Vente avec invalidation)
- 9 vues branchées sur les hooks (remplacement des imports MOCK_*) + états de chargement (Skeleton)
- Formulaires Alimentation/Dépenses/Ventes : FormData → mutation → API → DB → invalidate → refetch

Stage Summary:
- Vérification Agent Browser :
  - GET /api/bovins → 15 bovins (BOV-001 first)
  - GET /api/dashboard → cheptel.bovinsActifs=10, rentabilite.margeTotale=402500
  - POST /api/alimentation → 201 + coutParTete calculé (60000/3=20000)
  - Imputation vérifiée : BOV-004 coutsEngraissement passé de 28000 à 48000 après POST
  - Dashboard rend avec données dynamiques (KPI + 3 graphiques + alertes + historique)
- Lint clean (0 erreur)
- Cycle React complet : saisie → API → SQLite → invalidation → re-fetch → UI à jour
- Les mutations créent aussi des entrées dans l'historique (traçabilité)

Note technique : les données mockées (lib/mock-data.ts) restent utilisées par
le script de seed mais ne sont plus importées par les vues. Toutes les vues
fetchent maintenant via TanStack Query. Le seed peut être relancé avec
`bun run db:seed` pour réinitialiser les données démo.
