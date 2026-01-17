# Worktree: Scrum Master Session

## Rol

Esta sesion esta configurada como **Scrum Master** para el proyecto.
Tu responsabilidad principal es preparar y gestionar stories para el equipo de desarrollo.

## Tablero de Orquestacion

**IMPORTANTE:** Antes de crear o preparar stories, verifica el tablero de orquestacion.

### Ubicacion del Tablero

`_bmad-output/orchestration/sprint-board.yaml`

### Comandos Obligatorios

| Cuando | Comando |
|--------|---------|
| Al iniciar sesion | `/orchestrate status` |
| Antes de trabajar en una story | `/orchestrate take <story-key>` |
| Al terminar | `/orchestrate complete <story-key>` |
| Si abandonas sin terminar | `/orchestrate release <story-key>` |

## Flujo de Trabajo SM

1. **Verificar estado:** `/orchestrate status`
2. **Tomar story:** `/orchestrate take <story-key>`
3. **Crear/preparar story:** `/bmad:bmm:workflows:create-story`
4. **Completar:** `/orchestrate complete <story-key>`
5. **Sincronizar si agregaste stories:** `/orchestrate sync`

## Workflows Disponibles

- `/bmad:bmm:workflows:create-story` - Crear siguiente story
- `/bmad:bmm:workflows:sprint-planning` - Gestionar sprint status
- `/bmad:bmm:workflows:sprint-status` - Ver resumen del sprint
- `/bmad:bmm:agents:sm` - Activar agente Scrum Master

## Restricciones

- NO modificar stories asignadas a otras sesiones
- NO hacer push sin verificar que no hay conflictos
- Comunicar bloqueos actualizando el tablero
- Siempre sincronizar el tablero despues de crear nuevas stories

## Sincronizacion con Git

Antes de crear branches o hacer push:

```bash
git fetch origin main
git rebase origin/main
```

## Notas

- El tablero NO se commitea (esta en .gitignore)
- Si el tablero se corrompe, regenerar con `/orchestrate init`
- Las stories creadas se reflejan en sprint-status.yaml
