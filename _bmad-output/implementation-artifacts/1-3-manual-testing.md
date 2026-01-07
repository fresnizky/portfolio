# Manual Testing Guide - Story 1-3: User Authentication API

## Pre-requisitos

### 1. Configurar variables de entorno

```bash
# Copiar ejemplo si no existe
cp .env.example .env

# Generar secrets seguros
openssl rand -base64 32  # Para JWT_SECRET
openssl rand -base64 24  # Para POSTGRES_PASSWORD
```

Editar `.env` con los valores generados:
```
JWT_SECRET=<valor generado>
POSTGRES_PASSWORD=<valor generado>
```

### 2. Levantar Docker (con rebuild)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml \
  --env-file .env --env-file .env.ports up --build
```

### 3. Verificar que el backend está corriendo

```bash
curl http://localhost:10002/api/health
# O revisar logs de Docker
```

---

## Tests Manuales

### Variables

```bash
# Ajustar puerto según .env.ports
API_URL="http://localhost:10002/api"
```

---

## 1. Register (`POST /api/auth/register`)

### 1.1 Registro exitoso

```bash
curl -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

**Esperado:** `201 Created`
```json
{
  "data": {
    "user": { "id": "uuid-...", "email": "test@example.com" },
    "token": "eyJhbG..."
  }
}
```

### 1.2 Email duplicado

```bash
# Ejecutar el mismo comando de arriba nuevamente
curl -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

**Esperado:** `409 Conflict`
```json
{
  "error": "CONFLICT",
  "message": "Email already registered"
}
```

### 1.3 Email inválido

```bash
curl -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", "password": "password123"}'
```

**Esperado:** `400 Bad Request`
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request body",
  "details": { "email": "Invalid email format" }
}
```

### 1.4 Password muy corto

```bash
curl -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "test2@example.com", "password": "short"}'
```

**Esperado:** `400 Bad Request`
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request body",
  "details": { "password": "Password must be at least 8 characters" }
}
```

---

## 2. Login (`POST /api/auth/login`)

### 2.1 Login exitoso

```bash
curl -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

**Esperado:** `200 OK`
```json
{
  "data": {
    "user": { "id": "uuid-...", "email": "test@example.com" },
    "token": "eyJhbG..."
  }
}
```

> **Nota:** Guardar el token para los tests de `/me`

### 2.2 Password incorrecto

```bash
curl -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrongpassword"}'
```

**Esperado:** `401 Unauthorized`
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid email or password"
}
```

### 2.3 Usuario no existe

```bash
curl -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "noexiste@example.com", "password": "password123"}'
```

**Esperado:** `401 Unauthorized`
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid email or password"
}
```

> **Nota:** El mensaje es idéntico al de password incorrecto (no revela si el email existe)

---

## 3. Me (`GET /api/auth/me`) - Ruta Protegida

### 3.1 Token válido

```bash
# Reemplazar <TOKEN> con el token obtenido del login
TOKEN="<TOKEN>"

curl -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado:** `200 OK`
```json
{
  "data": {
    "id": "uuid-...",
    "email": "test@example.com"
  }
}
```

### 3.2 Sin token

```bash
curl -X GET "$API_URL/auth/me"
```

**Esperado:** `401 Unauthorized`
```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

### 3.3 Token inválido

```bash
curl -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer token-invalido-12345"
```

**Esperado:** `401 Unauthorized`
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

### 3.4 Header mal formateado

```bash
curl -X GET "$API_URL/auth/me" \
  -H "Authorization: InvalidFormat token"
```

**Esperado:** `401 Unauthorized`
```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

---

## 4. Rate Limiting

### 4.1 Exceder límite en login (5 por minuto)

```bash
# Ejecutar 7 veces rápidamente
for i in {1..7}; do
  echo "Intento $i:"
  curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}' | head -c 100
  echo -e "\n"
done
```

**Esperado:**
- Intentos 1-5: `401 Unauthorized` (credenciales inválidas)
- Intentos 6+: `429 Too Many Requests`

```json
{
  "error": "TOO_MANY_REQUESTS",
  "message": "Too many attempts. Try again later.",
  "details": { "retryAfter": 60 }
}
```

### 4.2 Exceder límite en register

```bash
# Similar al anterior pero con diferentes emails
for i in {1..7}; do
  echo "Intento $i:"
  curl -s -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"test${i}@example.com\", \"password\": \"password123\"}" | head -c 100
  echo -e "\n"
done
```

**Esperado:**
- Intentos 1-5: `201 Created` o `409 Conflict`
- Intentos 6+: `429 Too Many Requests`

---

## Checklist de Acceptance Criteria

| AC | Descripción | Tests |
|----|-------------|-------|
| 1 | Register con email/password, valida email único, hash password | 1.1, 1.2, 1.3, 1.4 |
| 2 | Login retorna JWT con id y email, expira en 1h | 2.1, 2.2, 2.3 |
| 3 | Rate limiting 5 intentos/minuto para auth endpoints | 4.1, 4.2 |
| 4 | Rutas protegidas verifican JWT y retornan 401 si inválido | 3.1, 3.2, 3.3, 3.4 |

---

## Troubleshooting

### El backend no responde
```bash
# Ver logs
docker compose logs backend

# Verificar que el container esté corriendo
docker compose ps
```

### Error de conexión a DB
```bash
# Verificar que la DB esté healthy
docker compose ps db

# Ver logs de DB
docker compose logs db
```

### Token expirado
- Los tokens expiran en 1 hora por defecto
- Generar nuevo token con login
