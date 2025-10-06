// src/metadata/validate.js

// Simple ISO date (YYYY-MM-DD) check
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

  // ✅ Required now: version
  if (!meta.version || String(meta.version).trim().length === 0) {
    errors.push('Version')
  }

  // ✅ Required now: datePublished in YYYY-MM-DD
  if (!meta.datePublished || !DATE_RE.test(String(meta.datePublished).slice(0, 10))) {
    errors.push('Date published (YYYY-MM-DD)')
  }

  // ✅ Required now: at least one keyword
  if (!Array.isArray(meta.keywords) || meta.keywords.length === 0) {
    errors.push('At least one keyword')
  }

  // --- Helpful non-blocking checks (warnings) ---
  if (!meta.unit?.unitCode) {
    warnings.push('Unit not set')
  }
  if (!Array.isArray(meta.contributors) || meta.contributors.length === 0) {
    warnings.push('No contributors listed')
  }
  if (meta.status === 'published') {
    // If published, strong suggestion to have a license
    if (!meta.license || String(meta.license).trim().length === 0) {
      warnings.push('License is empty for a published item')
    }
    // If datePublished is in the future, warn
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