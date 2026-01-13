#!/bin/bash
set -e

echo ""
echo "⚠️  WARNING: This will permanently delete all PRODUCTION data!"
echo "   - Database volume (postgres_data_prod)"
echo "   - All containers in the prod stack"
echo ""
read -p "Are you sure? Type 'yes' to confirm: " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Cleaning production stack..."
docker compose -f docker-compose.prod.yml down -v
echo "Done."
