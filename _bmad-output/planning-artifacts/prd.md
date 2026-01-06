---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-complete']
inputDocuments:
  - path: '/Users/federicoresnizky/Downloads/Portfolio_Inversiones_Retiro.xlsx'
    type: 'spreadsheet-reference'
    description: 'Excel de tracking de inversiones con estructura de portfolio, transacciones, histórico y aportes mensuales'
workflowType: 'prd'
lastStep: 11
completedAt: '2026-01-06'
status: 'complete'
projectType: 'greenfield'
documentCounts:
  briefs: 0
  research: 0
  projectDocs: 1
projectClassification:
  type: 'web_app'
  domain: 'fintech'
  complexity: 'medium'
---

# Product Requirements Document - Portfolio Tracker

**Author:** Fede
**Date:** 2026-01-05

## Executive Summary

### Visión del Producto

**Portfolio Tracker** es una aplicación web (con versión mobile) diseñada para inversores retail que siguen un plan de inversión de largo plazo hacia el retiro. A diferencia de los spreadsheets tradicionales o apps de tracking pasivas, combina visualización de portfolio con **coaching activo** mediante nudges que mantienen al usuario disciplinado en su estrategia.

### Problema que Resuelve

1. **Fragilidad del spreadsheet**: Miedo a editar y romper fórmulas, estructuras de datos o históricos
2. **Falta de disciplina**: Olvidar hacer aportes mensuales, actualizar valuaciones, o rebalancear cuando corresponde  
3. **Complejidad multi-mercado**: Trackear activos en diferentes mercados (ETFs en USD vía IOL, FCIs argentinos, crypto) sin una herramienta unificada
4. **Falta de guía**: No saber cuándo ni cómo rebalancear para mantenerse alineado con los targets
5. **Estrategia estática**: Dificultad para redefinir objetivos, ajustar porcentajes target, o agregar/quitar activos cuando la estrategia evoluciona

### Usuarios Objetivo

Inversor retail individual con:
- Plan de inversión de largo plazo (retiro)
- Portfolio diversificado en múltiples mercados y monedas
- Aportes mensuales recurrentes con distribución por targets
- Necesidad de simplicidad sin sacrificar visibilidad
- Estrategia que puede evolucionar con el tiempo

### What Makes This Special

**El Coach, no solo el Dashboard**

La app no es un visor pasivo de datos - es un asistente que:
- **Recuerda** hacer los aportes mensuales del plan
- **Pide** actualizar valuaciones cuando están desactualizadas  
- **Alerta** cuando un activo se desvía del target y sugiere cómo rebalancear
- **Celebra** el progreso hacia las metas de largo plazo

**Estrategia Flexible**

El plan de inversión no está grabado en piedra:
- Redefinir porcentajes objetivo cuando cambian las circunstancias
- Agregar nuevos activos al portfolio
- Retirar activos que ya no forman parte de la estrategia
- Histórico que respeta los targets vigentes en cada momento

**Multi-mercado sin fricción**

Soporta nativamente la realidad del inversor argentino:
- ETFs en USD (VOO, GLD) vía broker internacional
- FCIs locales en pesos/dólares
- Crypto (BTC)
- Reserva de corto plazo en ARS (MercadoPago)

**Ingreso de datos facilitado**

En lugar de integraciones complejas (fase futura), prioriza:
- Importación de CSV/XLS
- Carga desde comprobantes PDF
- Entrada manual con UX optimizada

## Project Classification

| Aspecto | Valor |
|---------|-------|
| **Tipo Técnico** | Web App (PWA con versión mobile) |
| **Dominio** | Fintech (Personal Finance) |
| **Complejidad** | Media (tracking personal, sin manejo de fondos reales) |
| **Contexto** | Greenfield - proyecto nuevo |

## Success Criteria

### User Success

**Indicadores de éxito del usuario:**

1. **Disciplina sostenida**: Mantener el ritmo de aportes mensuales sin interrupciones, gracias a los recordatorios del sistema
2. **Portfolio alineado**: Saber en todo momento cuánto comprar de cada activo para volver a los targets definidos
3. **Paz mental**: No tener que calcular ni recordar - la app guía cada paso del proceso
4. **Evolución controlada**: Poder cambiar la estrategia (targets, activos) sin miedo a perder histórico o romper datos

**Métrica clave de engagement:**
- Uso semanal mínimo para actualizar valuaciones
- Alerta de riesgo si pasan más de 2 semanas sin actividad

**Outcome principal:**
- Trackear la evolución del portfolio a lo largo del tiempo (el histórico es el valor central)

### Business Success

**Contexto:** Herramienta 100% personal, sin planes de monetización o expansión a otros usuarios.

**Criterio de éxito:**
- El usuario (Fede) usa activamente la herramienta como reemplazo definitivo del spreadsheet
- La app se convierte en la fuente de verdad para decisiones de inversión

### Technical Success

**Requisitos técnicos esenciales:**

| Aspecto | Requisito | Justificación |
|---------|-----------|---------------|
| **Histórico de datos** | Obligatorio | Core del producto - sin esto no hay tracking de evolución |
| **Persistencia** | Base de datos confiable | Los datos no pueden perderse |
| **Backups automáticos** | Opcional (nice-to-have) | Depende del hosting final |
| **Performance** | No crítico | Unos segundos de carga es aceptable |
| **Modo offline** | No requerido inicialmente | Hosting local vía dev-tunnel; evaluar post-migración a hosting externo |

**Arquitectura inicial:**
- Docker Compose con DB, Backend, Frontend
- Ejecución local con exposición vía dev-tunnel
- Migración futura a hosting simple (Hostinger/Hetzner/DigitalOcean)

### Measurable Outcomes

| Métrica | Target | Cómo se mide |
|---------|--------|--------------|
| Frecuencia de uso | Mínimo 1x por semana | Última fecha de actualización de valuaciones |
| Aportes registrados | 100% de los aportes mensuales | Comparación plan vs registros |
| Alertas de rebalanceo | Accionadas en <7 días | Tiempo entre alerta y acción |
| Evolución trackeada | 12+ meses de histórico | Datos en la base |

## Product Scope

### MVP - Minimum Viable Product

**Funcionalidades core para primera versión usable:**

1. **Gestión de Portfolio**
   - Definir activos con ticker, nombre, categoría (ETF/FCI/Crypto/Cash)
   - Definir porcentajes objetivo por activo
   - Modificar targets y agregar/quitar activos

2. **Registro de Transacciones**
   - Registrar compras/ventas con fecha, cantidad, precio
   - Entrada manual con UX simple
   - Importación básica desde CSV/XLS

3. **Valuación Actual**
   - Ingresar precios actuales manualmente
   - Ver valor total del portfolio
   - Ver distribución actual vs objetivos

4. **Histórico**
   - Guardar snapshots de valuación (mínimo mensual)
   - Visualizar evolución temporal del portfolio

5. **Coaching Básico**
   - Nudge para actualizar valuaciones si pasan >7 días
   - Alerta cuando un activo se desvía >5% del target
   - Sugerencia de cuánto comprar para rebalancear

### Growth Features (Post-MVP)

**Mejoras para después de validar el MVP:**

- Importación desde PDF de comprobantes (OCR)
- Gráficos de evolución más sofisticados
- Proyecciones hacia meta de retiro
- Checklist mensual interactivo de aportes
- Notificaciones push/email de recordatorios
- Multi-moneda con conversión automática (USD/ARS)

### Vision (Future)

**Funcionalidades a largo plazo (si el producto evoluciona):**

- Integraciones con APIs de brokers (IOL, etc.)
- Precios en tiempo real automáticos
- Modo offline con sync
- Exportación de reportes fiscales
- Posible apertura a otros usuarios (si hay interés)

## User Journeys

### Journey 1: Fede - Actualización Semanal de Viernes

Fede es un desarrollador de software que sigue un plan de inversión de largo plazo para su retiro. Cada viernes, después de que cierra el mercado, se sienta en su notebook con un café y abre Portfolio Tracker junto con la app de InvertirOnline.

Al entrar, el dashboard le muestra inmediatamente el estado de su portfolio: valor total, distribución actual vs targets, y cualquier alerta pendiente. Esta semana, un badge amarillo le indica que los precios tienen 7 días de antigüedad. Fede abre IOL en otra pestaña, consulta las cotizaciones de VOO, GLD y el FCI de Adcap, y las ingresa rápidamente en Portfolio Tracker.

El sistema recalcula automáticamente y le muestra que su posición en S&P 500 está 2% por debajo del target mientras que Cash está 2% por encima. Como la desviación es menor al 5%, no hay alerta de rebalanceo - solo una nota informativa. Fede cierra la app satisfecho, sabiendo que todo está bajo control. Tiempo total: 5 minutos.

**Requisitos revelados:**
- Dashboard con estado actual prominente
- Indicador de antigüedad de precios
- Entrada rápida de precios actuales
- Cálculo automático de distribución vs targets
- Alertas visuales según severidad (info vs warning)

---

### Journey 2: Fede - Aporte Mensual y Distribución

Es el primer viernes del mes. Fede acaba de recibir su ingreso y ya transfirió los USD 2,000 a InvertirOnline. Abre Portfolio Tracker y el sistema le muestra un recordatorio destacado: "Aporte mensual pendiente de registrar".

Fede hace clic en "Registrar aporte" e ingresa el monto. El sistema automáticamente le sugiere cómo distribuirlo según sus targets actuales:
- $1,200 → VOO (60%)
- $200 → GLD (10%)
- $100 → BTC (5%)
- $200 → Adcap Acciones (10%)
- $300 → Cash (15%)

Pero además, como S&P 500 está un poco bajo, el sistema le sugiere un ajuste: "Para acercarte más al target, podrías poner $50 extra en VOO y $50 menos en Cash". Fede acepta la sugerencia, ejecuta las compras en IOL, y registra cada transacción. El portfolio queda perfectamente alineado.

**Requisitos revelados:**
- Recordatorio de aporte mensual pendiente
- Registro de aporte con monto
- Sugerencia automática de distribución según targets
- Ajuste inteligente para corregir desviaciones
- Registro de transacciones individuales (compra por activo)

---

### Journey 3: Fede - Alerta de Rebalanceo

Han pasado 3 meses y el mercado estuvo volátil. Este viernes, cuando Fede actualiza los precios, Portfolio Tracker le muestra una alerta naranja: "Bitcoin representa 8% del portfolio (target: 5%). Considerá rebalancear."

Fede hace clic en la alerta y el sistema le muestra opciones:
1. **Vender BTC**: Vender $X de BTC para volver al 5%
2. **Rebalancear con próximo aporte**: No vender, pero dirigir el próximo aporte a otros activos
3. **Ajustar target**: Tal vez 8% es el nuevo normal para crypto

Fede decide la opción 2 - no quiere vender y pagar impuestos. El sistema registra esta decisión y en el próximo aporte mensual, le sugerirá no comprar BTC hasta que el portfolio se reequilibre naturalmente.

**Requisitos revelados:**
- Alertas de desviación con umbral configurable (>5%)
- Opciones de acción para rebalanceo
- Rebalanceo pasivo (via aportes futuros)
- Registro de decisiones tomadas
- Ajuste de targets desde contexto de alerta

---

### Journey 4: Fede - Cambio de Estrategia

Después de investigar, Fede decide que quiere agregar exposición a mercados emergentes. Entra a Portfolio Tracker y va a "Configurar Portfolio".

Ahí ve sus activos actuales con sus targets. Hace clic en "Agregar activo" e ingresa:
- Ticker: VWO
- Nombre: Vanguard Emerging Markets
- Categoría: ETF
- Target: 5%

El sistema le avisa: "Los targets ahora suman 105%. ¿Cómo querés ajustar?" Le ofrece reducir proporcionalmente los demás o elegir manualmente. Fede decide sacar 5% de Cash (que baja de 15% a 10%).

El sistema guarda el cambio con fecha efectiva, preservando el histórico anterior. Cuando Fede mira la evolución, puede ver que hasta esta fecha tenía una estrategia y desde hoy tiene otra - sin perder continuidad.

**Requisitos revelados:**
- CRUD de activos en portfolio
- Validación de targets (deben sumar 100%)
- Sugerencias de ajuste proporcional
- Histórico de cambios de estrategia con fecha
- Continuidad en visualización de evolución

---

### Journey 5: Fede - Revisión Trimestral de Evolución

Es fin de trimestre y Fede quiere ver cómo viene su camino al retiro. Entra a Portfolio Tracker y va a "Evolución".

Ve un gráfico de línea mostrando el valor total del portfolio en los últimos 3 meses (y eventualmente años). Puede filtrar por período y ver también la composición en cada momento. Un indicador le muestra: "Crecimiento este trimestre: +4.2%".

También ve una tabla con los aportes realizados vs los planificados: 3/3 meses con aporte completo. El sistema le muestra un mensaje positivo: "Vas 3 meses consistente. ¡Seguí así!"

Fede se siente motivado viendo el progreso tangible de su disciplina.

**Requisitos revelados:**
- Gráfico de evolución temporal
- Filtros por período
- Cálculo de rendimiento por período
- Tracking de consistencia de aportes
- Feedback positivo / gamificación básica

---

### Journey 6: Fede - Setup Inicial (Primera Vez)

Fede acaba de instalar Portfolio Tracker. El sistema le da la bienvenida y lo guía paso a paso para configurar su portfolio.

**Paso 1 - Definir activos:** Fede agrega uno por uno sus 5 activos (VOO, GLD, BTC, Adcap Acciones, Cash USD), ingresando ticker, nombre y categoría para cada uno.

**Paso 2 - Asignar targets:** El sistema le pide el porcentaje objetivo para cada activo. A medida que ingresa, ve el total acumulado. Cuando llega a 100%, el sistema confirma que está listo.

**Paso 3 - Cargar estado actual:** Fede ingresa las cantidades actuales que tiene de cada activo y los precios del día. El sistema calcula el valor total y la distribución actual.

**Paso 4 - Preferencias:** Configura sus umbrales: recordatorio de aporte el día 1 de cada mes, alerta de rebalanceo al 5% de desviación, y notificación si no actualiza precios en 7 días.

El wizard toma 10 minutos y Fede está listo para su primer viernes de tracking.

**Requisitos revelados:**
- Wizard de onboarding paso a paso
- Alta manual de activos guiada
- Configuración de targets con validación en tiempo real
- Carga de holdings iniciales
- Configuración de preferencias y umbrales

---

### Journey Requirements Summary

| Área Funcional | Capabilities Requeridas |
|----------------|------------------------|
| **Dashboard** | Estado actual, alertas, antigüedad de datos, acceso rápido a acciones |
| **Gestión de Precios** | Entrada manual rápida, tracking de última actualización |
| **Transacciones** | Registro de compras/ventas, aportes mensuales |
| **Rebalanceo** | Cálculo de desviación, sugerencias, opciones de acción |
| **Estrategia** | CRUD activos, gestión de targets, histórico de cambios |
| **Evolución** | Gráficos temporales, rendimiento, consistencia |
| **Coaching** | Recordatorios, alertas, feedback positivo |
| **Onboarding** | Configuración guiada paso a paso, preferencias |

## Web App Specific Requirements

### Project-Type Overview

Portfolio Tracker es una **Single Page Application (SPA)** diseñada como herramienta personal de tracking de inversiones. Al ser de uso individual y sin necesidades de descubrimiento público, el enfoque técnico prioriza simplicidad y experiencia de usuario sobre características enterprise.

### Technical Architecture Considerations

| Aspecto | Decisión | Justificación |
|---------|----------|---------------|
| **Arquitectura** | SPA (Single Page Application) | Dashboard interactivo, navegación fluida, un solo usuario |
| **Rendering** | Client-Side Rendering (CSR) | No hay necesidad de SSR sin SEO |
| **Real-time** | No requerido | Updates manuales semanales, un solo usuario |
| **API** | REST simple | Sin necesidad de GraphQL ni complejidad adicional |

### Browser Support

**Soporte primario:**
- Chrome Desktop (última versión estable)
- Chrome Mobile (última versión estable)

**Consideraciones:**
- No es necesario soporte para browsers legacy
- No es necesario testing cross-browser extensivo
- Foco en una experiencia óptima en Chrome

### Responsive Design

| Viewport | Prioridad | Uso Principal |
|----------|-----------|---------------|
| **Desktop** (1024px+) | Alta | Uso principal - notebook en casa, viernes |
| **Mobile** (< 768px) | Media | Consultas rápidas ocasionales |
| **Tablet** | Baja | No prioritario |

**Approach:**
- Mobile-friendly pero desktop-first
- Dashboard optimizado para pantallas grandes
- Versión mobile funcional para consultas básicas

### Performance Targets

| Métrica | Target | Notas |
|---------|--------|-------|
| **First Contentful Paint** | < 2s | Aceptable para herramienta personal |
| **Time to Interactive** | < 3s | No crítico |
| **Bundle Size** | < 500KB | Mantener razonable |

**Consideraciones:**
- Performance no es crítico dado el uso semanal
- Priorizar simplicidad de desarrollo sobre optimización extrema
- Hosting local inicialmente elimina preocupaciones de latencia

### SEO Strategy

**No aplica.** 

- Herramienta personal sin landing page pública
- Sin necesidad de indexación en buscadores
- Sin meta tags ni structured data requeridos

### Accessibility Level

**Nivel básico:**
- Contraste de colores adecuado para legibilidad
- Navegación con teclado funcional
- Labels en formularios
- No se requiere compliance WCAG formal
- No se requiere soporte de screen readers

### Implementation Stack Considerations

**Sugerencias alineadas con el proyecto:**

| Capa | Opciones Sugeridas | Notas |
|------|-------------------|-------|
| **Frontend** | React / Vue / Svelte | Cualquier framework SPA moderno |
| **Styling** | Tailwind / CSS Modules | Simplicidad sobre component libraries pesadas |
| **Charts** | Chart.js / Recharts | Para gráficos de evolución |
| **State** | Zustand / Pinia / Context | Liviano, sin necesidad de Redux |
| **Backend** | Node/Express, Python/FastAPI, Go | API REST simple |
| **Database** | PostgreSQL / SQLite | Persistencia confiable |
| **Deploy** | Docker Compose | Local inicial, migrable a VPS |

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP
> Resolver el problema core (reemplazar el spreadsheet) con features mínimas que permitan uso real desde el día 1.

**Justificación:**
- Usuario único con problema claro y definido
- No requiere validación de mercado
- Mientras antes funcione, antes reemplaza el Excel
- Iteración rápida basada en uso real

**Resource Requirements:**
- Desarrollador individual (el usuario mismo)
- Sin dependencias externas en MVP
- Timeline: semanas, no meses

### MVP Feature Set (Phase 1)

**Core User Journeys Soportados:**
- ✅ Setup Inicial (completo)
- ✅ Actualización Semanal (completo)
- ✅ Aporte Mensual (básico - sin sugerencias inteligentes)
- ⚠️ Rebalanceo (solo visualización de desviación)
- ⚠️ Cambio de Estrategia (editar targets, sin histórico de cambios)
- ⚠️ Evolución (datos guardados, sin gráficos sofisticados)

**Must-Have Capabilities:**

| Funcionalidad | Descripción |
|---------------|-------------|
| **Onboarding** | Wizard manual para agregar activos, targets, y holdings iniciales |
| **Dashboard** | Vista principal con valor total, distribución actual vs targets, alertas |
| **Gestión de Precios** | Entrada manual de precios con fecha de última actualización |
| **Transacciones** | Registro de compras/ventas con fecha, cantidad, precio |
| **Alertas Básicas** | Indicador visual cuando precios tienen >7 días de antigüedad |
| **Persistencia** | Snapshots mensuales guardados en base de datos |
| **Gestión de Portfolio** | CRUD de activos, edición de targets con validación (suma = 100%) |

### Post-MVP Features

**Phase 2: Coaching Completo**

| Funcionalidad | Descripción |
|---------------|-------------|
| **Alertas de Rebalanceo** | Notificación cuando activo se desvía >5% con opciones de acción |
| **Sugerencia de Distribución** | Al registrar aporte, sugerir distribución óptima según targets y desviaciones |
| **Recordatorio de Aporte** | Indicador de aporte mensual pendiente |
| **Gráfico de Evolución** | Visualización temporal del valor del portfolio |
| **Cálculo de Rendimiento** | Mostrar % de crecimiento por período |

**Phase 3: Polish & Extras**

| Funcionalidad | Descripción |
|---------------|-------------|
| **Gamificación** | Feedback positivo, racha de consistencia, celebraciones |
| **Histórico de Estrategia** | Registro de cambios de targets con fecha efectiva |
| **Importación CSV** | Carga masiva de transacciones desde archivo |
| **Mobile Optimizado** | UI específica para consultas rápidas en móvil |
| **Rebalanceo Pasivo** | Sistema que recuerda decisiones y ajusta sugerencias futuras |

### Risk Mitigation Strategy

**Technical Risks:**
| Riesgo | Mitigación |
|--------|------------|
| Pérdida de datos | PostgreSQL con persistencia en volumen Docker; backups manuales iniciales |
| Complejidad de cálculos | Empezar con fórmulas simples, iterar según necesidad |
| Over-engineering | Mantener scope mínimo, resistir tentación de features |

**Market Risks:**
- No aplica - herramienta personal sin necesidad de validación de mercado

**Resource Risks:**
| Riesgo | Mitigación |
|--------|------------|
| Tiempo limitado | MVP ultra-lean; cada feature debe justificar su existencia |
| Abandono del proyecto | Entregar valor usable rápido para generar motivación |
| Scope creep | Phases claras; no avanzar a Phase 2 hasta usar Phase 1 |

## Functional Requirements

### Portfolio Configuration

- FR1: Usuario puede agregar un nuevo activo al portfolio especificando ticker, nombre y categoría
- FR2: Usuario puede editar los datos de un activo existente
- FR3: Usuario puede eliminar un activo del portfolio
- FR4: Usuario puede asignar un porcentaje objetivo (target) a cada activo
- FR5: Sistema valida que los targets sumen exactamente 100%
- FR6: Usuario puede ver la lista completa de activos con sus targets actuales

### Holdings Management

- FR7: Usuario puede registrar la cantidad actual que posee de cada activo
- FR8: Usuario puede actualizar el precio actual de cada activo
- FR9: Sistema registra la fecha de última actualización de precio por activo
- FR10: Usuario puede ver el valor actual de cada posición (cantidad × precio)
- FR11: Sistema calcula y muestra el valor total del portfolio

### Transaction Recording

- FR12: Usuario puede registrar una transacción de compra con fecha, activo, cantidad, precio y comisión
- FR13: Usuario puede registrar una transacción de venta con fecha, activo, cantidad, precio y comisión
- FR14: Usuario puede ver el historial de transacciones registradas incluyendo comisiones
- FR15: Sistema actualiza automáticamente las cantidades de holdings al registrar transacciones
- FR33: Sistema calcula el costo total de cada transacción incluyendo comisiones

### Dashboard & Visualization

- FR16: Usuario puede ver el estado actual del portfolio en una vista principal (dashboard)
- FR17: Sistema muestra la distribución actual del portfolio por activo (% real)
- FR18: Sistema muestra la comparación entre distribución actual y targets
- FR19: Sistema muestra la desviación de cada activo respecto a su target
- FR20: Sistema indica visualmente la antigüedad de los precios cargados

### Alerts & Coaching

- FR21: Sistema muestra alerta cuando los precios tienen más de 7 días de antigüedad
- FR22: Sistema muestra alerta cuando un activo se desvía más del umbral configurado (default 5%)
- FR23: Usuario puede ver qué activos requieren atención (desviados o desactualizados)

### Historical Data

- FR24: Sistema guarda snapshots del estado del portfolio periódicamente
- FR25: Usuario puede ver la evolución del valor total del portfolio en el tiempo
- FR26: Sistema preserva el histórico cuando se modifican activos o targets

### Onboarding

- FR27: Sistema guía al usuario nuevo en la configuración inicial del portfolio
- FR28: Usuario puede completar el setup inicial ingresando activos, targets y holdings
- FR29: Usuario puede configurar preferencias (umbral de rebalanceo, días para alerta de precios)

### Settings & Preferences

- FR30: Usuario puede modificar el umbral de desviación para alertas de rebalanceo
- FR31: Usuario puede modificar el número de días para alerta de precios desactualizados
- FR32: Usuario puede ver y modificar la configuración general de la aplicación

## Non-Functional Requirements

### Data Integrity & Reliability

- NFR1: Los datos del portfolio deben persistir entre sesiones sin pérdida
- NFR2: Las transacciones registradas no pueden perderse una vez guardadas
- NFR3: El histórico de snapshots debe mantenerse íntegro a lo largo del tiempo
- NFR4: En caso de error durante una operación, el sistema debe mantener un estado consistente (no datos corruptos)

### Performance

- NFR5: El dashboard debe cargar en menos de 3 segundos en condiciones normales
- NFR6: Las operaciones de guardado (transacciones, precios) deben completarse en menos de 2 segundos
- NFR7: Los cálculos de distribución y desviación deben actualizarse inmediatamente al cambiar datos

### Security

- NFR8: La base de datos debe estar protegida contra acceso no autorizado (credenciales no expuestas)
- NFR9: La aplicación no debe exponer datos sensibles en logs o errores visibles
- NFR10: El acceso a la aplicación debe estar restringido (no expuesta públicamente sin protección)

### Maintainability

- NFR11: El código debe seguir convenciones estándar del stack elegido para facilitar mantenimiento
- NFR12: La estructura del proyecto debe permitir agregar nuevas funcionalidades sin refactorizar todo
- NFR13: Los datos deben poder exportarse en un formato estándar (JSON/CSV) como backup manual

