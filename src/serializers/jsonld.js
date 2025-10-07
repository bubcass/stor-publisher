// src/serializers/jsonld.js

// Build JSON-LD for a scholarly/report-like document from your metadata.
// Chooses a reasonable @type and fills authors, publisher, keywords, DOI, etc.

function compactPerson(c) {
  if (!c) return null
  const name = [c.given, c.family].filter(Boolean).join(' ').trim() || undefined
  const aff = c.affiliation
    ? {
        '@type': 'Organization',
        name: affName(aff),
        ...(aff.unitCode ? { identifier: aff.unitCode } : {}),
        ...(aff.unitUri ? { url: aff.unitUri } : {}),
      }
    : undefined
  return {
    '@type': 'Person',
    ...(name ? { name } : {}),
    ...(c.orcid ? { identifier: `https://orcid.org/${c.orcid.replace(/^https?:\/\/orcid\.org\//, '')}` } : {}),
    ...(c.email ? { email: c.email } : {}),
    ...(aff ? { affiliation: aff } : {}),
  }
}

function affName(aff = {}) {
  // Prefer explicit unit label; fall back to org
  return aff.unit || aff.org || 'Houses of the Oireachtas'
}

export function buildJsonLd(meta = {}, options = {}) {
  const {
    canonicalUrl, // optional absolute URL for the final page
  } = options

  const type =
    meta.status === 'published'
      ? (meta.genre || 'Report')          // you can map this to 'ScholarlyArticle' if you prefer
      : (meta.genre || 'Report')

  const authors = Array.isArray(meta.contributors)
    ? meta.contributors
        .filter(c => (c.role || 'author').toLowerCase() === 'author')
        .map(compactPerson)
        .filter(Boolean)
    : []

  const editors = Array.isArray(meta.contributors)
    ? meta.contributors
        .filter(c => (c.role || '').toLowerCase() === 'editor')
        .map(compactPerson)
        .filter(Boolean)
    : []

  const publisher = {
    '@type': 'Organization',
    name: meta.publisher || 'Houses of the Oireachtas',
    ...(meta.unit?.unit ? { department: { '@type': 'Organization', name: meta.unit.unit } } : {}),
  }

  const ld = {
    '@context': 'https://schema.org',
    '@type': type,                        // e.g., 'Report' or 'ScholarlyArticle'
    headline: meta.title || 'Untitled research document',
    ...(meta.subtitle ? { alternativeHeadline: meta.subtitle } : {}),
    inLanguage: meta.language || 'en',
    ...(meta.abstract ? { description: meta.abstract } : {}),
    ...(meta.keywords && meta.keywords.length ? { keywords: meta.keywords } : {}),
    ...(meta.version ? { version: String(meta.version) } : {}),
    ...(meta.doi ? { identifier: meta.doi } : {}),
    ...(meta.status ? { creativeWorkStatus: meta.status } : {}),
    ...(meta.datePublished ? { datePublished: meta.datePublished } : {}),
    ...(meta.dateModified ? { dateModified: meta.dateModified } : {}),
    ...(canonicalUrl ? { url: canonicalUrl } : {}),
    ...(authors.length ? { author: authors } : {}),
    ...(editors.length ? { editor: editors } : {}),
    publisher,
    license: meta.license || 'Oireachtas (Open Data) PSI Licence',
    // You can also add "isPartOf", "about", "sameAs", "citation" later if relevant.
  }

  return ld
}

// Safe stringify for embedding in <script> without breaking on </script>
export function jsonLdScript(ld) {
  const json = JSON.stringify(ld, null, 2)
    .replace(/<\/(script)>/gi, '<\\/$1>')
  return json
}