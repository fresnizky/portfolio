# Orchestrate - Coordinacion Multi-Sesion

<critical>El workflow execution engine esta gobernado por: {project-root}/_bmad/core/tasks/workflow.xml</critical>
<critical>DEBES haber cargado y procesado: {installed_path}/workflow.yaml</critical>
<critical>Comunicar en {communication_language}</critical>

## Objetivo

Coordinar multiples sesiones de Claude Code trabajando en paralelo sobre el mismo proyecto,
usando un tablero compartido para evitar conflictos y maximizar la productividad.

---

## Paso 0: Parsear Comando

<action>Parsea el comando del usuario para identificar el subcomando</action>

Subcomandos disponibles:
- `init` - Inicializar tablero desde sprint-status.yaml
- `sync` - Sincronizar tablero con sprint-status.yaml
- `status` - Ver estado actual del tablero
- `take <story-key>` - Reservar una story para trabajar
- `complete <story-key>` - Marcar story como completada
- `release <story-key>` - Liberar story sin completar

<check if="subcomando es 'init'">Ir a Paso 1</check>
<check if="subcomando es 'sync'">Ir a Paso 2</check>
<check if="subcomando es 'status'">Ir a Paso 3</check>
<check if="subcomando es 'take'">Ir a Paso 4</check>
<check if="subcomando es 'complete'">Ir a Paso 5</check>
<check if="subcomando es 'release'">Ir a Paso 6</check>

<check if="no hay subcomando o es desconocido">
Mostrar menu de ayuda:

```
## /orchestrate - Comandos Disponibles

| Comando | Descripcion |
|---------|-------------|
| `init` | Inicializar tablero desde sprint-status.yaml |
| `sync` | Sincronizar tablero (agregar nuevas stories) |
| `status` | Ver estado actual y asignaciones |
| `take <story>` | Reservar story para trabajar |
| `complete <story>` | Marcar completada y liberar |
| `release <story>` | Liberar sin completar |

**Uso:** `/orchestrate <comando> [argumentos]`

**Ejemplo:**
- `/orchestrate init`
- `/orchestrate take 10-3-contribution-integration`
```

FIN del workflow.
</check>

---

## Paso 1: INIT - Inicializar Tablero

<action>Verificar si existe el directorio {orchestration_dir}</action>
<action>Si no existe, crearlo</action>

<action>Verificar si existe {sprint_board_file}</action>

<check if="el tablero ya existe">
Preguntar al usuario:

```
El tablero ya existe. Deseas:
1. Regenerarlo desde sprint-status.yaml (PERDERA asignaciones actuales)
2. Cancelar y mantener el existente

Elige [1] o [2]:
```

<check if="usuario elige 2">
Mostrar: "Operacion cancelada. Tablero existente mantenido."
FIN del workflow.
</check>
</check>

<action>Cargar {sprint_status_file} COMPLETO</action>

<check if="archivo no existe">
Mostrar error:
```
ERROR: No se encontro sprint-status.yaml en:
{sprint_status_file}

Ejecuta primero /sprint-planning para generar el archivo de estado.
```
FIN del workflow.
</check>

<action>Parsear la seccion development_status del archivo</action>
<action>Filtrar SOLO las story keys (patron: X-X-nombre, NO epic-X ni retrospective)</action>
<action>Filtrar stories que NO esten en estado 'done'</action>

<action>Generar sprint-board.yaml con la siguiente estructura:</action>

```yaml
metadata:
  generated: "{timestamp_actual}"
  project: "{project_name}"
  source: "{sprint_status_file}"
  version: "1.0.0"

stories:
  # Para cada story encontrada:
  {story-key}:
    original_status: {status_en_sprint_status}
    status: available
    assigned_to: null
    worktree: null
    assigned_at: null
    completed_at: null

history:
  - timestamp: "{timestamp_actual}"
    action: "init"
    details: "Tablero inicializado con {N} stories"
```

<action>Guardar archivo en {sprint_board_file}</action>

<output>
## Tablero Inicializado

**Proyecto:** {project_name}
**Stories cargadas:** {cantidad}
**Ubicacion:** {sprint_board_file}

| Story Key | Estado Original | Estado Tablero |
|-----------|-----------------|----------------|
{tabla_de_stories}

Recuerda agregar `_bmad-output/orchestration/` a `.gitignore` si aun no lo has hecho.
</output>

FIN del workflow.

---

## Paso 2: SYNC - Sincronizar Tablero

<action>Cargar {sprint_board_file}</action>

<check if="tablero no existe">
Mostrar: "No existe tablero. Ejecuta `/orchestrate init` primero."
FIN del workflow.
</check>

<action>Cargar {sprint_status_file}</action>
<action>Parsear stories del sprint-status (patron X-X-nombre, NO done)</action>
<action>Comparar con stories existentes en el tablero</action>

Para cada story en sprint-status que NO este en el tablero:
<action>Agregar como nueva story con status: available</action>

Para cada story en el tablero que NO este en sprint-status:
<action>Marcar como status: archived (preservar datos)</action>

Para cada story existente en ambos:
<action>Actualizar original_status si cambio en sprint-status</action>
<action>PRESERVAR: status, assigned_to, worktree, timestamps</action>

<action>Agregar entrada al history:</action>
```yaml
- timestamp: "{timestamp}"
  action: "sync"
  details: "Agregadas: {N}, Archivadas: {M}, Actualizadas: {K}"
```

<action>Guardar tablero actualizado</action>

<output>
## Tablero Sincronizado

**Nuevas stories agregadas:** {N}
**Stories archivadas:** {M}
**Stories actualizadas:** {K}

### Cambios Detectados:
{lista_de_cambios}

El tablero esta sincronizado con sprint-status.yaml
</output>

FIN del workflow.

---

## Paso 3: STATUS - Ver Estado del Tablero

<action>Cargar {sprint_board_file}</action>

<check if="tablero no existe">
Mostrar: "No existe tablero. Ejecuta `/orchestrate init` primero."
FIN del workflow.
</check>

<action>Parsear y agrupar stories por status</action>
<action>Calcular estadisticas</action>

<output>
## Estado del Tablero de Orquestacion

**Proyecto:** {project}
**Ultima actualizacion:** {metadata.generated}

### Asignaciones Activas

<check if="hay stories in-progress">
| Story | Asignado a | Worktree | Desde |
|-------|------------|----------|-------|
{tabla_asignaciones}
</check>

<check if="no hay asignaciones">
_No hay stories asignadas actualmente_
</check>

### Disponibles ({count})

{lista_stories_available}

### Completadas ({count})

{lista_stories_completed}

### Resumen

- Disponibles: {available_count}
- En progreso: {in_progress_count}
- Completadas: {completed_count}
- Archivadas: {archived_count}
</output>

FIN del workflow.

---

## Paso 4: TAKE - Reservar Story

<action>Parsear story_key de los argumentos del comando</action>

<check if="no se proporciono story_key">
Preguntar: "Cual story deseas tomar? Proporciona el story key (ej: 10-3-contribution-integration):"
</check>

<action>Cargar {sprint_board_file}</action>

<check if="tablero no existe">
Mostrar: "No existe tablero. Ejecuta `/orchestrate init` primero."
FIN del workflow.
</check>

<action>Buscar story por key</action>

<check if="story no encontrada">
Mostrar: "Story '{story_key}' no encontrada en el tablero."
Mostrar lista de stories disponibles.
FIN del workflow.
</check>

<check if="story ya esta asignada">
Mostrar:
```
Story '{story_key}' ya esta asignada.

- Asignado a: {assigned_to}
- Worktree: {worktree}
- Desde: {assigned_at}

Si necesitas liberarla, contacta a quien la tiene asignada
o usa `/orchestrate release {story_key}` con justificacion.
```
FIN del workflow.
</check>

<check if="story no esta available">
Mostrar: "Story '{story_key}' tiene estado '{status}', no puede tomarse."
FIN del workflow.
</check>

<action>Detectar nombre del worktree actual desde git</action>

```bash
# Detectar worktree
basename $(git rev-parse --show-toplevel) 2>/dev/null || echo "main"
```

<action>Si no se puede detectar, preguntar identificador de sesion</action>

<action>Actualizar story en el tablero:</action>
```yaml
{story_key}:
  status: in-progress
  assigned_to: {session_id}
  worktree: {worktree_name}
  assigned_at: {timestamp}
```

<action>Agregar al history:</action>
```yaml
- timestamp: "{timestamp}"
  action: "take"
  story: "{story_key}"
  session: "{session_id}"
  worktree: "{worktree_name}"
```

<action>Guardar tablero</action>

<output>
## Story Reservada

**Story:** {story_key}
**Asignado a:** {session_id}
**Worktree:** {worktree_name}
**Timestamp:** {timestamp}

Ahora puedes ejecutar `/dev-story` para implementar esta story.

Cuando termines, ejecuta `/orchestrate complete {story_key}`
</output>

FIN del workflow.

---

## Paso 5: COMPLETE - Marcar Completada

<action>Parsear story_key de los argumentos</action>

<check if="no se proporciono story_key">
<action>Buscar story asignada a la sesion actual</action>
<check if="hay exactamente una">Usar esa story</check>
<check if="hay mas de una">Pedir al usuario que especifique</check>
<check if="no hay ninguna">Mostrar error y terminar</check>
</check>

<action>Cargar {sprint_board_file}</action>
<action>Buscar story por key</action>

<check if="story no esta asignada a esta sesion">
Mostrar:
```
No puedes completar '{story_key}'.

<check if="story asignada a otro">
Esta asignada a: {assigned_to}
</check>

<check if="story no asignada">
La story no esta asignada a ninguna sesion.
</check>
```
FIN del workflow.
</check>

<action>Actualizar story:</action>
```yaml
{story_key}:
  status: completed
  completed_at: {timestamp}
  assigned_to: null
  worktree: null
```

<action>Agregar al history:</action>
```yaml
- timestamp: "{timestamp}"
  action: "complete"
  story: "{story_key}"
  session: "{session_id}"
```

<action>Guardar tablero</action>

<output>
## Story Completada

**Story:** {story_key}
**Completada:** {timestamp}

La story ha sido liberada del tablero.

**Proximos pasos:**
1. Asegurate de haber hecho commit y push de tus cambios
2. Actualiza sprint-status.yaml si es necesario (status -> review/done)
3. Puedes tomar otra story con `/orchestrate take`
</output>

FIN del workflow.

---

## Paso 6: RELEASE - Liberar Sin Completar

<action>Parsear story_key de los argumentos</action>

<check if="no se proporciono story_key">
Preguntar: "Cual story deseas liberar?"
</check>

<action>Cargar {sprint_board_file}</action>
<action>Buscar story por key</action>

<check if="story no esta asignada">
Mostrar: "Story '{story_key}' no esta asignada a ninguna sesion."
FIN del workflow.
</check>

<action>Preguntar razon de liberacion:</action>
```
Por que liberas esta story sin completarla?
1. Bloqueada por dependencia
2. Necesita mas contexto/clarificacion
3. Reasignando a otra sesion
4. Otro (especificar)
```

<action>Actualizar story:</action>
```yaml
{story_key}:
  status: available
  assigned_to: null
  worktree: null
  released_at: {timestamp}
  release_reason: {razon}
```

<action>Agregar al history:</action>
```yaml
- timestamp: "{timestamp}"
  action: "release"
  story: "{story_key}"
  session: "{session_id}"
  reason: "{razon}"
```

<action>Guardar tablero</action>

<output>
## Story Liberada

**Story:** {story_key}
**Razon:** {razon}
**Timestamp:** {timestamp}

La story esta disponible para que otra sesion la tome.

<check if="razon es bloqueada">
Considera documentar el bloqueo en la story o crear un issue.
</check>
</output>

FIN del workflow.

---

## Notas de Implementacion

### Deteccion de Worktree

Para detectar automaticamente el worktree actual:

```bash
# Obtener nombre del directorio del worktree
git rev-parse --show-toplevel | xargs basename

# O verificar si es un worktree
git rev-parse --git-common-dir
```

### Manejo de Conflictos

Si dos sesiones intentan modificar el tablero simultaneamente:
1. Usar el timestamp de `metadata.generated` como version
2. Antes de guardar, verificar que no cambio desde la lectura
3. Si cambio, recargar y reintentar la operacion

### Story Keys

Los story keys siguen el patron: `{epic}-{story}-{slug}`
Ejemplo: `10-3-contribution-integration`

Para filtrar del sprint-status.yaml:
- INCLUIR: keys que matchean `/^\d+-\d+-/`
- EXCLUIR: keys que empiezan con `epic-` o terminan con `-retrospective`
