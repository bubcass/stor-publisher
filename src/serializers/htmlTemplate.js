// src/serializers/htmlTemplate.js
// Standalone: no imports. Safe to call from anywhere.

/** Minimal JSON-LD for an Article */
function buildJsonLd(meta = {}) {
  const authors = (meta.contributors || [])
    .filter(c => (c.role || 'author').toLowerCase() === 'author')
    .map(c => [c.given, c.family].filter(Boolean).join(' ').trim())
    .filter(Boolean)

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: meta.title || 'Untitled research document',
    inLanguage: meta.language || 'en',
    datePublished: meta.datePublished || undefined,
    dateModified: meta.dateModified || undefined,
    keywords: (meta.keywords || []).join(', ') || undefined,
    version: meta.version || undefined,
    author: authors.length ? authors : undefined,
    publisher: meta.publisher || 'Houses of the Oireachtas',
    license: meta.license || undefined,
  }
  Object.keys(data).forEach(k => data[k] === undefined && delete data[k])
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`
}

/** Wrap editor HTML in a full HTML page (with basic styles + JSON-LD) */
export function wrapHtml(bodyHtml, meta = {}) {
  const title = String(meta.title || 'Exported Document')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return `<!doctype html>
<html lang="${meta.language || 'en'}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6}
    h1,h2,h3{line-height:1.25}
    figure{margin:1rem 0}
    figcaption{font-size:.9rem;color:#555}
    pre{background:#f7f7f7;padding:1rem;border-radius:8px;overflow:auto}
  </style>
  ${buildJsonLd(meta)}
</head>
<body>
${bodyHtml}
</body>
</html>`
}