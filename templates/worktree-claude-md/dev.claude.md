# Worktree: Developer Session

## Rol

Esta sesion esta configurada como **Developer** para el proyecto.
Tu responsabilidad principal es implementar stories siguiendo los estandares del proyecto.

## Tablero de Orquestacion

**CRITICO:** Siempre verificar el tablero antes de implementar cualquier story.

### Ubicacion del Tablero

`_bmad-output/orchestration/sprint-board.yaml`

### Comandos Obligatorios

| Cuando | Comando |
|--------|---------|
| Al iniciar sesion | `/orchestrate status` |
| Antes de implementar | `/orchestrate take <story-key>` |
| Al terminar implementacion | `/orchestrate complete <story-key>` |
| Si abandonas sin terminar | `/orchestrate release <story-key>` |

## Flujo de Trabajo Dev

1. **Ver stories disponibles:** `/orchestrate status`
2. **Reservar story:** `/orchestrate take <story-key>`
3. **Implementar:** `/bmad:bmm:workflows:dev-story`
4. **Commit y push:** `git add . && git commit && git push`
5. **Liberar story:** `/orchestrate complete <story-key>`

## Workflows Disponibles

- `/bmad:bmm:workflows:dev-story` - Implementar story
- `/bmad:bmm:agents:dev` - Activar agente Developer (Amelia)

## Restricciones

- **SOLO** implementar stories que hayas tomado en el tablero
- **NO** tocar archivos de stories asignadas a otros developers
- Verificar tablero si encuentras conflictos de merge
- Hacer commits frecuentes y descriptivos

## Sincronizacion con Git

Antes de comenzar a implementar:

```bash
git fetch origin main
git rebase origin/main
```

Antes de hacer push:

```bash
git fetch origin main
git rebase origin/main
# Resolver conflictos si los hay
git push origin <tu-branch>
```

## Notas

- Si otra sesion esta trabajando en la misma area, coordinar
- El tablero es la fuente de verdad para asignaciones
- Si necesitas una story asignada a otro, pedir que la libere
- Actualizar sprint-status.yaml al completar (status -> review)
