// src/components/MetadataStatus.jsx
import React from 'react'

export default function MetadataStatus({ report, metadata }) {
  const errs = Array.isArray(report?.errors) ? report.errors : []

  // Normalize to { field?: string, message: string }
  const norm = errs.map(e =>
    typeof e === 'string' ? { message: e } : { field: e.field, message: e.message || String(e) },
  )

  const hasErrors = norm.length > 0
  const status = (metadata?.status || 'draft').toLowerCase()
  const version = metadata?.version || ''
  const title = metadata?.title || 'Untitled research document'

  // ✅ Build contributor names list
  const contribs = Array.isArray(metadata?.contributors) ? metadata.contributors : []
  const contribNames = contribs
    .map(c => [c.given, c.family].filter(Boolean).join(' ').trim())
    .filter(Boolean)
  const contribText = contribNames.length
    ? `Contributors: ${contribNames.join(', ')}`
    : 'No contributors listed'

  // Pill style and labels
  const pillClass = hasErrors ? 'pill warn' : 'pill ok'
  const pillTitle = hasErrors ? 'Metadata needs attention' : 'Ready for publication to Stór'

  // Status badge tone
  const statusClass =
    status === 'published'
      ? 'pill-badge pill-badge--status status-published'
      : status === 'in_review'
      ? 'pill-badge pill-badge--status status-in_review'
      : status === 'archived'
      ? 'pill-badge pill-badge--status status-archived'
      : 'pill-badge pill-badge--status status-draft'

  return (
    <div className="status-wrap">
      <div className={pillClass}>
        {/* Colored dot */}
        <div
          className="pill-dot-status"
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: hasErrors ? '#eab308' : '#22c55e', // amber | green
            marginRight: 10,
            flexShrink: 0,
          }}
          aria-hidden
        />

        <div className="pill-main">
          <div className="pill-title">
            {pillTitle}
            <span className={statusClass} title={`Status: ${status}`}>
              {status.replace('_', ' ')}
            </span>
            {version && (
              <span className="pill-badge" title="Version">{`v${version}`}</span>
            )}
          </div>

          {/* ✅ Title + contributor names */}
          <div className="pill-meta">
            <span title="Document title">{title}</span>
            <span className="pill-dot">•</span>
            <span title="Contributors">{contribText}</span>
          </div>

          {hasErrors && (
            <div className="pill-errors">
              <details open={true}>
                <summary>Show details ({norm.length})</summary>
                <ul>
                  {norm.map((e, i) => (
                    <li key={i}>
                      {e.field ? <strong>{humanize(e.field)}:</strong> : null}{' '}
                      {e.message || 'Required field is missing.'}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Simple label prettifier for field keys like "datePublished" → "Date Published"
function humanize(k = '') {
  if (!k) return ''
  return String(k)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
}