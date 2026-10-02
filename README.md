# SAVERDEV — Gestion d'Élevage Bovin d'Engraissement

Application de gestion et reporting d'élevage bovin d'engraissement pour le compte de bailleurs de fonds.

## Stack technique

- **Framework** : Next.js 16 (App Router) + TypeScript 5
- **Styling** : Tailwind CSS 4 + shadcn/ui (New York)
- **Base de données** : Prisma ORM (SQLite)
- **State** : Zustand (client) + TanStack Query (serveur)
- **Graphiques** : Recharts
- **Animations** : Framer Motion

## Fonctionnalités

- **Tableau de bord** — vue synthétique avec KPIs, graphiques 3D, jauges radiales, waterfall, radar
- **Cheptel** — gestion des bovins (achats, engraissement, ventes, mortalité)
- **Alimentation** — suivi des achats d'aliments et imputation par tête
- **Dépenses** — charges d'exploitation (soins, transport, main-d'œuvre)
- **Ventes** — enregistrement et marges par bovin
- **Rentabilité** — analyse CA, coûts, marges par race
- **Financement** — suivi du capital bailleur et échéances
- **Rapport bailleur** — tableau de bord mensuel imprimable (modèle E2A : 6 KPI colorés + 6 graphiques)
- **RBAC** — 4 profils : Éleveur, Gérant, Bailleur (lecture seule), Admin

## Installation

```bash
# Installer les dépendances
bun install

# Créer la base de données
cp .env.example .env  # ou éditer DATABASE_URL
bun run db:push
bun run db:seed        # données démo

# Démarrer le serveur dev
bun run dev
```

L'application est disponible sur `http://localhost:3000`.

## Comptes démo

| Profil | Email | Mot de passe |
|--------|-------|--------------|
| Éleveur | eleveur@saverdev.org | demo |
| Gérant | gerant@saverdev.org | demo |
| Bailleur | bailleur@saverdev.org | demo |
| Admin | admin@saverdev.org | demo |

## Scripts

| Commande | Description |
|----------|-------------|
| `bun run dev` | Serveur de développement (port 3000) |
| `bun run build` | Build de production |
| `bun run start` | Serveur de production |
| `bun run lint` | Vérification ESLint |
| `bun run db:push` | Synchroniser le schéma Prisma |
| `bun run db:seed` | Peupler les données démo |
| `bun run db:studio` | Prisma Studio (interface DB) |

## Structure du projet

```
src/
├── app/
│   ├── api/              # Routes API (bovins, alimentation, ventes, dashboard, rapport-bailleur…)
│   ├── layout.tsx        # Layout racine (QueryProvider, MotionConfig, Toaster)
│   ├── page.tsx          # Shell (sidebar + header + footer + routing des vues)
│   └── globals.css       # Palette SAVERDEV + utilities (glass, glow, reduced-motion)
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── app/              # sidebar, header, footer
│   ├── views/            # Vues métier (dashboard, bovins, alimentation, rentabilité, rapport-bailleur…)
│   ├── charts/           # Composants graphiques
│   ├── animated-counter.tsx
│   └── lazy-mount.tsx    # Lazy-load via IntersectionObserver
├── lib/
│   ├── db.ts             # Prisma client
│   ├── api.ts            # Hooks TanStack Query
│   ├── types.ts          # Types TypeScript
│   ├── calculations.ts   # Calculs purs (dashboard, marges)
│   ├── format.ts         # Formatage FCFA, dates, statuts
│   ├── store.ts          # Zustand (rôle, vue, mois)
│   └── server-mappers.ts # Conversion Prisma → TS
└── hooks/
    ├── use-toast.ts
    └── use-mobile.ts

prisma/
├── schema.prisma         # Bovin, Alimentation, Depense, Financement, Echeance, Alerte, Historique, Tag, Validation
└── seed.ts               # Données démo (15 bovins, 8 alimentations, 13 dépenses, 1 financement, 5 alertes)
```

## Palette SAVERDEV

| Couleur | Hex | Usage |
|---------|-----|-------|
| Vert forêt | #10B981 | Primary |
| Teal | #14B8A6 | Secondary |
| Vert clair | #34D399 | Accent |
| Ambre | #F59E0B | Warning |
| Rouge | #EF4444 | Destructive |
| Vert foncé | #14532A | En-têtes rapport |
| Marron | #4A3728 | Sidebar |

## Licence

Propriétaire — SAVERDEV (Sahel Vert pour un Développement Durable).
