#!/bin/bash
# Usage: ./scripts/switch-prisma-provider.sh [sqlite|postgresql]
# Permute proprement le provider Prisma entre sqlite (dev local) et postgresql (prod Vercel)
PROVIDER="${1:-postgresql}"

if [[ "$PROVIDER" != "sqlite" && "$PROVIDER" != "postgresql" ]]; then
  echo "✗ Provider invalide : $PROVIDER (attendu : sqlite ou postgresql)"
  echo "Usage: $0 [sqlite|postgresql]"
  exit 1
fi

SCHEMA="prisma/schema.prisma"

if [[ ! -f "$SCHEMA" ]]; then
  echo "✗ Fichier $SCHEMA introuvable"
  exit 1
fi

# Remplace la ligne provider = "..." du datasource db
sed -i "s/provider = \"\(sqlite\|postgresql\)\"/provider = \"$PROVIDER\"/" "$SCHEMA"

echo "✓ Provider Prisma basculé sur $PROVIDER"
echo "  → Pensez à régénérer le client : bun run db:generate"
if [[ "$PROVIDER" == "sqlite" ]]; then
  echo "  → Et pousser le schéma : bun run db:push"
fi
