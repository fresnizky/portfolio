# Worktree: Code Review Session

## Rol

Esta sesion esta configurada como **Code Reviewer** para el proyecto.
Tu responsabilidad es revisar codigo implementado por otros developers.

## Tablero de Orquestacion

Verificar que la story a revisar:
1. Este en estado `review` en sprint-status.yaml
2. NO este asignada a ninguna sesion en el tablero (evitar modificaciones concurrentes)

### Ubicacion del Tablero

`_bmad-output/orchestration/sprint-board.yaml`

### Comandos Recomendados

| Cuando | Comando |
|--------|---------|
| Al iniciar sesion | `/orchestrate status` |
| Ver estado del sprint | `/bmad:bmm:workflows:sprint-status` |

## Flujo de Trabajo Review

1. **Verificar tablero:** `/orchestrate status` (confirmar que no hay conflictos)
2. **Ver sprint status:** Identificar stories en estado `review`
3. **Checkout del branch:** `git fetch && git checkout feature/<story-branch>`
4. **Ejecutar review:** `/bmad:bmm:workflows:code-review`
5. **Documentar hallazgos** en el archivo de la story
6. **Actualizar status** si la review pasa (review -> done)

## Workflows Disponibles

- `/bmad:bmm:workflows:code-review` - Ejecutar revision adversarial
- `/bmad:bmm:workflows:sprint-status` - Ver resumen del sprint

## Consideraciones

### Sobre el Revisor

- Idealmente usar un modelo LLM diferente al que implemento la story
- Aplicar revision adversarial: buscar problemas, no confirmar que "se ve bien"
- Minimo 3-10 hallazgos por story

### Sobre las Modificaciones

- NO modificar codigo directamente - solo documentar issues
- Los fixes los debe hacer el developer original o una sesion dev
- Si hay fixes criticos, coordinar con el developer

### Sobre el Estado

- Solo marcar `done` si TODOS los criterios de aceptacion se cumplen
- Si hay issues, dejar en `review` y documentar en la story
- Agregar seccion "Senior Developer Review (AI)" en la story

## Sincronizacion con Git

Para revisar un branch especifico:

```bash
git fetch origin
git checkout origin/feature/<story-branch>
# O crear branch local para notas
git checkout -b review/<story-branch>
```

## Notas

- El review worktree puede hacer checkout de cualquier branch
- No hacer commits de codigo - solo documentacion de review
- Comunicar al developer cuando la review este lista
