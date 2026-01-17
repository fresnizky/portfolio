# Exploratory QA Workflow

<critical>Este workflow requiere chrome-devtools MCP conectado a un browser</critical>
<critical>Comunicar en {communication_language}</critical>

## Objetivo

Realizar QA exploratorio automatizado para detectar problemas que los tests automatizados no cubren:
- Errores de consola JavaScript
- Elementos huérfanos (botones sin funcionalidad, links rotos)
- **Páginas 404 y navegaciones rotas**
- **Click-through testing de elementos interactivos**
- Problemas de accesibilidad
- Recursos de red fallidos

---

## Paso 0: Cargar o Crear Configuración

<action>Verificar si existe archivo de configuración en {config_file}</action>

<check if="existe qa-config.yaml">
<action>Cargar configuración desde el archivo</action>

Mostrar:
```
Configuración cargada desde qa-config.yaml:
- URL Base: {base_url}
- Auth: {enabled ? 'Habilitada' : 'Deshabilitada'}
- Rutas: {routes.length > 0 ? routes.join(', ') : 'Auto-descubrir'}

¿Usar esta configuración? [s/n]
```

<check if="usuario dice no">
<action>Preguntar si quiere modificarla o crear nueva</action>
</check>
</check>

<check if="no existe qa-config.yaml">
<action>Preguntar al usuario la configuración inicial:</action>

```
No se encontró configuración previa. Vamos a crear una.

1. **URL Base** de la aplicación (ej: http://localhost:3000):
```

<action>Obtener base_url</action>

```
2. **¿La aplicación requiere autenticación?** [s/n]:
```

<check if="requiere auth">
```
Configuración de autenticación:

3. **URL de login** (ej: /login):
4. **Selector del campo usuario** (ej: #email, input[name="email"]):
5. **Selector del campo password** (ej: #password, input[name="password"]):
6. **Selector del botón submit** (ej: button[type="submit"], #login-btn):
```
</check>

```
7. **Rutas específicas a explorar** (opcional, separadas por coma):
   Dejar vacío para auto-descubrir rutas.
```

<action>Crear y guardar qa-config.yaml:</action>

```yaml
# QA Exploratorio - Configuración Persistente
# Ubicación: _bmad-output/qa-config.yaml
#
# Este archivo guarda la configuración para no repetirla cada vez.
# El password NO se guarda - se pide en cada ejecución.

base_url: "{base_url}"

auth:
  enabled: {true/false}
  login_url: "{login_url}"
  selectors:
    username: "{username_selector}"
    password: "{password_selector}"
    submit: "{submit_selector}"

exploration:
  routes: [{routes}]  # Vacío = auto-descubrir
  max_depth: 3
  max_pages: 20
  wait_time: 2000

checks:
  console_errors: true
  orphan_elements: true
  broken_links: true
  accessibility: true
  network_issues: true
```

Mostrar:
```
Configuración guardada en: {config_file}

Para modificarla en el futuro, edita el archivo directamente
o elimínalo para crear una nueva configuración.
```
</check>

---

## Paso 1: Verificar Conexión MCP

<action>Verificar que chrome-devtools MCP está conectado</action>

```
Llamar: mcp__chrome-devtools__list_pages
```

<check if="no hay páginas disponibles o error de conexión">
Mostrar:
```
ERROR: No se detectó conexión con chrome-devtools MCP.

Para usar este workflow:
1. Asegúrate de tener Chrome abierto
2. El MCP server de chrome-devtools debe estar corriendo
3. Verifica la configuración en .claude/settings.json

¿Necesitas ayuda configurando el MCP?
```
HALT
</check>

<check if="hay páginas disponibles">
<action>Si la página actual no está en base_url, navegar:</action>
```
Llamar: mcp__chrome-devtools__navigate_page
Parámetros:
  type: "url"
  url: {base_url}
  timeout: 10000
```
</check>

---

## Paso 1.5: Autenticación (si está configurada)

<check if="auth.enabled es true">

<action>Pedir credenciales al usuario:</action>

```
La aplicación requiere autenticación.

Usuario: {mostrar campo para input}
Password: {mostrar campo para input, oculto}
```

<action>Navegar a la página de login:</action>

```
Llamar: mcp__chrome-devtools__navigate_page
Parámetros:
  type: "url"
  url: "{base_url}{auth.login_url}"
  timeout: 10000
```

<action>Esperar a que cargue la página de login</action>

<action>Llenar el formulario de login:</action>

```
Llamar: mcp__chrome-devtools__fill_form
Parámetros:
  elements:
    - uid: {encontrar uid del elemento que matchea auth.selectors.username}
      value: {username_proporcionado}
    - uid: {encontrar uid del elemento que matchea auth.selectors.password}
      value: {password_proporcionado}
```

Nota: Para encontrar los UIDs, primero tomar snapshot y buscar elementos que coincidan con los selectores.

<action>Alternativa - usar evaluate_script para llenar por selector:</action>

```
Llamar: mcp__chrome-devtools__evaluate_script
Parámetros:
  function: |
    () => {
      const usernameEl = document.querySelector('{auth.selectors.username}');
      const passwordEl = document.querySelector('{auth.selectors.password}');

      if (usernameEl) {
        usernameEl.value = '{username}';
        usernameEl.dispatchEvent(new Event('input', { bubbles: true }));
      }

      if (passwordEl) {
        passwordEl.value = '{password}';
        passwordEl.dispatchEvent(new Event('input', { bubbles: true }));
      }

      return { username: !!usernameEl, password: !!passwordEl };
    }
```

<action>Hacer click en el botón de submit:</action>

```
Llamar: mcp__chrome-devtools__evaluate_script
Parámetros:
  function: |
    () => {
      const submitBtn = document.querySelector('{auth.selectors.submit}');
      if (submitBtn) {
        submitBtn.click();
        return true;
      }
      return false;
    }
```

<action>Esperar a que complete el login (esperar navegación o cambio de página):</action>

```
Esperar {wait_time}ms para que complete la autenticación
```

<action>Verificar que el login fue exitoso:</action>

```
Llamar: mcp__chrome-devtools__list_console_messages
Parámetros:
  types: ["error"]
```

<check if="hay errores de autenticación o sigue en página de login">
Mostrar:
```
ERROR: El login parece haber fallado.

Posibles causas:
- Credenciales incorrectas
- Selectores incorrectos en qa-config.yaml
- La página de login cambió

¿Deseas:
1. Reintentar con otras credenciales
2. Hacer login manual y continuar
3. Cancelar

Elige [1/2/3]:
```

<check if="opción 2">
Mostrar:
```
Por favor, haz login manualmente en el browser.
Cuando estés listo, escribe 'continuar'.
```
<action>Esperar confirmación del usuario</action>
</check>
</check>

<check if="login exitoso">
Mostrar:
```
Login exitoso. Continuando con la exploración autenticada.
```
</check>

</check>

---

## Paso 2: Inicializar Estructuras de Datos

<action>Crear estructura para almacenar hallazgos:</action>

```javascript
const qaReport = {
  timestamp: new Date().toISOString(),
  baseUrl: base_url,
  pagesExplored: [],
  findings: {
    consoleErrors: [],
    orphanElements: [],
    brokenLinks: [],
    accessibilityIssues: [],
    networkIssues: []
  },
  screenshots: [],
  summary: {
    totalPages: 0,
    totalIssues: 0,
    critical: 0,
    warning: 0,
    info: 0
  }
};
```

<action>Crear directorio de screenshots si no existe:</action>
```
mkdir -p {screenshot_dir}
```

---

## Paso 3: Explorar Cada Ruta

Para cada ruta en la lista (o comenzando con "/" si auto_discover_routes):

### 3.1 Navegar a la Ruta

```
Llamar: mcp__chrome-devtools__navigate_page
Parámetros:
  type: "url"
  url: "{base_url}{route}"
  timeout: {wait_time}
```

Esperar a que la página cargue completamente.

### 3.1.1 Verificar que no es Página 404

<critical>Este paso detecta páginas 404 que el servidor devuelve con status 200 (SPAs)</critical>

```
Llamar: mcp__chrome-devtools__evaluate_script
Parámetros:
  function: |
    () => {
      // Detectar páginas 404 por múltiples indicadores
      const bodyText = document.body?.innerText?.toLowerCase() || '';
      const title = document.title?.toLowerCase() || '';

      const indicators = {
        // Heading con 404
        hasH1_404: Array.from(document.querySelectorAll('h1')).some(h =>
          h.textContent?.includes('404')),
        // Texto "not found" en el body
        hasNotFoundText: bodyText.includes('not found') ||
                         bodyText.includes('page not found') ||
                         bodyText.includes('página no encontrada'),
        // URL contiene 404
        urlHas404: window.location.pathname.includes('404'),
        // Título indica 404
        title404: title.includes('404') || title.includes('not found'),
        // Elemento específico de error (común en muchos frameworks)
        hasErrorElement: !!document.querySelector('[data-testid="not-found"]') ||
                         !!document.querySelector('.not-found') ||
                         !!document.querySelector('.error-404') ||
                         !!document.querySelector('#error-page')
      };

      const is404 = Object.values(indicators).some(v => v);

      return {
        is404,
        indicators,
        url: window.location.href,
        pathname: window.location.pathname
      };
    }
```

<check if="is404 es true">
  <action>Registrar como link roto CRÍTICO:</action>
  ```javascript
  findings.brokenLinks.push({
    type: 'internal-404',
    url: resultado.url,
    pathname: resultado.pathname,
    sourceRoute: ruta_anterior || 'direct',
    indicators: resultado.indicators,
    severity: 'critical'
  });
  ```
  <action>Tomar screenshot del 404 para evidencia</action>
  <action>Continuar con siguiente ruta (no explorar página 404)</action>
</check>

### 3.2 Capturar Errores de Consola

```
Llamar: mcp__chrome-devtools__list_console_messages
Parámetros:
  types: ["error", "warn"]
```

Para cada mensaje de error:
- Registrar: ruta, tipo, mensaje, fuente, línea
- Clasificar severidad: error = critical, warn = warning

### 3.3 Verificar Network Requests

```
Llamar: mcp__chrome-devtools__list_network_requests
Parámetros:
  resourceTypes: ["document", "script", "stylesheet", "xhr", "fetch"]
```

Buscar requests con status >= 400:
- Registrar: URL, método, status, tipo de recurso
- Clasificar: 5xx = critical, 4xx = warning

### 3.4 Tomar Snapshot del DOM

```
Llamar: mcp__chrome-devtools__take_snapshot
Parámetros:
  verbose: true
```

Analizar el snapshot para el paso siguiente.

### 3.5 Detectar Elementos Huérfanos

```
Llamar: mcp__chrome-devtools__evaluate_script
Parámetros:
  function: |
    () => {
      const issues = [];

      // Detectar botones sin handlers
      document.querySelectorAll('button').forEach((btn, idx) => {
        const hasOnClick = btn.onclick !== null || btn.getAttribute('onclick');
        const inForm = btn.form || btn.closest('form');
        const hasDataAction = btn.hasAttribute('data-action') ||
                              btn.hasAttribute('@click') ||
                              btn.hasAttribute('v-on:click');

        if (!hasOnClick && !inForm && !hasDataAction) {
          issues.push({
            type: 'orphan-button',
            element: 'button',
            text: btn.textContent.trim().slice(0, 50),
            classes: btn.className,
            severity: 'warning'
          });
        }
      });

      // Detectar links sin href válido
      document.querySelectorAll('a').forEach((link, idx) => {
        const href = link.getAttribute('href');
        const isEmpty = !href || href === '' || href === '#';
        const isJsVoid = href && href.startsWith('javascript:void');
        const hasOnClick = link.onclick !== null;

        if ((isEmpty || isJsVoid) && !hasOnClick) {
          issues.push({
            type: 'orphan-link',
            element: 'a',
            text: link.textContent.trim().slice(0, 50),
            href: href || '(empty)',
            severity: 'warning'
          });
        }
      });

      // Detectar inputs sin labels
      document.querySelectorAll('input, select, textarea').forEach((input, idx) => {
        if (input.type === 'hidden' || input.type === 'submit') return;

        const id = input.id;
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = input.getAttribute('aria-label') ||
                             input.getAttribute('aria-labelledby');
        const hasWrappingLabel = input.closest('label');

        if (!hasLabel && !hasAriaLabel && !hasWrappingLabel) {
          issues.push({
            type: 'input-without-label',
            element: input.tagName.toLowerCase(),
            inputType: input.type || 'text',
            name: input.name || '',
            severity: 'warning'
          });
        }
      });

      // Detectar imágenes sin alt
      document.querySelectorAll('img').forEach((img, idx) => {
        if (!img.hasAttribute('alt')) {
          issues.push({
            type: 'image-without-alt',
            element: 'img',
            src: img.src ? img.src.split('/').pop().slice(0, 30) : '(no src)',
            severity: 'warning'
          });
        }
      });

      return issues;
    }
```

Agregar issues encontrados a findings.orphanElements.

### 3.6 Verificar Accesibilidad

```
Llamar: mcp__chrome-devtools__evaluate_script
Parámetros:
  function: |
    () => {
      const issues = [];

      // Verificar lang en html
      if (!document.documentElement.lang) {
        issues.push({
          type: 'missing-lang',
          description: 'Documento sin atributo lang',
          severity: 'warning'
        });
      }

      // Verificar título de página
      if (!document.title || !document.title.trim()) {
        issues.push({
          type: 'missing-title',
          description: 'Página sin título',
          severity: 'warning'
        });
      }

      // Verificar jerarquía de headings
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let prevLevel = 0;
      let h1Count = 0;

      headings.forEach(h => {
        const level = parseInt(h.tagName[1]);
        if (level === 1) h1Count++;

        if (prevLevel > 0 && level > prevLevel + 1) {
          issues.push({
            type: 'heading-skip',
            description: `Salto de h${prevLevel} a h${level}`,
            text: h.textContent.trim().slice(0, 30),
            severity: 'warning'
          });
        }
        prevLevel = level;
      });

      if (h1Count > 1) {
        issues.push({
          type: 'multiple-h1',
          description: `Múltiples h1 encontrados (${h1Count})`,
          severity: 'warning'
        });
      }

      if (h1Count === 0 && headings.length > 0) {
        issues.push({
          type: 'missing-h1',
          description: 'Página sin h1',
          severity: 'warning'
        });
      }

      return issues;
    }
```

Agregar issues a findings.accessibilityIssues.

### 3.7 Extraer Links Internos (para verificar después)

```
Llamar: mcp__chrome-devtools__evaluate_script
Parámetros:
  function: |
    () => {
      const links = [];
      document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');

        // Solo links internos
        if (href &&
            !href.startsWith('http') &&
            !href.startsWith('mailto:') &&
            !href.startsWith('tel:') &&
            !href.startsWith('#') &&
            !href.startsWith('javascript:')) {
          links.push({
            href: href.startsWith('/') ? href : '/' + href,
            text: link.textContent.trim().slice(0, 30)
          });
        }
      });

      // Deduplicar
      const unique = [...new Map(links.map(l => [l.href, l])).values()];
      return unique;
    }
```

Si auto_discover_routes está habilitado, agregar nuevas rutas a la lista de exploración.

### 3.8 Tomar Screenshot

```
Llamar: mcp__chrome-devtools__take_screenshot
Parámetros:
  filePath: "{screenshot_dir}/{route_slug}.png"
  fullPage: true
```

Registrar path del screenshot.

### 3.9 Actualizar Progreso

Agregar página explorada a pagesExplored con sus estadísticas.

### 3.10 Click-Through Testing de Elementos Interactivos

<critical>Este paso detecta navegaciones rotas que solo se activan al hacer click</critical>

<optional>Este paso puede omitirse si se quiere una exploración más rápida</optional>

<action>Identificar elementos clickeables que podrían navegar:</action>

```
Llamar: mcp__chrome-devtools__evaluate_script
Parámetros:
  function: |
    () => {
      const clickables = [];

      // Links internos (no externos, no anchors)
      document.querySelectorAll('a[href^="/"]').forEach((link, idx) => {
        const href = link.getAttribute('href');
        // Excluir logout y rutas peligrosas
        if (!href.includes('logout') && !href.includes('delete')) {
          clickables.push({
            type: 'link',
            selector: `a[href="${href}"]`,
            href: href,
            text: link.textContent.trim().slice(0, 30),
            index: idx
          });
        }
      });

      // Botones que podrían navegar (fuera de forms, con texto sugestivo)
      const navKeywords = ['ver', 'view', 'go', 'ir', 'open', 'abrir', 'set', 'edit', 'editar'];
      document.querySelectorAll('button').forEach((btn, idx) => {
        const inForm = btn.form || btn.closest('form');
        const text = btn.textContent.toLowerCase().trim();
        const mightNavigate = navKeywords.some(kw => text.includes(kw)) ||
                              btn.querySelector('svg[class*="arrow"]') ||
                              text.includes('→');

        if (!inForm && mightNavigate) {
          clickables.push({
            type: 'button',
            selector: null, // Se usará snapshot uid
            text: btn.textContent.trim().slice(0, 30),
            index: idx
          });
        }
      });

      // Limitar a 10 elementos por página para no hacer el test muy largo
      return clickables.slice(0, 10);
    }
```

<iterate>Para cada elemento clickeable encontrado:</iterate>

1. <action>Guardar URL actual:</action>
   ```javascript
   const currentUrl = window.location.href;
   ```

2. <action>Tomar snapshot para obtener UIDs:</action>
   ```
   Llamar: mcp__chrome-devtools__take_snapshot
   ```

3. <action>Hacer click en el elemento:</action>
   ```
   Llamar: mcp__chrome-devtools__click
   Parámetros:
     uid: {uid del elemento del snapshot}
   ```

4. <action>Esperar posible navegación (500-1000ms)</action>

5. <action>Verificar si navegó a 404 (usar lógica del paso 3.1.1):</action>
   ```
   Llamar: mcp__chrome-devtools__evaluate_script
   Parámetros:
     function: |
       () => {
         const bodyText = document.body?.innerText?.toLowerCase() || '';
         const is404 = bodyText.includes('not found') ||
                       bodyText.includes('page not found') ||
                       Array.from(document.querySelectorAll('h1')).some(h =>
                         h.textContent?.includes('404'));
         return {
           is404,
           url: window.location.href,
           pathname: window.location.pathname
         };
       }
   ```

6. <check if="is404 es true">
     <action>Registrar como navegación rota CRÍTICA:</action>
     ```javascript
     findings.brokenLinks.push({
       type: 'click-navigation-404',
       sourceRoute: currentRoute,
       elementType: elemento.type,
       elementText: elemento.text,
       targetUrl: resultado.pathname,
       severity: 'critical'
     });
     ```
     <action>Tomar screenshot del 404</action>
   </check>

7. <action>Volver a la página original:</action>
   ```
   Llamar: mcp__chrome-devtools__navigate_page
   Parámetros:
     type: "back"
   ```
   O navegar directamente a currentUrl si back no funciona.

---

## Paso 4: Verificar Links Internos

Para cada link interno único descubierto (hasta max_pages):

<action>Navegar al link y verificar que carga correctamente</action>

```
Llamar: mcp__chrome-devtools__navigate_page
Parámetros:
  type: "url"
  url: "{base_url}{link_href}"
  timeout: 5000
```

<action>Verificar status HTTP de la navegación</action>

```
Llamar: mcp__chrome-devtools__list_network_requests
Parámetros:
  resourceTypes: ["document"]
  pageSize: 1
```

Si status >= 400:
```javascript
findings.brokenLinks.push({
  type: 'http-error',
  sourceRoute: currentRoute,
  href: link_href,
  text: link_text,
  status: response.status,
  severity: 'critical'
});
```

<action>Verificar 404 por contenido (SPAs devuelven 200 pero muestran 404)</action>

```
Llamar: mcp__chrome-devtools__evaluate_script
Parámetros:
  function: |
    () => {
      const bodyText = document.body?.innerText?.toLowerCase() || '';
      const is404 = bodyText.includes('not found') ||
                    bodyText.includes('page not found') ||
                    bodyText.includes('página no encontrada') ||
                    Array.from(document.querySelectorAll('h1')).some(h =>
                      h.textContent?.includes('404'));
      return {
        is404,
        url: window.location.href,
        pathname: window.location.pathname
      };
    }
```

<check if="is404 es true (aunque status sea 200)">
```javascript
findings.brokenLinks.push({
  type: 'spa-soft-404',
  sourceRoute: currentRoute,
  href: link_href,
  text: link_text,
  targetUrl: resultado.pathname,
  note: 'SPA devolvió 200 pero muestra página 404',
  severity: 'critical'
});
```
</check>

---

## Paso 5: Calcular Resumen

<action>Calcular estadísticas finales:</action>

```javascript
summary.totalPages = pagesExplored.length;
summary.totalIssues = 0;
summary.critical = 0;
summary.warning = 0;
summary.info = 0;

Object.values(findings).forEach(category => {
  category.forEach(issue => {
    summary.totalIssues++;
    if (issue.severity === 'critical') summary.critical++;
    else if (issue.severity === 'warning') summary.warning++;
    else summary.info++;
  });
});
```

<action>Determinar estado general:</action>

```javascript
let overallStatus;
if (summary.critical > 0) {
  overallStatus = 'FAIL';
} else if (summary.warning > 5) {
  overallStatus = 'CONCERNS';
} else {
  overallStatus = 'PASS';
}
```

---

## Paso 6: Generar Reporte

<action>Cargar template desde {installed_path}/qa-report-template.md</action>

<action>Poblar template con datos recolectados</action>

<action>Guardar reporte en {report_file}</action>

---

## Paso 7: Mostrar Resumen al Usuario

<output>
## QA Exploratorio Completado

**URL Base:** {base_url}
**Páginas Exploradas:** {total_pages}
**Estado General:** {status} {status_emoji}

### Hallazgos

| Categoría | Critical | Warning | Info |
|-----------|----------|---------|------|
| Errores de Consola | {n} | {n} | {n} |
| Elementos Huérfanos | {n} | {n} | {n} |
| Links Rotos | {n} | {n} | {n} |
| Accesibilidad | {n} | {n} | {n} |
| Network | {n} | {n} | {n} |
| **Total** | **{n}** | **{n}** | **{n}** |

### Issues Críticos (Requieren Atención Inmediata)

{lista_de_issues_criticos}

### Reporte Completo

📄 {report_file}
📸 Screenshots: {screenshot_dir}/

### Próximos Pasos

1. Revisar y corregir issues críticos
2. Evaluar warnings con el equipo
3. Re-ejecutar QA después de los fixes
</output>

---

## Manejo de Errores

### Error de Conexión MCP
```
Si chrome-devtools no responde:
- Verificar que Chrome está abierto
- Verificar configuración del MCP server
- Reiniciar el MCP server si es necesario
```

### Timeout de Navegación
```
Si una página no carga:
- Registrar como network issue
- Continuar con la siguiente ruta
- No bloquear el workflow completo
```

### Error en Scripts de Detección
```
Si evaluate_script falla:
- Registrar warning
- Continuar con otras verificaciones
- Notar la limitación en el reporte
```
