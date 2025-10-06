// src/components/MetadataStatus.jsx
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

function prettyStatus(s) {
  if (!s) return ''
  return s === 'in_review' ? 'In review' : s[0].toUpperCase() + s.slice(1)
}

export default function MetadataStatus({ report, metadata }) {
  if (!report) return null
  const { ok, errors = [] } = report

  const title = (metadata?.title || 'Untitled research document').trim()
  const version = (metadata?.version || '').trim()
  const status = metadata?.status || 'draft'
  const contribLine = formatContribs(metadata?.contributors || [])

  const pillClass = ok && errors.length === 0 ? 'pill ok' : 'pill warn'
  const icon = ok && errors.length === 0 ? '✅' : '⚠️'
  const caption =
    ok && errors.length === 0
      ? 'Ready for export'
      : `Needs attention — ${errors.length} issue${errors.length === 1 ? '' : 's'}`

  return (
    <div className="status-wrap">
      <div className={pillClass} role="status" aria-live="polite">
        <span className="pill-icon" aria-hidden>{icon}</span>
        <span className="pill-main">
          <span className="pill-title">
            {title}
            {version && <span className="pill-badge">v{version}</span>}
            <span className={`pill-badge pill-badge--status status-${status}`}>
              {prettyStatus(status)}
            </span>
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