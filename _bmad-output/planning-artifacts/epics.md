---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - path: '_bmad-output/planning-artifacts/prd.md'
    type: 'prd'
    description: 'Product Requirements Document - Portfolio Tracker (Web App Fintech)'
  - path: '_bmad-output/planning-artifacts/architecture.md'
    type: 'architecture'
    description: 'Architecture Decision Document - React+Vite, Express, PostgreSQL, Docker'
workflowType: 'epics-and-stories'
project_name: 'Portfolio Tracker'
user_name: 'Fede'
date: '2026-01-06'
lastStep: 4
status: 'complete'
completedAt: '2026-01-06'
epicCount: 6
storyCount: 20
frCoverage: '33/33 (100%)'
---

# Portfolio Tracker - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Portfolio Tracker, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**Portfolio Configuration (FR1-FR6):**
- FR1: Usuario puede agregar un nuevo activo al portfolio especificando ticker, nombre y categoría
- FR2: Usuario puede editar los datos de un activo existente
- FR3: Usuario puede eliminar un activo del portfolio
- FR4: Usuario puede asignar un porcentaje objetivo (target) a cada activo
- FR5: Sistema valida que los targets sumen exactamente 100%
- FR6: Usuario puede ver la lista completa de activos con sus targets actuales

**Holdings Management (FR7-FR11):**
- FR7: Usuario puede registrar la cantidad actual que posee de cada activo
- FR8: Usuario puede actualizar el precio actual de cada activo
- FR9: Sistema registra la fecha de última actualización de precio por activo
- FR10: Usuario puede ver el valor actual de cada posición (cantidad × precio)
- FR11: Sistema calcula y muestra el valor total del portfolio

**Transaction Recording (FR12-FR15, FR33):**
- FR12: Usuario puede registrar una transacción de compra con fecha, activo, cantidad, precio y comisión
- FR13: Usuario puede registrar una transacción de venta con fecha, activo, cantidad, precio y comisión
- FR14: Usuario puede ver el historial de transacciones registradas incluyendo comisiones
- FR15: Sistema actualiza automáticamente las cantidades de holdings al registrar transacciones
- FR33: Sistema calcula el costo total de cada transacción incluyendo comisiones

**Dashboard & Visualization (FR16-FR20):**
- FR16: Usuario puede ver el estado actual del portfolio en una vista principal (dashboard)
- FR17: Sistema muestra la distribución actual del portfolio por activo (% real)
- FR18: Sistema muestra la comparación entre distribución actual y targets
- FR19: Sistema muestra la desviación de cada activo respecto a su target
- FR20: Sistema indica visualmente la antigüedad de los precios cargados

**Alerts & Coaching (FR21-FR23):**
- FR21: Sistema muestra alerta cuando los precios tienen más de 7 días de antigüedad
- FR22: Sistema muestra alerta cuando un activo se desvía más del umbral configurado (default 5%)
- FR23: Usuario puede ver qué activos requieren atención (desviados o desactualizados)

**Historical Data (FR24-FR26):**
- FR24: Sistema guarda snapshots del estado del portfolio periódicamente
- FR25: Usuario puede ver la evolución del valor total del portfolio en el tiempo
- FR26: Sistema preserva el histórico cuando se modifican activos o targets

**Onboarding (FR27-FR29):**
- FR27: Sistema guía al usuario nuevo en la configuración inicial del portfolio
- FR28: Usuario puede completar el setup inicial ingresando activos, targets y holdings
- FR29: Usuario puede configurar preferencias (umbral de rebalanceo, días para alerta de precios)

**Settings & Preferences (FR30-FR32):**
- FR30: Usuario puede modificar el umbral de desviación para alertas de rebalanceo
- FR31: Usuario puede modificar el número de días para alerta de precios desactualizados
- FR32: Usuario puede ver y modificar la configuración general de la aplicación

### NonFunctional Requirements

**Data Integrity & Reliability (NFR1-NFR4):**
- NFR1: Los datos del portfolio deben persistir entre sesiones sin pérdida
- NFR2: Las transacciones registradas no pueden perderse una vez guardadas
- NFR3: El histórico de snapshots debe mantenerse íntegro a lo largo del tiempo
- NFR4: En caso de error durante una operación, el sistema debe mantener un estado consistente (no datos corruptos)

**Performance (NFR5-NFR7):**
- NFR5: El dashboard debe cargar en menos de 3 segundos en condiciones normales
- NFR6: Las operaciones de guardado (transacciones, precios) deben completarse en menos de 2 segundos
- NFR7: Los cálculos de distribución y desviación deben actualizarse inmediatamente al cambiar datos

**Security (NFR8-NFR10):**
- NFR8: La base de datos debe estar protegida contra acceso no autorizado (credenciales no expuestas)
- NFR9: La aplicación no debe exponer datos sensibles en logs o errores visibles
- NFR10: El acceso a la aplicación debe estar restringido (no expuesta públicamente sin protección)

**Maintainability (NFR11-NFR13):**
- NFR11: El código debe seguir convenciones estándar del stack elegido para facilitar mantenimiento
- NFR12: La estructura del proyecto debe permitir agregar nuevas funcionalidades sin refactorizar todo
- NFR13: Los datos deben poder exportarse en un formato estándar (JSON/CSV) como backup manual

### Additional Requirements

**From Architecture - Starter Template & Project Setup:**
- AR1: Proyecto inicializado con Vite react-ts template para frontend
- AR2: Backend Express 5.x con TypeScript y Prisma v7+ como ORM
- AR3: PostgreSQL 18 como base de datos con Docker Compose
- AR4: Integración con dev-tunnel para exposición local (puertos dinámicos vía .env.ports)
- AR5: Hot reload configurado para desarrollo (nodemon backend, Vite HMR frontend)

**From Architecture - Authentication & Security:**
- AR6: Autenticación JWT con access token (15min-1h expiración)
- AR7: Password hasheada con bcrypt en DB
- AR8: Rate limiting: 5 intentos login/min, 100 requests API/min
- AR9: CORS configurado solo para dominio del frontend

**From Architecture - Data & Validation:**
- AR10: Zod para validación runtime en frontend y backend
- AR11: Prisma Migrate para migraciones de base de datos
- AR12: Validación de reglas de negocio (ej: targets suman 100%) con Zod

**From Architecture - Frontend Stack:**
- AR13: Zustand para state management
- AR14: TanStack Query para fetching y cache
- AR15: Tailwind CSS + Shadcn/ui para estilos y componentes
- AR16: Recharts para gráficos de evolución
- AR17: React Hook Form + Zod para formularios

**From Architecture - Implementation Patterns:**
- AR18: Estructura feature-based en frontend (features/dashboard, features/portfolio, etc.)
- AR19: Servicios separados de routes en backend (business logic en services/)
- AR20: Patrones de naming: PascalCase modelos, camelCase campos, kebab-case rutas API
- AR21: Error handling centralizado con clase AppError
- AR22: Tests co-located junto a archivos fuente

### FR Coverage Map

| FR | Epic | Descripción |
|----|------|-------------|
| FR1 | Epic 2 | Agregar activo al portfolio |
| FR2 | Epic 2 | Editar datos de activo |
| FR3 | Epic 2 | Eliminar activo del portfolio |
| FR4 | Epic 2 | Asignar target a activo |
| FR5 | Epic 2 | Validar targets suman 100% |
| FR6 | Epic 2 | Ver lista de activos con targets |
| FR7 | Epic 3 | Registrar cantidad de cada activo |
| FR8 | Epic 3 | Actualizar precio de activo |
| FR9 | Epic 3 | Registrar fecha de actualización de precio |
| FR10 | Epic 3 | Ver valor de cada posición |
| FR11 | Epic 3 | Calcular valor total del portfolio |
| FR12 | Epic 4 | Registrar transacción de compra |
| FR13 | Epic 4 | Registrar transacción de venta |
| FR14 | Epic 4 | Ver historial de transacciones |
| FR15 | Epic 4 | Actualizar holdings automáticamente |
| FR16 | Epic 5 | Ver estado actual en dashboard |
| FR17 | Epic 5 | Mostrar distribución actual (% real) |
| FR18 | Epic 5 | Comparar distribución vs targets |
| FR19 | Epic 5 | Mostrar desviación por activo |
| FR20 | Epic 3 | Indicar antigüedad de precios |
| FR21 | Epic 3 | Alerta precios >7 días |
| FR22 | Epic 5 | Alerta desviación >umbral |
| FR23 | Epic 5 | Ver activos que requieren atención |
| FR24 | Epic 6 | Guardar snapshots periódicos |
| FR25 | Epic 6 | Ver evolución temporal |
| FR26 | Epic 6 | Preservar histórico en cambios |
| FR27 | Epic 6 | Guiar setup inicial |
| FR28 | Epic 6 | Completar setup inicial |
| FR29 | Epic 6 | Configurar preferencias |
| FR30 | Epic 6 | Modificar umbral de rebalanceo |
| FR31 | Epic 6 | Modificar días alerta precios |
| FR32 | Epic 6 | Ver/modificar configuración general |
| FR33 | Epic 4 | Calcular costo total con comisiones |

## Epic List

### Epic 1: Project Foundation & Authentication
Usuario puede acceder a la aplicación de forma segura con todo el stack técnico funcionando.

**Requisitos cubiertos:** AR1-AR9, NFR8-NFR10, NFR11-NFR12
- Setup completo del proyecto (Docker Compose, Frontend React+Vite, Backend Express, PostgreSQL)
- Sistema de autenticación JWT con login seguro
- Infraestructura de desarrollo con hot reload y dev-tunnel
- Estructura base del código siguiendo patrones de arquitectura

---

### Epic 2: Portfolio Configuration
Usuario puede definir su estrategia de inversión configurando activos y porcentajes objetivo.

**FRs cubiertos:** FR1, FR2, FR3, FR4, FR5, FR6
- CRUD completo de activos (ticker, nombre, categoría: ETF/FCI/Crypto/Cash)
- Asignación de porcentajes target por activo
- Validación que targets sumen exactamente 100%
- Vista de lista de activos con sus targets actuales

---

### Epic 3: Holdings & Price Management
Usuario puede registrar sus posiciones actuales y actualizar precios para ver el valor real de su portfolio.

**FRs cubiertos:** FR7, FR8, FR9, FR10, FR11, FR20, FR21
- Registro de cantidades (holdings) por activo
- Actualización de precios actuales con fecha de última actualización
- Cálculo de valor por posición (cantidad × precio)
- Cálculo de valor total del portfolio
- Indicador visual de antigüedad de precios
- Alerta cuando precios tienen más de 7 días

---

### Epic 4: Transaction Recording
Usuario puede registrar compras y ventas, manteniendo un historial completo de movimientos.

**FRs cubiertos:** FR12, FR13, FR14, FR15, FR33
- Registro de transacciones de compra (fecha, activo, cantidad, precio, comisión)
- Registro de transacciones de venta (fecha, activo, cantidad, precio, comisión)
- Historial de transacciones con todos los detalles
- Actualización automática de holdings al registrar transacciones
- Cálculo de costo total incluyendo comisiones

---

### Epic 5: Dashboard & Alerts
Usuario tiene visibilidad completa del estado de su portfolio con alertas que lo guían a actuar.

**FRs cubiertos:** FR16, FR17, FR18, FR19, FR22, FR23
- Dashboard principal con estado actual del portfolio
- Visualización de distribución actual por activo (% real)
- Comparación visual distribución actual vs targets
- Indicador de desviación por activo respecto a su target
- Alertas de rebalanceo cuando activo se desvía más del umbral (default 5%)
- Vista consolidada de activos que requieren atención

---

### Epic 6: Historical Evolution & Onboarding
Usuario puede ver la evolución de su portfolio en el tiempo y nuevos usuarios tienen un flujo guiado de setup.

**FRs cubiertos:** FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32
- Snapshots periódicos del estado del portfolio
- Gráfico de evolución del valor total en el tiempo
- Preservación del histórico cuando se modifican activos o targets
- Wizard de onboarding paso a paso para nuevos usuarios
- Configuración de preferencias (umbral rebalanceo, días alerta precios)
- Pantalla de settings para ver/modificar configuración general

---

## Epic 1: Project Foundation & Authentication

Usuario puede acceder a la aplicación de forma segura con todo el stack técnico funcionando.

### Story 1.1: Project Scaffolding & Docker Setup

**As a** developer,
**I want** the project structure initialized with Docker Compose orchestration,
**So that** I can run the full stack locally with a single command.

**Acceptance Criteria:**

**Given** a fresh clone of the repository
**When** I run `docker compose up`
**Then** three services start: frontend (React+Vite), backend (Express), and db (PostgreSQL 18)
**And** frontend is accessible on PORT_FRONTEND
**And** backend responds to health check on PORT_API/api/health
**And** PostgreSQL accepts connections on PORT_DB

**Given** the development environment
**When** I modify frontend source files
**Then** changes are reflected immediately via Vite HMR (hot module replacement)

**Given** the development environment
**When** I modify backend source files
**Then** the server restarts automatically via nodemon

---

### Story 1.2: Database Schema & Prisma Setup

**As a** developer,
**I want** Prisma ORM configured with the initial User model,
**So that** I have a type-safe database layer ready for authentication.

**Acceptance Criteria:**

**Given** the backend service is running
**When** I run `npx prisma migrate dev`
**Then** the User table is created in PostgreSQL with fields: id, email, passwordHash, createdAt, updatedAt

**Given** the Prisma schema
**When** I run `npx prisma generate`
**Then** TypeScript types are generated for the User model

**Given** the Prisma client
**When** I import it in backend code
**Then** I get full TypeScript autocomplete for database operations

---

### Story 1.3: User Authentication API

**As a** user,
**I want** to register and login with email/password,
**So that** my portfolio data is protected.

**Acceptance Criteria:**

**Given** I am a new user
**When** I POST to `/api/auth/register` with valid email and password
**Then** a new user is created with bcrypt-hashed password
**And** I receive a JWT access token

**Given** I am a registered user
**When** I POST to `/api/auth/login` with correct credentials
**Then** I receive a JWT access token (15min-1h expiration)

**Given** I provide incorrect credentials
**When** I POST to `/api/auth/login`
**Then** I receive a 401 Unauthorized error
**And** after 5 failed attempts in 1 minute, I am rate-limited

**Given** I have a valid JWT token
**When** I include it in Authorization header
**Then** protected API routes accept my requests

---

### Story 1.4: Frontend Auth Flow & Protected Routes

**As a** user,
**I want** a login page and protected application routes,
**So that** I can securely access my portfolio.

**Acceptance Criteria:**

**Given** I am not authenticated
**When** I navigate to the application
**Then** I am redirected to the login page

**Given** I am on the login page
**When** I enter valid credentials and submit
**Then** I am redirected to the dashboard
**And** my JWT token is stored securely

**Given** I am authenticated
**When** I click logout
**Then** my token is cleared and I am redirected to login

**Given** I am authenticated
**When** I navigate to any protected route
**Then** the page loads successfully with my session active

---

## Epic 2: Portfolio Configuration

Usuario puede definir su estrategia de inversión configurando activos y porcentajes objetivo.

### Story 2.1: Asset CRUD API & Database Model

**As a** user,
**I want** to create, read, update and delete assets in my portfolio,
**So that** I can define which investments I'm tracking.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I POST to `/api/assets` with ticker, name, and category (ETF/FCI/Crypto/Cash)
**Then** a new asset is created and returned with its ID

**Given** I have assets in my portfolio
**When** I GET `/api/assets`
**Then** I receive a list of all my assets with their details

**Given** an existing asset
**When** I PUT to `/api/assets/:id` with updated data
**Then** the asset is updated and the new data is returned

**Given** an existing asset
**When** I DELETE `/api/assets/:id`
**Then** the asset is removed from my portfolio

**Given** I try to create an asset with duplicate ticker
**When** I POST to `/api/assets`
**Then** I receive a 400 validation error

---

### Story 2.2: Target Percentage Assignment with Validation

**As a** user,
**I want** to assign target percentages to each asset with validation that they sum to 100%,
**So that** I can define my investment strategy.

**Acceptance Criteria:**

**Given** I have assets in my portfolio
**When** I PUT to `/api/assets/:id` with a targetPercentage value
**Then** the target is saved for that asset

**Given** I am updating targets
**When** the sum of all targets equals exactly 100%
**Then** the update is accepted

**Given** I am updating targets
**When** the sum of all targets does not equal 100%
**Then** I receive a validation error with the current sum

**Given** I have multiple assets
**When** I PUT to `/api/assets/targets` with an array of {assetId, targetPercentage}
**Then** all targets are updated atomically (all succeed or all fail)

---

### Story 2.3: Portfolio Configuration UI

**As a** user,
**I want** a visual interface to manage my assets and targets,
**So that** I can easily configure my investment strategy.

**Acceptance Criteria:**

**Given** I am on the portfolio configuration page
**When** the page loads
**Then** I see a list of all my assets with their current targets

**Given** I click "Add Asset"
**When** I fill the form with ticker, name, category and target
**Then** the asset is created and appears in the list

**Given** I click edit on an asset
**When** I modify the data and save
**Then** the asset is updated in the list

**Given** I click delete on an asset
**When** I confirm the deletion
**Then** the asset is removed from the list

**Given** I am editing targets
**When** targets don't sum to 100%
**Then** I see a real-time indicator showing the current sum and the difference

**Given** targets sum to 100%
**When** I view the target editor
**Then** I see a green checkmark confirming valid configuration

---

## Epic 3: Holdings & Price Management

Usuario puede registrar sus posiciones actuales y actualizar precios para ver el valor real de su portfolio.

### Story 3.1: Holdings Management API

**As a** user,
**I want** to register and update the quantity I hold of each asset,
**So that** I can track my actual positions.

**Acceptance Criteria:**

**Given** I have an asset in my portfolio
**When** I PUT to `/api/holdings/:assetId` with quantity
**Then** the holding is created or updated for that asset

**Given** I have holdings registered
**When** I GET `/api/holdings`
**Then** I receive all my holdings with assetId, quantity, and last update date

**Given** I update a holding
**When** the quantity is 0 or negative
**Then** I receive a validation error

**Given** I have holdings for multiple assets
**When** I GET `/api/holdings`
**Then** each holding includes the related asset details (ticker, name, category)

---

### Story 3.2: Price Update & Portfolio Valuation

**As a** user,
**I want** to update current prices and see my portfolio's total value,
**So that** I know how much my investments are worth.

**Acceptance Criteria:**

**Given** I have an asset
**When** I PUT to `/api/prices/:assetId` with currentPrice
**Then** the price is saved with the current timestamp as priceUpdatedAt

**Given** I have assets with prices and holdings
**When** I GET `/api/portfolio/summary`
**Then** I receive for each asset: quantity, currentPrice, value (quantity × price), priceUpdatedAt

**Given** I have multiple assets with holdings and prices
**When** I GET `/api/portfolio/summary`
**Then** I receive totalValue as the sum of all position values

**Given** I update multiple prices
**When** I PUT to `/api/prices/batch` with array of {assetId, price}
**Then** all prices are updated with current timestamp

---

### Story 3.3: Holdings & Prices UI with Staleness Indicator

**As a** user,
**I want** a visual interface to update holdings and prices with indicators of data freshness,
**So that** I can quickly update my portfolio each week.

**Acceptance Criteria:**

**Given** I am on the holdings/prices page
**When** the page loads
**Then** I see all assets with their quantities, current prices, and calculated values

**Given** an asset has priceUpdatedAt older than 7 days
**When** I view the asset
**Then** I see a yellow warning indicator showing "Price outdated: X days old"

**Given** an asset has priceUpdatedAt within 7 days
**When** I view the asset
**Then** I see a green checkmark or no warning

**Given** I click on a price field
**When** I enter a new value and save
**Then** the price is updated and the value recalculates immediately

**Given** I am viewing my portfolio
**When** prices are updated
**Then** the total portfolio value updates in real-time

**Given** any price is older than 7 days
**When** I view the page header
**Then** I see an alert banner: "Some prices need updating"

---

## Epic 4: Transaction Recording

Usuario puede registrar compras y ventas, manteniendo un historial completo de movimientos.

### Story 4.1: Transaction Recording API

**As a** user,
**I want** to record buy and sell transactions with all details,
**So that** I have a complete history of my investment movements.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I POST to `/api/transactions` with type "buy", assetId, date, quantity, price, and commission
**Then** a new buy transaction is created and returned

**Given** I am authenticated
**When** I POST to `/api/transactions` with type "sell", assetId, date, quantity, price, and commission
**Then** a new sell transaction is created and returned

**Given** a transaction is created
**When** I view the transaction details
**Then** I see totalCost calculated as (quantity × price) + commission for buys
**And** totalProceeds calculated as (quantity × price) - commission for sells

**Given** I create a transaction with missing required fields
**When** I POST to `/api/transactions`
**Then** I receive a 400 validation error with details of missing fields

**Given** I try to sell more than I hold
**When** I POST a sell transaction
**Then** I receive a validation error "Insufficient holdings"

---

### Story 4.2: Automatic Holdings Update on Transaction

**As a** user,
**I want** my holdings to update automatically when I record transactions,
**So that** I don't have to manually update quantities.

**Acceptance Criteria:**

**Given** I have 10 units of VOO
**When** I record a buy transaction for 5 units of VOO
**Then** my VOO holding is automatically updated to 15 units

**Given** I have 10 units of VOO
**When** I record a sell transaction for 3 units of VOO
**Then** my VOO holding is automatically updated to 7 units

**Given** I have no holding for GLD
**When** I record a buy transaction for 2 units of GLD
**Then** a new holding is created with 2 units of GLD

**Given** I record a transaction
**When** the transaction fails validation
**Then** the holding remains unchanged (atomic operation)

**Given** I have 5 units of BTC
**When** I record a sell transaction for 5 units of BTC
**Then** my BTC holding is updated to 0 (not deleted)

---

### Story 4.3: Transaction History UI

**As a** user,
**I want** to view my transaction history and record new transactions easily,
**So that** I can track all my investment activity.

**Acceptance Criteria:**

**Given** I am on the transactions page
**When** the page loads
**Then** I see a list of all transactions sorted by date (newest first)

**Given** I view a transaction
**When** I look at the details
**Then** I see: date, type (buy/sell), asset ticker, quantity, price, commission, and total cost/proceeds

**Given** I click "Add Transaction"
**When** I fill the form with type, asset, date, quantity, price, and commission
**Then** the transaction is recorded and appears in the list
**And** my holding for that asset is updated

**Given** I have many transactions
**When** I use the filters
**Then** I can filter by asset, type (buy/sell), and date range

**Given** I view the transaction list
**When** I look at the summary
**Then** I see total invested (sum of buy costs) and total withdrawn (sum of sell proceeds)

---

## Epic 5: Dashboard & Alerts

Usuario tiene visibilidad completa del estado de su portfolio con alertas que lo guían a actuar.

### Story 5.1: Dashboard Summary API

**As a** user,
**I want** an API endpoint that returns all dashboard data in one call,
**So that** the dashboard loads quickly with complete information.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I GET `/api/dashboard`
**Then** I receive a complete dashboard payload with:
- totalValue: sum of all position values
- positions: array with each asset's ticker, name, quantity, price, value, targetPercentage, actualPercentage, deviation
- alerts: array of active alerts (stale prices, rebalance needed)

**Given** I have assets with holdings and prices
**When** I GET `/api/dashboard`
**Then** actualPercentage for each asset is calculated as (assetValue / totalValue) × 100

**Given** I have assets with targets
**When** I GET `/api/dashboard`
**Then** deviation for each asset is calculated as actualPercentage - targetPercentage

**Given** an asset deviates more than the configured threshold (default 5%)
**When** I GET `/api/dashboard`
**Then** that asset appears in the alerts array with type "rebalance_needed"

---

### Story 5.2: Dashboard UI with Distribution Visualization

**As a** user,
**I want** a visual dashboard showing my portfolio status at a glance,
**So that** I can quickly understand my investment position.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** the page loads
**Then** I see the total portfolio value prominently displayed

**Given** I have assets with holdings
**When** I view the dashboard
**Then** I see a pie/donut chart showing actual distribution by asset

**Given** I have assets with targets
**When** I view the distribution
**Then** I see both actual % and target % for each asset side by side

**Given** an asset has positive deviation (overweight)
**When** I view that asset
**Then** it's highlighted in one color (e.g., orange)

**Given** an asset has negative deviation (underweight)
**When** I view that asset
**Then** it's highlighted in another color (e.g., blue)

**Given** an asset is within ±1% of target
**When** I view that asset
**Then** it's shown as balanced (e.g., green)

---

### Story 5.3: Alerts Panel & Attention Required View

**As a** user,
**I want** to see all alerts and assets requiring attention in one place,
**So that** I know exactly what actions I need to take.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** there are active alerts
**Then** I see an alerts panel prominently displayed

**Given** an asset needs rebalancing (deviation > threshold)
**When** I view the alerts panel
**Then** I see "VOO is 7% overweight - consider rebalancing" with the specific deviation

**Given** prices are stale (>7 days old)
**When** I view the alerts panel
**Then** I see "Update prices - last updated X days ago"

**Given** I click on an alert
**When** the alert is actionable
**Then** I am navigated to the relevant page (prices page for stale prices, portfolio for rebalance)

**Given** no alerts are active
**When** I view the dashboard
**Then** I see a positive message "Portfolio is on track!" or similar

**Given** I want a quick overview
**When** I view the "Attention Required" section
**Then** I see a consolidated list of all assets that need action with the reason

---

## Epic 6: Historical Evolution & Onboarding

Usuario puede ver la evolución de su portfolio en el tiempo y nuevos usuarios tienen un flujo guiado de setup.

### Story 6.1: Portfolio Snapshots API

**As a** user,
**I want** the system to save periodic snapshots of my portfolio state,
**So that** I can track my progress over time.

**Acceptance Criteria:**

**Given** I have a configured portfolio with holdings and prices
**When** I POST to `/api/snapshots` (or triggered automatically)
**Then** a snapshot is created with: date, totalValue, and breakdown by asset (quantity, price, value, percentage)

**Given** snapshots exist
**When** I GET `/api/snapshots`
**Then** I receive all snapshots sorted by date (newest first)

**Given** I want to see evolution
**When** I GET `/api/snapshots?from=2026-01-01&to=2026-03-31`
**Then** I receive only snapshots within that date range

**Given** I modify assets or targets
**When** I view historical snapshots
**Then** old snapshots retain their original values (immutable history)

**Given** a snapshot for today already exists
**When** I try to create another snapshot
**Then** the existing snapshot is updated (one snapshot per day max)

---

### Story 6.2: Evolution Chart & Historical View

**As a** user,
**I want** to see a chart of my portfolio's evolution over time,
**So that** I can visualize my progress toward retirement.

**Acceptance Criteria:**

**Given** I am on the evolution page
**When** the page loads
**Then** I see a line chart showing totalValue over time

**Given** I have snapshots from multiple months
**When** I view the chart
**Then** the X-axis shows dates and Y-axis shows portfolio value

**Given** I want to analyze a specific period
**When** I select a date range filter (1M, 3M, 6M, 1Y, All)
**Then** the chart updates to show only that period

**Given** I hover over a point on the chart
**When** I view the tooltip
**Then** I see the date and total value for that snapshot

**Given** I have historical data
**When** I view the summary below the chart
**Then** I see: period growth %, absolute gain/loss, and comparison to previous period

---

### Story 6.3: Onboarding Wizard

**As a** new user,
**I want** a guided setup process to configure my portfolio,
**So that** I can get started quickly without confusion.

**Acceptance Criteria:**

**Given** I am a new user with no assets configured
**When** I log in for the first time
**Then** I am redirected to the onboarding wizard

**Given** I am on step 1 of onboarding
**When** I add my first asset with ticker, name, category
**Then** I can add more assets or proceed to step 2

**Given** I am on step 2 of onboarding
**When** I assign target percentages to each asset
**Then** I see real-time validation that targets sum to 100%
**And** I cannot proceed until targets are valid

**Given** I am on step 3 of onboarding
**When** I enter current holdings (quantities) for each asset
**Then** I can optionally enter current prices

**Given** I complete all onboarding steps
**When** I click "Finish Setup"
**Then** I am redirected to the dashboard with my configured portfolio
**And** a flag is set so I don't see onboarding again

**Given** I want to skip onboarding
**When** I click "Skip for now"
**Then** I can access the app but see a reminder to complete setup

---

### Story 6.4: Settings & Preferences Management

**As a** user,
**I want** to configure my alert thresholds and preferences,
**So that** the app behaves according to my needs.

**Acceptance Criteria:**

**Given** I am on the settings page
**When** the page loads
**Then** I see my current preferences: rebalanceThreshold (default 5%), priceAlertDays (default 7)

**Given** I want to change the rebalance threshold
**When** I update it to 10% and save
**Then** the threshold is saved and alerts use the new value

**Given** I want to change the price staleness alert
**When** I update priceAlertDays to 14 and save
**Then** prices are considered stale only after 14 days

**Given** I am on settings
**When** I view export options
**Then** I can export my data as JSON or CSV for backup

**Given** I click "Export JSON"
**When** the export completes
**Then** I download a file containing all my assets, holdings, transactions, and snapshots

**Given** I view the settings page
**When** I look at my account info
**Then** I see my email and can change my password

---

## Epic 10: Contribution Allocation Suggestions

Usuario puede registrar aportes mensuales y recibir sugerencias inteligentes de distribución que consideran los targets definidos y las desviaciones actuales para optimizar el rebalanceo pasivo.

**FRs cubiertos:** FR34, FR35, FR36
- Cálculo de distribución sugerida según targets
- Ajuste inteligente para corregir desviaciones (rebalanceo pasivo)
- Interface para ver, aceptar o modificar sugerencias
- Integración con registro de transacciones

---

### Story 10.1: Contribution Suggestion API

**As a** user,
**I want** the system to calculate how to distribute a contribution amount across my assets,
**So that** I can follow my investment strategy and correct deviations efficiently.

**Acceptance Criteria:**

**Given** I have assets with target percentages that sum to 100%
**When** I POST to `/api/contributions/suggest` with an amount
**Then** I receive a distribution suggestion with amount per asset

**Given** I have assets with current deviations from targets
**When** I request a contribution suggestion
**Then** the suggestion prioritizes underweight assets and reduces allocation to overweight assets

**Given** I request a suggestion for $1000 with targets VOO:60%, GLD:20%, BTC:20%
**When** VOO is 5% underweight and BTC is 5% overweight
**Then** the suggestion allocates more than $600 to VOO and less than $200 to BTC

**Given** I have no assets configured
**When** I POST to `/api/contributions/suggest`
**Then** I receive a 400 error indicating assets must be configured first

---

### Story 10.2: Contribution Suggestion UI

**As a** user,
**I want** a visual interface to enter my contribution amount and see the suggested distribution,
**So that** I can quickly understand how to allocate my monthly investment.

**Acceptance Criteria:**

**Given** I am on the contributions page
**When** I enter a contribution amount
**Then** I see a breakdown showing suggested amount per asset

**Given** a suggestion is displayed
**When** an asset has a rebalancing adjustment
**Then** I see an indicator showing the adjustment reason (e.g., "+$50 to correct underweight")

**Given** I view the suggestion
**When** I want to proceed
**Then** I can click "Use Suggestion" to pre-fill transaction forms

**Given** I view the suggestion
**When** I disagree with the distribution
**Then** I can manually adjust amounts before proceeding

**Given** I am on mobile
**When** I view the contributions page
**Then** the interface is usable and readable

---

### Story 10.3: Contribution to Transaction Integration

**As a** user,
**I want** to easily convert my contribution suggestion into actual transactions,
**So that** I can record my purchases without re-entering data.

**Acceptance Criteria:**

**Given** I have accepted a contribution suggestion
**When** I click "Record Transactions"
**Then** I am guided to create buy transactions for each suggested asset

**Given** I am recording transactions from a suggestion
**When** I complete a transaction for one asset
**Then** the system shows remaining assets to process

**Given** I have recorded all transactions from a suggestion
**When** I finish the flow
**Then** I see a summary of what was recorded and my updated portfolio state

**Given** I started but didn't complete all transactions
**When** I return to the app later
**Then** I can resume or discard the pending contribution plan
