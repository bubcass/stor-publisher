import React from 'react'

function formatContribs(contributors = []) {
  if (!contributors.length) return 'No contributors yet'
  const names = contributors.map(c => {
    const fam = c.family?.trim() || ''
    const giv = c.given?.trim() || ''
    return fam && giv ? `${fam}, ${giv}` : (fam || giv || 'Unknown')
  })
  const head = names.slice(0, 2).join(' • ')
  const extra = contributors.length - 2
  return extra > 0 ? `${head} • +${extra} more` : head
}

export default function MetadataStatus({ report, metadata }) {
  if (!report) return null
  const { ok, errors = [] } = report

  const title = (metadata?.title || 'Untitled research document').trim()
  const version = (metadata?.version || '').trim() // ← show if present
  const contribLine = formatContribs(metadata?.contributors || [])

  const pillClass = ok && errors.length === 0 ? 'pill ok' : 'pill warn'
  const icon = ok && errors.length === 0 ? '✅' : '⚠️'
  const caption =
    ok && errors.length === 0
      ? 'Ready for export to Stór'
      : `Needs attention — ${errors.length} issue${errors.length === 1 ? '' : 's'}`

  return (
    <div className="status-wrap">
      <div className={pillClass} role="status" aria-live="polite">
        <span className="pill-icon" aria-hidden>{icon}</span>
        <span className="pill-main">
          <span className="pill-title">
            {title}
            {/* version badge */}
            {version && <span className="pill-badge">v{version}</span>}
          </span>
          <span className="pill-meta">
            <span className="pill-caption">{caption}</span>
            <span className="pill-dot">•</span>
            <span className="pill-contribs">{contribLine}</span>
          </span>
        </span>
      </div>

      {errors.length > 0 && (
        <details className="pill-errors">
          <summary>Show details</summary>
          <ul>
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </details>
      )}
    </div>
  )
}