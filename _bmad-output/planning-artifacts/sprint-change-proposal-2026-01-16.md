# Sprint Change Proposal

**Fecha:** 2026-01-16
**Autor:** BMad Correct-Course Workflow
**Usuario:** Fede
**Status:** Pending Approval

---

## 1. Issue Summary

### Título
Funcionalidad de Sugerencias de Distribución de Aportes no implementada

### Descripción del Problema
La funcionalidad de "sugerencias inteligentes de distribución de aportes mensuales" está descrita en el PRD (Journey 2, líneas 214-232) como parte central del valor diferenciador del producto ("El Coach, no solo el Dashboard"), pero nunca fue desglosada en Epics ni Stories durante la planificación. Como resultado, la funcionalidad no existe en la aplicación actual.

### Contexto de Descubrimiento
- **Descubierto por:** Usuario principal (Fede)
- **Momento:** Durante uso normal de la aplicación
- **Trigger:** Búsqueda de funcionalidad esperada que no se encontró

### Evidencia

| Aspecto | Estado |
|---------|--------|
| En PRD (Journey 2) | ✅ Claramente especificado |
| En Functional Requirements | ❌ No formalizado como FR |
| En Epics/Stories | ❌ No desglosado |
| Backend API | ❌ No existe |
| Frontend Feature | ❌ No existe |
| Funcionalidad relacionada | ⚠️ Alertas de rebalanceo existen (solo notificación) |

### Clasificación del Issue
**Tipo:** Gap entre visión (PRD) y especificación (Epics/Stories)
**Severidad:** Media - Funcionalidad esperada faltante, no bug
**Impacto en usuario:** Alto - Feature core del diferenciador del producto

---

## 2. Impact Analysis

### Epic Impact

| Épica | Estado | Impacto |
|-------|--------|---------|
| Epic 1-8 | Completadas | Sin cambios requeridos |
| Epic 9 | In-Progress | Sin cambios - completar primero |
| **Epic 10** | **NUEVA** | Crear para implementar funcionalidad |

### Artifact Conflicts

| Artefacto | Conflicto | Acción Requerida |
|-----------|-----------|------------------|
| PRD | Gap: Journey describe funcionalidad no formalizada | Agregar FR34, FR35, FR36 |
| Epics | Faltante: No existe épica para esta funcionalidad | Crear Epic 10 con 3 stories |
| Architecture | Faltante: No documenta ruta/servicio | Agregar contributions API y service |
| UI/UX | N/A | No existe documento formal |

### Technical Impact

| Área | Impacto |
|------|---------|
| Backend Code | Nuevo servicio y ruta (no modifica existente) |
| Frontend Code | Nueva feature (no modifica existente) |
| Database | Sin cambios de schema requeridos |
| Infrastructure | Sin cambios |
| Existing Tests | Sin impacto |

---

## 3. Recommended Approach

### Decisión: Ajuste Directo (Opción 1)

**Crear nueva Epic 10** para implementar la funcionalidad de sugerencias de distribución de aportes.

### Rationale

| Factor | Evaluación |
|--------|------------|
| Esfuerzo | Medium (4-6 días estimados) |
| Riesgo técnico | Low - Usa patrones existentes |
| Impacto en código existente | Ninguno - Solo adiciones |
| Valor para el usuario | Alto - Feature core esperada |
| Alineación con visión | Alta - Descrita en PRD como diferenciador |

### Alternativas Consideradas

| Opción | Evaluación | Decisión |
|--------|------------|----------|
| **Ajuste Directo** | Crear nueva épica | ✅ SELECCIONADA |
| Rollback | Revertir código | ❌ No aplica - no hay código malo |
| MVP Review | Reducir scope | ❌ No necesario - MVP está completo |

---

## 4. Detailed Change Proposals

### 4.1 PRD Updates

**Archivo:** `_bmad-output/planning-artifacts/prd.md`

**Cambio:** Agregar nuevos Functional Requirements después de FR33

```markdown
### Contribution Allocation

- FR34: Sistema calcula y sugiere distribución de aporte mensual según porcentajes target de cada activo
- FR35: Sistema ajusta sugerencia de distribución para priorizar activos con desviación negativa (underweight) y reducir asignación a activos con desviación positiva (overweight)
- FR36: Usuario puede ver, aceptar, modificar o ignorar la sugerencia de distribución antes de registrar transacciones
```

---

### 4.2 Epics Updates

**Archivo:** `_bmad-output/planning-artifacts/epics.md`

**Cambio:** Agregar Epic 10 al final del documento

#### Epic 10: Contribution Allocation Suggestions

Usuario puede registrar aportes mensuales y recibir sugerencias inteligentes de distribución que consideran los targets definidos y las desviaciones actuales para optimizar el rebalanceo pasivo.

**FRs cubiertos:** FR34, FR35, FR36

**Stories:**

| Story | Título | Descripción |
|-------|--------|-------------|
| 10.1 | Contribution Suggestion API | Backend endpoint para calcular distribución sugerida |
| 10.2 | Contribution Suggestion UI | Frontend para ingresar monto y ver sugerencias |
| 10.3 | Contribution to Transaction Integration | Flujo para convertir sugerencias en transacciones |

---

### 4.3 Architecture Updates

**Archivo:** `_bmad-output/planning-artifacts/architecture.md`

**Cambios:**

1. **API Structure:** Agregar `/api/contributions/*`
2. **Backend Services:** Agregar `contributionService.ts`
3. **Frontend Features:** Agregar `features/contributions/`
4. **Requirements Mapping:** Agregar fila para FR34-36

---

## 5. Implementation Handoff

### Scope Classification
**Moderate** - Requiere cambios en documentación y nueva implementación

### Implementation Sequence

```
FASE 1: Documentación (Pre-implementación)
├── 1.1 Aplicar cambios a PRD (FR34-36)
├── 1.2 Aplicar cambios a Epics (Epic 10)
└── 1.3 Aplicar cambios a Architecture

FASE 2: Implementación (Después de Epic 9)
├── 2.1 Story 10.1: Backend API
│   ├── Crear contributionService.ts
│   ├── Crear routes/contributions.ts
│   └── Tests unitarios
├── 2.2 Story 10.2: Frontend UI
│   ├── Crear features/contributions/
│   ├── Componentes: Form, Suggestions
│   └── Integración con navegación
└── 2.3 Story 10.3: Integration
    ├── Conectar con transactionService
    └── Tests e2e
```

### Handoff Responsibilities

| Rol | Responsabilidad |
|-----|-----------------|
| Product Owner (Fede) | Aprobar este proposal, priorizar Epic 10 |
| Development Team | Implementar Epic 10 post-Epic 9 |
| QA | Validar acceptance criteria de cada story |

### Success Criteria

1. ✅ Usuario puede ingresar monto de aporte y ver sugerencia de distribución
2. ✅ Sugerencia considera targets y ajusta por desviaciones actuales
3. ✅ Usuario puede convertir sugerencia en transacciones registradas
4. ✅ Funcionalidad accesible desde navegación principal

### Estimated Effort

| Story | Estimación |
|-------|------------|
| 10.1 Backend API | 1-2 días |
| 10.2 Frontend UI | 2-3 días |
| 10.3 Integration | 1 día |
| **Total** | **4-6 días** |

---

## 6. Approval

### Propuestas de Edición Aprobadas

- [x] PRD: Agregar FR34, FR35, FR36
- [x] Epics: Crear Epic 10 con Stories 10.1, 10.2, 10.3
- [x] Architecture: Documentar nueva API y estructura

### Cambios Aplicados ✅

- [x] PRD actualizado con FR34, FR35, FR36
- [x] Epics actualizado con Epic 10 y Stories 10.1, 10.2, 10.3
- [x] Architecture actualizado con nueva API y estructura

### Next Steps

- [ ] Actualizar sprint-status.yaml con Epic 10 cuando se comience
- [ ] Comenzar implementación después de completar Epic 9

---

**Status:** ✅ APPROVED AND APPLIED
**Aprobado por:** Fede
**Fecha de aprobación:** 2026-01-16

**Generado por:** BMad Correct-Course Workflow
**Fecha:** 2026-01-16
