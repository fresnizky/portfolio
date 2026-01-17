# Scripts de Detección para QA Exploratorio

Scripts JavaScript ejecutados via `mcp__chrome-devtools__evaluate_script`.

---

## 1. Detección de Botones Huérfanos

Detecta botones sin handlers de click o que no están en formularios.

```javascript
() => {
  const issues = [];

  document.querySelectorAll('button').forEach((btn, idx) => {
    const hasOnClick = btn.onclick !== null ||
                       btn.getAttribute('onclick') !== null;
    const inForm = btn.form || btn.closest('form');
    const hasDataAction = btn.hasAttribute('data-action') ||
                          btn.hasAttribute('data-onclick') ||
                          btn.hasAttribute('ng-click') ||
                          btn.hasAttribute('@click') ||
                          btn.hasAttribute('v-on:click');

    if (!hasOnClick && !inForm && !hasDataAction) {
      issues.push({
        type: 'orphan-button',
        element: 'button',
        index: idx,
        text: btn.textContent.trim().slice(0, 50),
        classes: btn.className,
        id: btn.id || null,
        severity: 'warning'
      });
    }
  });

  return issues;
}
```

---

## 2. Detección de Links Huérfanos

Detecta links con href vacío, solo "#", o javascript:void.

```javascript
() => {
  const issues = [];

  document.querySelectorAll('a').forEach((link, idx) => {
    const href = link.getAttribute('href');

    const isEmpty = !href || href.trim() === '';
    const isHashOnly = href === '#';
    const isJsVoid = href && href.startsWith('javascript:void');
    const isJsOnly = href && href.startsWith('javascript:') &&
                     !href.includes('window.location');

    const hasOnClick = link.onclick !== null ||
                       link.getAttribute('onclick');
    const hasDataAction = link.hasAttribute('data-action') ||
                          link.hasAttribute('@click') ||
                          link.hasAttribute('v-on:click');

    if ((isEmpty || isHashOnly || isJsVoid || isJsOnly) &&
        !hasOnClick && !hasDataAction) {
      issues.push({
        type: 'orphan-link',
        element: 'a',
        index: idx,
        text: link.textContent.trim().slice(0, 50),
        href: href || '(empty)',
        classes: link.className,
        severity: 'warning'
      });
    }
  });

  return issues;
}
```

---

## 3. Detección de Inputs sin Labels

Detecta campos de formulario sin labels accesibles.

```javascript
() => {
  const issues = [];

  document.querySelectorAll('input, select, textarea').forEach((input, idx) => {
    // Skip hidden y submit
    if (input.type === 'hidden') return;
    if (input.type === 'submit' || input.type === 'button') return;

    const id = input.id;

    const hasLabelFor = id && document.querySelector(`label[for="${id}"]`);
    const hasWrappingLabel = input.closest('label');
    const hasAriaLabel = input.getAttribute('aria-label');
    const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
    const hasTitle = input.title && input.title.trim();

    if (!hasLabelFor && !hasWrappingLabel &&
        !hasAriaLabel && !hasAriaLabelledBy && !hasTitle) {
      issues.push({
        type: 'input-without-label',
        element: input.tagName.toLowerCase(),
        index: idx,
        inputType: input.type || 'text',
        name: input.name || '',
        id: id || null,
        placeholder: input.placeholder || null,
        severity: 'warning'
      });
    }
  });

  return issues;
}
```

---

## 4. Detección de Imágenes sin Alt

Detecta imágenes sin atributo alt (excepto decorativas).

```javascript
() => {
  const issues = [];

  document.querySelectorAll('img').forEach((img, idx) => {
    const hasAlt = img.hasAttribute('alt');

    // Skip si alt="" (decorativa intencionalmente)
    if (hasAlt && img.getAttribute('alt') === '') {
      return;
    }

    // Skip si role="presentation" o role="none"
    const role = img.getAttribute('role');
    if (role === 'presentation' || role === 'none') {
      return;
    }

    if (!hasAlt) {
      issues.push({
        type: 'image-without-alt',
        element: 'img',
        index: idx,
        src: img.src ? img.src.split('/').pop().slice(0, 50) : '(no src)',
        classes: img.className,
        severity: 'warning'
      });
    }
  });

  return issues;
}
```

---

## 5. Verificación de Accesibilidad del Documento

Verifica lang, title, headings, y otros requisitos a nivel documento.

```javascript
() => {
  const issues = [];

  // Verificar lang en html
  const htmlLang = document.documentElement.lang;
  if (!htmlLang || htmlLang.trim() === '') {
    issues.push({
      type: 'missing-lang',
      element: 'html',
      description: 'Documento sin atributo lang',
      severity: 'warning',
      wcag: '3.1.1 Language of Page (A)'
    });
  }

  // Verificar título de página
  const title = document.title;
  if (!title || title.trim() === '') {
    issues.push({
      type: 'missing-title',
      element: 'title',
      description: 'Página sin título o título vacío',
      severity: 'warning',
      wcag: '2.4.2 Page Titled (A)'
    });
  }

  // Verificar jerarquía de headings
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let prevLevel = 0;
  let h1Count = 0;

  headings.forEach((h, idx) => {
    const level = parseInt(h.tagName[1]);

    if (level === 1) h1Count++;

    // Detectar saltos en jerarquía
    if (prevLevel > 0 && level > prevLevel + 1) {
      issues.push({
        type: 'heading-skip',
        element: h.tagName.toLowerCase(),
        index: idx,
        text: h.textContent.trim().slice(0, 50),
        description: `Salto de h${prevLevel} a h${level}`,
        severity: 'warning'
      });
    }

    prevLevel = level;
  });

  // Verificar múltiples h1
  if (h1Count > 1) {
    issues.push({
      type: 'multiple-h1',
      element: 'h1',
      count: h1Count,
      description: `Encontrados ${h1Count} elementos h1 (debería ser 1)`,
      severity: 'warning'
    });
  }

  // Verificar h1 faltante
  if (h1Count === 0 && headings.length > 0) {
    issues.push({
      type: 'missing-h1',
      element: 'page',
      description: 'Página sin elemento h1',
      severity: 'warning'
    });
  }

  // Verificar viewport que restringe zoom
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    const content = viewport.getAttribute('content');
    if (content && (content.includes('user-scalable=no') ||
                    content.includes('maximum-scale=1'))) {
      issues.push({
        type: 'restricted-zoom',
        element: 'meta[viewport]',
        description: 'Viewport restringe capacidad de zoom del usuario',
        severity: 'warning',
        wcag: '1.4.4 Resize Text (AA)'
      });
    }
  }

  return issues;
}
```

---

## 6. Extracción de Links Internos

Extrae todos los links internos para verificación de links rotos.

```javascript
() => {
  const links = new Map();

  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');

    // Skip links externos
    if (href.startsWith('http://') || href.startsWith('https://')) {
      try {
        const url = new URL(href);
        if (url.hostname !== window.location.hostname) {
          return;
        }
      } catch (e) {
        return;
      }
    }

    // Skip non-navigation hrefs
    if (href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:') ||
        href === '#') {
      return;
    }

    // Normalizar href
    let normalizedHref = href;
    if (href.startsWith('/')) {
      normalizedHref = href;
    } else if (!href.startsWith('#')) {
      normalizedHref = '/' + href;
    }

    // Agregar a map (para deduplicar)
    if (!links.has(normalizedHref)) {
      links.set(normalizedHref, {
        href: normalizedHref,
        text: link.textContent.trim().slice(0, 50),
        count: 1
      });
    } else {
      links.get(normalizedHref).count++;
    }
  });

  return Array.from(links.values());
}
```

---

## 7. Detección de Elementos Interactivos No Accesibles

Detecta divs/spans con click handlers pero sin keyboard accessibility.

```javascript
() => {
  const issues = [];
  const nonInteractive = ['div', 'span', 'p', 'li', 'section', 'article'];

  nonInteractive.forEach(tag => {
    document.querySelectorAll(
      `${tag}[onclick], ${tag}[@click], ${tag}[v-on\\:click]`
    ).forEach((el, idx) => {
      const hasRole = el.getAttribute('role');
      const hasTabindex = el.hasAttribute('tabindex');
      const hasAriaLabel = el.getAttribute('aria-label');

      const missing = [];

      if (!hasRole) missing.push('role');
      if (!hasTabindex) missing.push('tabindex');
      if (!hasAriaLabel && !el.textContent.trim()) {
        missing.push('accessible name');
      }

      if (missing.length > 0) {
        issues.push({
          type: 'non-interactive-click',
          element: tag,
          index: idx,
          text: el.textContent.trim().slice(0, 30),
          missing: missing,
          severity: 'warning'
        });
      }
    });
  });

  return issues;
}
```

---

## Uso

Estos scripts se ejecutan via:

```
mcp__chrome-devtools__evaluate_script({
  function: "<script_aqui>"
})
```

El resultado es un array de issues que se agregan al reporte de QA.
