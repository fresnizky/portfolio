#!/bin/sh
set -e

echo "Running database migrations..."
pnpm dlx prisma migrate deploy

echo "Starting application..."
exec "$@"
