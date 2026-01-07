# Story 1.4 - Validation Checklist

## Pre-requisitos

```bash
cd frontend
```

---

## 1. Verificar Dependencias Instaladas

```bash
pnpm list react-router @tanstack/react-query zustand zod react-hook-form @hookform/resolvers
pnpm list -D tailwindcss @tailwindcss/vite
```

**Esperado:** Todas las dependencias listadas con versiones.

---

## 2. TypeScript Type Check

```bash
pnpm typecheck
```

**Esperado:** Sin errores, comando termina exitosamente.

---

## 3. ESLint

```bash
pnpm lint
```

**Esperado:** Sin errores ni warnings.

---

## 4. Tests Unitarios e Integración

### Ejecutar todos los tests:

```bash
pnpm test
```

**Esperado:** 25 tests passing en 6 archivos:
- `src/lib/api.test.ts` (5 tests)
- `src/stores/authStore.test.ts` (7 tests)
- `src/components/common/ProtectedRoute.test.tsx` (3 tests)
- `src/App.test.tsx` (1 test)
- `src/features/auth/hooks/useLogin.test.tsx` (3 tests)
- `src/features/auth/components/LoginForm.test.tsx` (6 tests)

### Ejecutar tests individualmente (opcional):

```bash
pnpm test src/lib/api.test.ts
pnpm test src/stores/authStore.test.ts
pnpm test src/components/common/ProtectedRoute.test.tsx
pnpm test src/features/auth/components/LoginForm.test.tsx
pnpm test src/features/auth/hooks/useLogin.test.tsx
```

---

## 5. Build de Producción

```bash
pnpm build
```

**Esperado:** Build exitoso, genera carpeta `dist/` con:
- `index.html`
- `assets/index-*.css`
- `assets/index-*.js`

---

## 6. Verificar Estructura de Archivos

```bash
ls -la src/lib/
ls -la src/stores/
ls -la src/types/
ls -la src/validations/
ls -la src/features/auth/
ls -la src/features/auth/components/
ls -la src/features/auth/hooks/
ls -la src/features/dashboard/
ls -la src/components/common/
ls -la src/components/layout/
```

**Archivos esperados:**

| Directorio | Archivos |
|------------|----------|
| `src/lib/` | `api.ts`, `api.test.ts`, `queryClient.ts`, `queryKeys.ts` |
| `src/stores/` | `authStore.ts`, `authStore.test.ts` |
| `src/types/` | `api.ts` |
| `src/validations/` | `auth.ts` |
| `src/features/auth/` | `index.tsx` |
| `src/features/auth/components/` | `LoginForm.tsx`, `LoginForm.test.tsx` |
| `src/features/auth/hooks/` | `useLogin.ts`, `useLogin.test.tsx`, `useLogout.ts`, `useAuth.ts` |
| `src/features/dashboard/` | `index.tsx` |
| `src/components/common/` | `ProtectedRoute.tsx`, `ProtectedRoute.test.tsx` |
| `src/components/layout/` | `Layout.tsx` |

---

## 7. Validación Manual en Browser (Opcional)

### Iniciar servidor de desarrollo:

```bash
pnpm dev
```

### Verificar AC1: Redirect a login cuando no autenticado
1. Abrir `http://localhost:5173/`
2. **Esperado:** Redirige a `/login`

### Verificar AC2: Login exitoso redirige a dashboard
1. En `/login`, ingresar credenciales válidas
2. **Esperado:** Redirige a `/dashboard`, muestra email del usuario

### Verificar AC3: Logout limpia sesión
1. En dashboard, click en "Logout"
2. **Esperado:** Redirige a `/login`, token eliminado de localStorage

### Verificar AC4: Rutas protegidas requieren autenticación
1. Intentar navegar directamente a `/dashboard` sin estar logueado
2. **Esperado:** Redirige a `/login`

---

## 8. Verificar Configuración de Tailwind v4

```bash
cat src/index.css
```

**Esperado:** Contiene `@import "tailwindcss";`

```bash
grep -A5 "plugins" vite.config.ts
```

**Esperado:** Incluye `tailwindcss()` en plugins.

---

## 9. Verificar Path Aliases

```bash
grep -A5 "resolve" vite.config.ts
```

**Esperado:** Alias `@` configurado apuntando a `./src`.

---

## Resumen de Comandos Rápidos

```bash
# Validación completa (ejecutar en orden)
cd frontend
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

---

## Acceptance Criteria Mapping

| AC | Validación | Cómo verificar |
|----|------------|----------------|
| AC1 | Redirect a login | Test en `ProtectedRoute.test.tsx`, validación manual |
| AC2 | Login redirige a dashboard | Test en `LoginForm.test.tsx`, `useLogin.test.tsx` |
| AC3 | Logout limpia sesión | Test en `authStore.test.ts` |
| AC4 | Rutas protegidas | Test en `ProtectedRoute.test.tsx` |
