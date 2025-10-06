// src/components/MetadataForm.jsx
import React, { useEffect, useState } from 'react'
import { IMPRINT_OPTIONS } from '../utils/imprint.js'

// Common license presets (tweak as needed)
const LICENSES = [
  'Oireachtas (Open Data) PSI Licence',
  'CC BY 4.0',
  'CC BY-SA 4.0',
  'CC0 1.0',
  'All rights reserved',
  'Custom…',
]

export default function MetadataForm({ value, onChange }) {
  const meta = value || {}

  const set = (patch) => onChange({ ...meta, ...patch })
  const setUnit = (patch) => {
    const next = { ...(meta.unit || {}), ...patch }
    set({ unit: next })
  }

  const isCommittees = (meta.unit?.unitCode || '').toUpperCase() === 'COM'
  const licenseIsCustom =
    meta.license && !LICENSES.includes(meta.license) && meta.license !== 'Custom…'

  // --- Keywords: local text state so commas/spaces aren't eaten while typing ---
  const [keywordsInput, setKeywordsInput] = useState((meta.keywords || []).join(', '))

  // Keep local text in sync if metadata.keywords changes from elsewhere (e.g., DOCX import)
  useEffect(() => {
    const joined = (meta.keywords || []).join(', ')
    if (joined !== keywordsInput) setKeywordsInput(joined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.keywords])

  // Commit keywords array on blur (or you could add Enter-key commit if you want)
  const commitKeywords = () => {
    const list = (keywordsInput || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    set({ keywords: list })
  }

  const datePublishedValue = (meta.datePublished || '').slice(0, 10)

  return (
    <fieldset style={{ display: 'grid', gap: 10 }}>
      <legend>Metadata</legend>

      {/* Title */}
      <label style={{ display: 'grid', gap: 4 }}>
        <span>Title</span>
        <input
          placeholder="Untitled research document"
          value={meta.title || ''}
          onChange={(e) => set({ title: e.target.value })}
        />
      </label>

      {/* DOI */}
      <label style={{ display: 'grid', gap: 4 }}>
        <span>DOI</span>
        <input
          placeholder="e.g. 10.1234/pbo.2025.12"
          value={meta.doi || ''}
          onChange={(e) => set({ doi: e.target.value.trim() })}
        />
      </label>

      {/* Keywords (free text; parsed on blur) */}
      <label style={{ display: 'grid', gap: 4 }}>
        <span>Keywords</span>
        <input
          type="text"
          placeholder="e.g. budget, fiscal policy, expenditure"
          value={keywordsInput}
          onChange={(e) => setKeywordsInput(e.target.value)}
          onBlur={commitKeywords}
        />
        <small style={{ color: '#6b7280' }}>
          Separate with commas. Parsed on blur.
        </small>
      </label>

      {/* Language */}
      <label style={{ display: 'grid', gap: 4 }}>
        <span>Language</span>
        <input
          placeholder="en"
          value={meta.language || ''}
          onChange={(e) => set({ language: e.target.value })}
        />
      </label>

      {/* Status */}
      <label style={{ display: 'grid', gap: 4 }}>
        <span>Status</span>
        <select
          value={meta.status || 'draft'}
          onChange={(e) => set({ status: e.target.value })}
        >
          <option value="draft">draft</option>
          <option value="in_review">in review</option>
          <option value="published">published</option>
          <option value="archived">archived</option>
        </select>
      </label>

      {/* Date published */}
      <label style={{ display: 'grid', gap: 4 }}>
        <span>Date published</span>
        <input
          type="date"
          value={datePublishedValue}
          onChange={(e) => set({ datePublished: e.target.value || undefined })}
        />
      </label>

      {/* Version */}
      <label style={{ display: 'grid', gap: 4 }}>
        <span>Version</span>
        <input
          placeholder="e.g. 1.0.0 or 2025.10"
          value={meta.version || ''}
          onChange={(e) => set({ version: e.target.value.trim() })}
        />
      </label>

      {/* License */}
      <label style={{ display: 'grid', gap: 4 }}>
        <span>Licence</span>
        <select
          value={licenseIsCustom ? 'Custom…' : meta.license || ''}
          onChange={(e) => {
            const v = e.target.value
            if (v === 'Custom…') set({ license: '' })
            else set({ license: v })
          }}
        >
          <option value="">(none)</option>
          {LICENSES.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        {(meta.license === '' || licenseIsCustom) && (
          <input
            style={{ marginTop: 6 }}
            placeholder="Enter custom license text or URL"
            value={meta.license || ''}
            onChange={(e) => set({ license: e.target.value })}
          />
        )}
      </label>

      {/* Unit selector */}
      <label style={{ display: 'grid', gap: 4 }}>
        <span>Unit</span>
        <select
          value={meta.unit?.unitCode || ''}
          onChange={(e) => {
            const code = e.target.value
            const opt = IMPRINT_OPTIONS.find((o) => o.code === code)
            setUnit({
              unitCode: code,
              unit: opt ? opt.title : code,
              committeeCode: code === 'COM' ? (meta.unit?.committeeCode || '') : undefined,
            })
          }}
        >
          <option value="" disabled>Choose a unit…</option>
          {IMPRINT_OPTIONS.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.title}
            </option>
          ))}
        </select>
      </label>

      {/* Conditional: Committee code when Unit = Committees */}
      {isCommittees && (
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Committee code</span>
          <input
            placeholder="e.g. COM-FIN (free text for now)"
            value={meta.unit?.committeeCode || ''}
            onChange={(e) => setUnit({ committeeCode: e.target.value })}
          />
          <small style={{ color: '#6b7280' }}>
            Use your existing code format. We can switch to URIs later.
          </small>
        </label>
      )}
    </fieldset>
  )
}