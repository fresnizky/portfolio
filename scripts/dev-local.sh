#!/bin/bash
# Script para desarrollo local: Backend+DB en Docker, Frontend local
# Uso: ./scripts/dev-local.sh

set -e

echo "🚀 Iniciando servicios de desarrollo local..."

# Detener solo el frontend de Docker si está corriendo (para liberar el puerto)
echo "📦 Verificando frontend en Docker..."
docker stop portfolio-frontend-1 2>/dev/null || true

# Levantar backend y db en Docker (sin --build para ser más rápido, usar --build si hay cambios)
echo "🐳 Levantando backend y database en Docker..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env --env-file .env.ports up backend db -d

# Esperar a que el backend esté listo
echo "⏳ Esperando a que el backend esté listo..."
sleep 3

# Verificar que el backend esté corriendo
if docker ps | grep -q "portfolio-backend"; then
    echo "✅ Backend corriendo en http://localhost:10002"
else
    echo "❌ Error: Backend no está corriendo"
    docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env --env-file .env.ports logs backend
    exit 1
fi

# Iniciar frontend local
echo "🖥️  Iniciando frontend local en http://localhost:10001..."
echo "📡 Accesible via https://portfolio-dev.resnizky.ar"
echo ""
cd frontend && pnpm dev
