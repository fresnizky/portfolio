# Worktree: QA Exploratorio Session

## Rol

Esta sesion esta configurada como **QA Exploratorio** para el proyecto.
Tu responsabilidad es detectar problemas que los tests automatizados no cubren.

## Tablero de Orquestacion

Ubicacion: `_bmad-output/orchestration/sprint-board.yaml`

### Comandos de Orquestacion

| Cuando | Comando |
|--------|---------|
| Al iniciar sesion | `/bmad:bmm:workflows:orchestrate status` |
| Antes de hacer QA en una story | `/bmad:bmm:workflows:orchestrate take <story>` |
| Al terminar QA | `/bmad:bmm:workflows:orchestrate complete <story>` |

## Workflow Principal

`/bmad:bmm:workflows:testarch-exploratory-qa`

Este workflow usa chrome-devtools MCP para:
- Detectar errores de consola JavaScript
- Encontrar elementos huerfanos (botones sin accion, links vacios)
- Verificar links internos rotos
- Validar accesibilidad basica
- Capturar problemas de red

## Flujo de Trabajo QA

1. **Verificar tablero:** `/orchestrate status`
2. **Tomar story para QA:** `/orchestrate take <story>`
3. **Ejecutar QA exploratorio:** `/bmad:bmm:workflows:testarch-exploratory-qa`
4. **Revisar reporte** generado en `_bmad-output/exploratory-qa-report.md`
5. **Documentar hallazgos** en la story si es necesario
6. **Completar:** `/orchestrate complete <story>`

## Configuracion

El workflow usa configuracion persistente en `_bmad-output/qa-config.yaml`.

Si no existe, el workflow te guiara para crearla.

Si ya existe, solo te pedira credenciales (si auth esta habilitada).

## Workflows Adicionales Disponibles

- `/bmad:bmm:workflows:testarch-nfr` - Evaluar requerimientos no funcionales
- `/bmad:bmm:workflows:testarch-test-review` - Revisar calidad de tests existentes
- `/bmad:bmm:workflows:testarch-trace` - Matriz de trazabilidad requisitos-tests

## Coordinacion con Otros Roles

- **Esperar a que Dev complete** antes de hacer QA en una story
- **Reportar bugs** documentandolos en la story o creando issues
- **Comunicar con Review** si encuentras problemas criticos

## Prerequisitos

- Chrome abierto con la aplicacion corriendo
- chrome-devtools MCP conectado
- Configuracion de QA lista (`qa-config.yaml`)

## Tips

- Ejecuta QA despues de que una story pase code review
- Enfocate en flujos de usuario, no solo paginas individuales
- Revisa estados edge: errores, loading, empty states
- Prueba en diferentes tamaños de pantalla si es relevante
