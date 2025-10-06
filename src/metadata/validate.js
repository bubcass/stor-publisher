// src/metadata/validate.js

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function validateMetadata(meta = {}) {
  const errors = []
  const warnings = []

  // --- Required core fields ---
  if (!meta.title || String(meta.title).trim().length < 3) {
    errors.push('Title (min 3 chars)')
  }
  if (!meta.language || String(meta.language).trim().length === 0) {
    errors.push('Language (e.g., "en")')
  }

  // Required: version
  if (!meta.version || String(meta.version).trim().length === 0) {
    errors.push('Version')
  }

  // Required: at least one keyword
  if (!Array.isArray(meta.keywords) || meta.keywords.length === 0) {
    errors.push('At least one keyword')
  }

  // Date published is ONLY required if status is "published"
  if (meta.status === 'published') {
    const d = String(meta.datePublished || '').slice(0, 10)
    if (!DATE_RE.test(d)) {
      errors.push('Date published (YYYY-MM-DD)')
    }
  } else if (meta.datePublished) {
    // If present while not published, just sanity-check and warn if odd
    const d = String(meta.datePublished).slice(0, 10)
    if (!DATE_RE.test(d)) {
      warnings.push('Date published format should be YYYY-MM-DD')
    }
  }

  // Non-blocking suggestions
  if (!meta.unit?.unitCode) {
    warnings.push('Unit not set')
  }
  if (!Array.isArray(meta.contributors) || meta.contributors.length === 0) {
    warnings.push('No contributors listed')
  }
  if (meta.status === 'published') {
    if (!meta.license || String(meta.license).trim().length === 0) {
      warnings.push('License is empty for a published item')
    }
    const d = safeDate(meta.datePublished)
    if (d && d.getTime() > Date.now()) {
      warnings.push('Date published is in the future')
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  }
}

function safeDate(s) {
  try {
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}