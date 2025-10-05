// src/components/MetadataForm.jsx
import React from 'react'
import { IMPRINTS } from '../utils/imprint.js'

const IMPRINT_OPTIONS = Object.values(IMPRINTS)

export default function MetadataForm({ value, onChange }) {
  const meta = value || {}

  const set = (patch) => onChange({ ...meta, ...patch })

  const setImprint = (patch) => {
    const next = { ...(meta.imprint || {}), ...patch }
    // If imprint changes away from COM, clear committeeCode
    if (next.unitCode !== 'COM') {
      delete next.committeeCode
    }
    // Also keep the human title in sync
    const sel = IMPRINT_OPTIONS.find(i => i.code === next.unitCode)
    if (sel) next.unit = sel.title
    set({ imprint: next })
  }

  return (
    <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12 }}>
      <legend style={{ padding: '0 6px' }}>Metadata</legend>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Title *</span>
          <input
            value={meta.title || ''}
            onChange={e => set({ title: e.target.value })}
            placeholder="Document title"
          />
        </label>

        <label style={{ display: 'grid', gap: 4 }}>
          <span>Subtitle</span>
          <input
            value={meta.subtitle || ''}
            onChange={e => set({ subtitle: e.target.value })}
            placeholder="Optional"
          />
        </label>

        <label style={{ display: 'grid', gap: 4 }}>
          <span>Language *</span>
          <input
            value={meta.language || 'en'}
            onChange={e => set({ language: e.target.value.trim() })}
            placeholder="e.g. en, ga, en-IE"
          />
        </label>

        <label style={{ display: 'grid', gap: 4 }}>
          <span>Status *</span>
          <select
            value={meta.status || 'draft'}
            onChange={e => set({ status: e.target.value })}
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
        </label>
      </div>

      {/* Imprint block */}
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Imprint (unit)</span>
          <select
            value={meta.imprint?.unitCode || ''}
            onChange={e => setImprint({ unitCode: e.target.value })}
          >
            <option value="" disabled>Choose a unit…</option>
            {IMPRINT_OPTIONS.map(opt => (
              <option key={opt.code} value={opt.code}>{opt.title}</option>
            ))}
          </select>
        </label>

        {meta.imprint?.unitCode === 'COM' && (
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Committee code (e.g. COM-FIN)</span>
            <input
              value={meta.imprint?.committeeCode || ''}
              onChange={e => setImprint({ committeeCode: e.target.value.trim() })}
              placeholder="COM-XXXX"
            />
          </label>
        )}
      </div>

      {/* Minor styling for inputs (keeps things neat without a CSS file change) */}
      <style>{`
        fieldset input, fieldset select, fieldset textarea {
          padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;
          font: inherit;
        }
        fieldset input:focus, fieldset select:focus, fieldset textarea:focus {
          outline: 3px solid #c7d2fe; outline-offset: 1px; border-color: #a5b4fc;
        }
      `}</style>
    </fieldset>
  )
}