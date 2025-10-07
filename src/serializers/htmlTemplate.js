// src/serializers/htmlTemplate.js
import { buildJsonLd, jsonLdScript } from './jsonld.js'

export function wrapHtml(bodyHtml, meta = {}, opts = {}) {
  const lang = meta.language || 'en'
  const title = meta.title || 'Exported Document'
  const canonicalUrl = opts.canonicalUrl || ''

  // Build JSON-LD metadata block
  const ld = buildJsonLd(meta, { canonicalUrl })
  const ldJson = jsonLdScript(ld)

  return `<!doctype html>
<html lang="${escapeAttr(lang)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeText(title)}</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
         max-width:760px;margin:2rem auto;padding:0 1rem;}
    figure{margin:1rem 0}
    figcaption{font-size:.9rem;color:#555}
    pre{background:#f7f7f7;padding:1rem;border-radius:8px;overflow:auto}
  </style>
  <script type="application/ld+json">
${ldJson}
  </script>
</head>
<body>
${bodyHtml}
</body>
</html>`
}

// helper functions (copied from earlier)
function escapeText(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
function escapeAttr(s = '') {
  return escapeText(s)
}