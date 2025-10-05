// src/components/MetadataStatus.jsx
import React from 'react'

export default function MetadataStatus({ report, metadata }) {
  const { ok, errors, warnings } = report

  const pill = (text, kind='ok') => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 12,
        marginRight: 6,
        border: `1px solid ${kind==='ok' ? '#16a34a' : kind==='warn' ? '#d97706' : '#b91c1c'}`,
        color: kind==='ok' ? '#14532d' : kind==='warn' ? '#7c2d12' : '#7f1d1d',
        background: kind==='ok' ? '#dcfce7' : kind==='warn' ? '#ffedd5' : '#fee2e2',
      }}
    >
      {text}
    </span>
  )

  return (
    <div style={{margin:'8px 0 12px', padding:'8px 10px', border:'1px solid #7F6C2E', borderRadius:8, background:'#fafafa'}}>
      {ok && errors.length === 0
        ? <div>{pill('Ready for publication to Stór')}</div>
        : <div style={{marginBottom:6}}>
            {errors.length ? pill(`Missing: ${errors.join(', ')}`, 'err') : pill('Ready', 'ok')}
            {warnings.length ? pill(`Hints: ${warnings.join(', ')}`, 'warn') : null}
          </div>}

      {/* Tiny imprint + contributors preview */}
      <div style={{ fontSize: 12, color: '#444' }}>
        {metadata?.imprint
          ? <div><strong>Imprint:</strong> {metadata.imprint.unit} ({metadata.imprint.unitCode}{metadata.imprint.committeeCode ? ` · ${metadata.imprint.committeeCode}` : ''})</div>
          : <div><strong>Imprint:</strong> —</div>}
        <div><strong>Contributors:</strong> {metadata?.contributors?.length
          ? metadata.contributors.map(c => `${c.family}, ${c.given} (${c.role})`).join('; ')
          : '—'}
        </div>
      </div>
    </div>
  )
}