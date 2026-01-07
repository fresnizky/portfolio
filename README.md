# Portfolio Tracker

Aplicación web fintech para tracking de inversiones y portafolio personal.

## Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|------------|---------|
| Frontend | React + Vite | Vite 7.2.7 |
| Backend | Express + TypeScript | Express 5.x, Node 24.12.0 |
| Database | PostgreSQL | 18 |
| ORM | Prisma | 7 |
| Orquestación | Docker Compose | Latest |

## Estructura del Proyecto

```
portfolio/
├── frontend/          # React + Vite + TypeScript
├── backend/           # Express + TypeScript + Prisma
├── docker-compose.yml # Configuración de producción
├── docker-compose.dev.yml # Override para desarrollo
└── .env.ports         # Puertos asignados por dev-tunnel
```

## Requisitos Previos

- Docker y Docker Compose
- Node.js 24.x (para desarrollo local sin Docker)
- dev-tunnel CLI (para integración con túnel SSH)

## Setup Inicial

### 1. Registrar proyecto en dev-tunnel

```bash
dev-tunnel register portfolio --path $(pwd)
```

### 2. Generar archivo de puertos

```bash
dev-tunnel env portfolio > .env.ports

# Verificar que se generó correctamente
cat .env.ports | grep PORT_
# Debería mostrar: PORT_FRONTEND, PORT_API, PORT_DB
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores (JWT_SECRET, credenciales DB, etc.)
```

### 4. Iniciar servicios

```bash
# Desarrollo (con hot reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.ports up

# Producción
docker compose --env-file .env.ports up
```

## Servicios y Puertos

Los puertos son asignados automáticamente por dev-tunnel. Consultar `.env.ports` para ver los valores asignados:

| Servicio | Puerto (default) | Subdominio |
|----------|-----------------|------------|
| Frontend | PORT_FRONTEND (10001) | portfolio.resnizky.ar |
| Backend API | PORT_API (10002) | api.portfolio.resnizky.ar |
| PostgreSQL | PORT_DB (10003) | db.portfolio.resnizky.ar |

## Comandos Útiles

### Ver estado del proyecto
```bash
dev-tunnel info portfolio
```

### Ver puertos asignados
```bash
dev-tunnel list
```

### Ver logs de servicios
```bash
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f db
```

### Verificar health check del backend
```bash
curl http://localhost:${PORT_API}/api/health
```

## Desarrollo

### Frontend
El frontend usa Vite con HMR (Hot Module Replacement). Los cambios en `frontend/src/` se reflejan automáticamente.

### Backend
El backend usa nodemon para hot reload. Los cambios en `backend/src/` reinician el servidor automáticamente.

## Variables de Entorno

### Root (.env)
- `JWT_SECRET`: Secreto para tokens JWT
- `POSTGRES_USER`: Usuario de PostgreSQL
- `POSTGRES_PASSWORD`: Contraseña de PostgreSQL
- `POSTGRES_DB`: Nombre de la base de datos

### Frontend (.env)
- `VITE_API_URL`: URL del backend API

### Backend (.env)
- `DATABASE_URL`: URL de conexión a PostgreSQL
- `JWT_SECRET`: Secreto para tokens JWT
- `NODE_ENV`: Entorno (development/production)
- `PORT`: Puerto interno del servidor

## Licencia

Proyecto privado.
