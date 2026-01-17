# Exploratory QA - Checklist de Validación

## Pre-requisitos

- [ ] chrome-devtools MCP conectado y funcionando
- [ ] Browser abierto y accesible
- [ ] Aplicación corriendo en base_url
- [ ] Directorio de screenshots existe o puede crearse

## Cobertura de Exploración

- [ ] Todas las rutas especificadas exploradas
- [ ] Rutas auto-descubiertas dentro del límite exploradas
- [ ] Número de páginas dentro de max_pages
- [ ] Errores de navegación documentados

## Detección de Console Errors

- [ ] Mensajes de consola capturados para cada página
- [ ] Severidad correctamente clasificada (error vs warning)
- [ ] Fuente y línea capturados cuando disponibles

## Detección de Elementos Huérfanos

- [ ] Botones sin handlers identificados
- [ ] Links sin href válido identificados
- [ ] Inputs sin labels identificados
- [ ] Imágenes sin alt identificadas
- [ ] Scripts de detección ejecutados sin errores

## Detección de Links Rotos

- [ ] Links internos extraídos de cada página
- [ ] Cada link verificado por accesibilidad
- [ ] Respuestas 404 correctamente registradas

## Verificaciones de Accesibilidad

- [ ] Atributo lang verificado
- [ ] Título de página verificado
- [ ] Jerarquía de headings validada
- [ ] Múltiples h1 detectados

## Detección de Network Issues

- [ ] Requests fallidos (4xx, 5xx) capturados
- [ ] Recursos faltantes identificados
- [ ] Tipos de recurso categorizados

## Screenshots

- [ ] Screenshot tomado para cada página explorada
- [ ] Screenshots guardados en directorio configurado
- [ ] Nombres de archivo siguen convención

## Generación de Reporte

- [ ] Todas las categorías de hallazgos pobladas
- [ ] Estadísticas de resumen precisas
- [ ] Recomendaciones priorizadas correctamente
- [ ] Estado general determinado
- [ ] Reporte guardado en ruta de output

## Criterios de Completitud

El workflow está completo cuando:

1. Todos los items del checklist marcados
2. No hay issues críticos bloqueando generación del reporte
3. Reporte accesible en la ruta de output
4. Usuario ha recibido resumen de hallazgos

## Clasificación de Severidad

| Severidad | Criterio | Acción Requerida |
|-----------|----------|------------------|
| Critical | Errores JS, links rotos a páginas core, 5xx | Fix inmediato |
| Warning | Elementos huérfanos, a11y issues, 4xx | Fix antes de release |
| Info | Mejoras sugeridas, best practices | Backlog |
