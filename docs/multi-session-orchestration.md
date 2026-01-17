# Sistema de Orquestación Multi-Sesión BMAD

Guía completa para coordinar múltiples sesiones de Claude Code trabajando en paralelo sobre el mismo proyecto usando git worktrees y un tablero de orquestación compartido.

---

## Tabla de Contenidos

1. [Resumen](#resumen)
2. [Arquitectura](#arquitectura)
3. [Setup Inicial](#setup-inicial)
4. [Uso Diario](#uso-diario)
5. [Comandos de Orquestación](#comandos-de-orquestación)
6. [Agregar Nuevos Roles](#agregar-nuevos-roles)
7. [Troubleshooting](#troubleshooting)

---

## Resumen

Este sistema permite ejecutar múltiples sesiones de Claude Code simultáneamente, cada una con un rol específico (SM, Dev, Review, TEA, etc.), evitando conflictos de git y coordinando el trabajo a través de un tablero compartido.

### Problema que Resuelve

- Conflictos de git cuando múltiples sesiones modifican código
- Pérdida de código por operaciones concurrentes
- Falta de coordinación entre tareas paralelas

### Solución

- **Git Worktrees**: Cada sesión trabaja en un directorio físico separado con su propio branch
- **Tablero de Orquestación**: Archivo YAML compartido que coordina qué sesión trabaja en qué story
- **Templates CLAUDE.md**: Instrucciones específicas para cada rol

---

## Arquitectura

### Estructura de Directorios

```
~/projects/
├── portfolio/                          # Repo principal
│   ├── _bmad-output/
│   │   └── orchestration/
│   │       └── sprint-board.yaml       # Tablero compartido (gitignored)
│   ├── templates/
│   │   └── worktree-claude-md/
│   │       ├── sm.claude.md            # Template Scrum Master
│   │       ├── dev.claude.md           # Template Developer
│   │       └── review.claude.md        # Template Reviewer
│   └── scripts/
│       └── setup-worktrees.sh          # Script de setup
│
└── portfolio-worktrees/                # Worktrees (fuera del repo)
    ├── wt-sm/                          # Scrum Master
    ├── wt-dev-1/                       # Developer 1
    ├── wt-dev-2/                       # Developer 2
    └── wt-review/                      # Code Reviewer
```

### Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│              sprint-board.yaml (Tablero Compartido)             │
│                    _bmad-output/orchestration/                  │
└─────────────────────────────────────────────────────────────────┘
         ▲                    ▲                    ▲
         │ lee/escribe        │ lee/escribe        │ lee/escribe
         │                    │                    │
    ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
    │   SM    │          │  Dev-1  │          │ Review  │
    │ worktree│          │ worktree│          │ worktree│
    └────┬────┘          └────┬────┘          └────┬────┘
         │                    │                    │
         │ push               │ push               │ lee
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Git Repository                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Setup Inicial

### Requisitos Previos

- BMAD instalado en el proyecto
- `sprint-status.yaml` generado (ejecutar `/sprint-planning` si no existe)

### Paso 1: Ejecutar Script de Setup

```bash
cd ~/projects/portfolio
./scripts/setup-worktrees.sh 2    # 2 = número de worktrees dev
```

Esto crea:
- `wt-sm` - Scrum Master
- `wt-dev-1` - Developer 1
- `wt-dev-2` - Developer 2
- `wt-review` - Code Reviewer

### Paso 2: Inicializar Tablero de Orquestación

```bash
cd ~/projects/portfolio
claude
> /bmad:bmm:workflows:orchestrate init
```

Esto lee `sprint-status.yaml` y crea el tablero en `_bmad-output/orchestration/sprint-board.yaml`.

### Paso 3: Verificar .gitignore

Asegurarse de que `.gitignore` incluya:
```
_bmad-output/orchestration/
```

---

## Uso Diario

### Iniciar Sesiones

Abrir terminales separadas para cada rol:

**Terminal 1 - Scrum Master:**
```bash
cd ~/projects/portfolio-worktrees/wt-sm
claude
```

**Terminal 2 - Developer 1:**
```bash
cd ~/projects/portfolio-worktrees/wt-dev-1
claude
```

**Terminal 3 - Developer 2:**
```bash
cd ~/projects/portfolio-worktrees/wt-dev-2
claude
```

**Terminal 4 - Reviewer:**
```bash
cd ~/projects/portfolio-worktrees/wt-review
claude
```

### Flujo de Trabajo por Rol

#### Scrum Master (SM)

```
> /bmad:bmm:workflows:orchestrate status          # Ver estado
> /bmad:bmm:workflows:orchestrate take <story>    # Reservar story
> /bmad:bmm:workflows:create-story                # Crear story
> /bmad:bmm:workflows:orchestrate complete <story> # Liberar
```

#### Developer

```
> /bmad:bmm:workflows:orchestrate status          # Ver disponibles
> /bmad:bmm:workflows:orchestrate take <story>    # Reservar story
> /bmad:bmm:workflows:dev-story                   # Implementar
> git add . && git commit -m "feat: ..."
> git push origin worktree/wt-dev-1
> /bmad:bmm:workflows:orchestrate complete <story> # Liberar
```

#### Code Reviewer

```
> /bmad:bmm:workflows:orchestrate status          # Ver estado
> git fetch origin
> git checkout feature/<branch-a-revisar>
> /bmad:bmm:workflows:code-review                 # Ejecutar review
```

### Sincronizar Tablero con Nuevas Stories

Cuando el SM crea nuevas stories:

```
> /bmad:bmm:workflows:orchestrate sync
```

Esto agrega las nuevas stories al tablero preservando asignaciones existentes.

### Merge de Cambios (Manual)

Los merges siempre los hace el humano:

```bash
cd ~/projects/portfolio
git checkout main
git pull origin main
git merge --no-ff worktree/wt-dev-1 -m "Merge story-101"
git push origin main
```

---

## Comandos de Orquestación

| Comando | Descripción |
|---------|-------------|
| `init` | Inicializar tablero desde sprint-status.yaml |
| `sync` | Sincronizar tablero (agregar nuevas stories, preservar asignaciones) |
| `status` | Ver estado actual y asignaciones |
| `take <story>` | Reservar story para trabajar |
| `complete <story>` | Marcar completada y liberar |
| `release <story>` | Liberar sin completar (con razón) |

### Ejemplos

```bash
# Ver estado del tablero
> /bmad:bmm:workflows:orchestrate status

# Tomar una story específica
> /bmad:bmm:workflows:orchestrate take 10-3-contribution-integration

# Completar la story actual
> /bmad:bmm:workflows:orchestrate complete 10-3-contribution-integration

# Liberar sin completar (bloqueada, etc.)
> /bmad:bmm:workflows:orchestrate release 10-3-contribution-integration
```

---

## Agregar Nuevos Roles

### Paso 1: Crear Template CLAUDE.md

Crear archivo `templates/worktree-claude-md/<rol>.claude.md`:

```markdown
# Worktree: <Nombre del Rol> Session

## Rol
Esta sesion esta configurada como **<Nombre del Rol>** para el proyecto.

## Tablero de Orquestacion
Ubicacion: `_bmad-output/orchestration/sprint-board.yaml`

### Comandos Obligatorios
| Cuando | Comando |
|--------|---------|
| Al iniciar | `/bmad:bmm:workflows:orchestrate status` |
| Antes de trabajar | `/bmad:bmm:workflows:orchestrate take <story>` |
| Al terminar | `/bmad:bmm:workflows:orchestrate complete <story>` |

## Flujo de Trabajo
1. Verificar tablero con `/orchestrate status`
2. Tomar story con `/orchestrate take`
3. Ejecutar workflow específico del rol
4. Completar con `/orchestrate complete`

## Workflows Disponibles
- Listar workflows relevantes para el rol
```

### Paso 2: Crear Worktree

**Opción A - Manual:**

```bash
cd ~/projects/portfolio

# Crear branch y worktree
git worktree add ../portfolio-worktrees/wt-<rol> -b worktree/wt-<rol>

# Combinar CLAUDE.md base con template del rol
cat CLAUDE.md > ../portfolio-worktrees/wt-<rol>/CLAUDE.md
echo -e "\n---\n" >> ../portfolio-worktrees/wt-<rol>/CLAUDE.md
cat templates/worktree-claude-md/<rol>.claude.md >> ../portfolio-worktrees/wt-<rol>/CLAUDE.md

# Crear symlink al tablero de orquestación
mkdir -p ../portfolio-worktrees/wt-<rol>/_bmad-output
ln -sf $(pwd)/_bmad-output/orchestration ../portfolio-worktrees/wt-<rol>/_bmad-output/orchestration
```

**Opción B - Modificar script:**

Editar `scripts/setup-worktrees.sh` y agregar antes del resumen final:

```bash
# Crear worktree para nuevo rol
create_worktree "wt-<rol>" "<rol>"
```

### Ejemplo: Agregar TEA (Test Engineering Agent)

1. Crear `templates/worktree-claude-md/tea.claude.md`:

```markdown
# Worktree: Test Engineering Session

## Rol
Esta sesion esta configurada como **Test Engineering Agent** (TEA).

## Tablero de Orquestacion
Ubicacion: `_bmad-output/orchestration/sprint-board.yaml`

### Comandos Obligatorios
| Cuando | Comando |
|--------|---------|
| Al iniciar | `/bmad:bmm:workflows:orchestrate status` |
| Antes de testing | `/bmad:bmm:workflows:orchestrate take <story>` |
| Al terminar | `/bmad:bmm:workflows:orchestrate complete <story>` |

## Flujo de Trabajo TEA
1. `/orchestrate take` - Reservar story para testing
2. `/bmad:bmm:workflows:testarch-automate` - Generar tests
3. `/bmad:bmm:workflows:testarch-trace` - Matriz de trazabilidad
4. `/orchestrate complete` - Liberar story

## Workflows Disponibles
- `/bmad:bmm:workflows:testarch-framework` - Setup framework de tests
- `/bmad:bmm:workflows:testarch-automate` - Automatizar tests
- `/bmad:bmm:workflows:testarch-atdd` - Acceptance tests
- `/bmad:bmm:workflows:testarch-trace` - Trazabilidad
- `/bmad:bmm:agents:tea` - Agente TEA completo
```

2. Crear worktree:

```bash
cd ~/projects/portfolio
git worktree add ../portfolio-worktrees/wt-tea -b worktree/wt-tea

cat CLAUDE.md > ../portfolio-worktrees/wt-tea/CLAUDE.md
echo -e "\n---\n" >> ../portfolio-worktrees/wt-tea/CLAUDE.md
cat templates/worktree-claude-md/tea.claude.md >> ../portfolio-worktrees/wt-tea/CLAUDE.md

mkdir -p ../portfolio-worktrees/wt-tea/_bmad-output
ln -sf $(pwd)/_bmad-output/orchestration ../portfolio-worktrees/wt-tea/_bmad-output/orchestration
```

---

## Troubleshooting

### "Unknown skill: orchestrate"

**Causa:** Claude Code no detectó el nuevo comando.

**Solución:** Reiniciar la sesión de Claude Code:
```bash
exit
claude
```

### "Story ya está asignada"

**Causa:** Otra sesión tiene la story reservada.

**Solución:**
1. Ver quién la tiene: `/orchestrate status`
2. Coordinar con esa sesión o esperar
3. Si la sesión está abandonada: `/orchestrate release <story>`

### Conflictos de Git en Merge

**Causa:** Dos worktrees modificaron los mismos archivos.

**Solución:**
1. Resolver conflictos manualmente en el repo principal
2. Comunicar a las sesiones que hagan `git fetch && git rebase`

### Tablero Desincronizado

**Causa:** Se crearon nuevas stories pero no se actualizó el tablero.

**Solución:**
```
> /bmad:bmm:workflows:orchestrate sync
```

### Worktree Corrupto

**Causa:** Operación de git interrumpida.

**Solución:**
```bash
# Listar worktrees
git worktree list

# Eliminar worktree problemático
git worktree remove ../portfolio-worktrees/wt-<nombre> --force

# Recrear
git worktree add ../portfolio-worktrees/wt-<nombre> -b worktree/wt-<nombre>
```

### Limpiar Todos los Worktrees

Para empezar de cero:

```bash
cd ~/projects/portfolio

# Listar y eliminar worktrees
git worktree list
git worktree remove ../portfolio-worktrees/wt-sm
git worktree remove ../portfolio-worktrees/wt-dev-1
git worktree remove ../portfolio-worktrees/wt-dev-2
git worktree remove ../portfolio-worktrees/wt-review

# Eliminar branches huérfanos
git branch -D worktree/wt-sm worktree/wt-dev-1 worktree/wt-dev-2 worktree/wt-review

# Limpiar referencias
git worktree prune

# Recrear desde cero
./scripts/setup-worktrees.sh 2
```

---

## Referencias

- [Git Worktrees Documentation](https://git-scm.com/docs/git-worktree)
- Workflow orchestrate: `_bmad/bmm/workflows/4-implementation/orchestrate/`
- Templates: `templates/worktree-claude-md/`
- Script de setup: `scripts/setup-worktrees.sh`

---

*Documento generado para el proyecto Portfolio - Sistema BMAD v6.0.0*
