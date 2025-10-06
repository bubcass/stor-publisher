// src/components/ContributorsEditor.jsx
import React from 'react'
import { IMPRINT_OPTIONS, IMPRINTS } from '../utils/imprint.js'

const ROLE_OPTIONS = [
  'author',
  'editor',
  'reviewer',
  'contributor',
]

export default function ContributorsEditor({ value = [], unit, onChange }) {
  const list = value

  const ensureAff = (c) => {
    const aff = c.affiliation || {}
    // default to document unit if none present
    const baseUnitCode = aff.unitCode || unit?.unitCode || 'OTHER'
    return {
      ...c,
      affiliation: {
        org: aff.org || 'Houses of the Oireachtas',
        unitCode: baseUnitCode,
        unit: aff.unit || IMPRINTS[baseUnitCode]?.title || baseUnitCode,
        committeeCode:
          (aff.unitCode || unit?.unitCode) === 'COM'
            ? (aff.committeeCode || unit?.committeeCode)
            : undefined,
        country: aff.country || 'IE',
      },
    }
  }

  const add = () => {
    const next = [
      ...list,
      ensureAff({ role: 'author', family: '', given: '', email: '', orcid: '' }),
    ]
    onChange(next)
  }

  const setAt = (i, patch) => {
    const next = [...list]
    next[i] = ensureAff({ ...next[i], ...patch })
    onChange(next)
  }

  const removeAt = (i) => onChange(list.filter((_, j) => j !== i))

  const setAff = (i, patch) => {
    const c = list[i] || {}
    const aff = { ...(c.affiliation || {}), ...patch }
    setAt(i, { affiliation: aff })
  }

  return (
    <fieldset style={{ display: 'grid', gap: 10 }}>
      <legend>Contributors</legend>

      <button type="button" onClick={add}>+ Add contributor</button>

      {list.length === 0 && (
        <p style={{ color: '#6b7280', margin: 0 }}>
          No contributors yet. Add at least one author.
        </p>
      )}

      {list.map((c, i) => {
        const isCOM = (c.affiliation?.unitCode || '').toUpperCase() === 'COM'
        return (
          <div
            key={i}
            style={{
              display: 'grid',
              gap: 6,
              gridTemplateColumns: '1fr 1fr 1fr 1.2fr 1fr auto',
              alignItems: 'center',
            }}
          >
            {/* Family, Given, Role */}
            <input
              placeholder="Family"
              value={c.family || ''}
              onChange={(e) => setAt(i, { family: e.target.value })}
            />
            <input
              placeholder="Given"
              value={c.given || ''}
              onChange={(e) => setAt(i, { given: e.target.value })}
            />
            <select
              value={c.role || 'author'}
              onChange={(e) => setAt(i, { role: e.target.value })}
              title="Role"
            >
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            {/* Email */}
            <input
              type="email"
              placeholder="email@oireachtas.ie"
              value={c.email || ''}
              onChange={(e) => setAt(i, { email: e.target.value.trim() })}
            />

            {/* ORCID (optional) */}
            <input
              placeholder="ORCID (optional)"
              value={c.orcid || ''}
              onChange={(e) => setAt(i, { orcid: e.target.value.trim() })}
              title="ORCID iD"
            />

            <button type="button" onClick={() => removeAt(i)}>Remove</button>

            {/* Affiliation row */}
            <div
              style={{
                gridColumn: '1 / -1',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                marginTop: 4,
              }}
            >
              {/* Unit select per contributor */}
              <label style={{ display: 'grid', gap: 4 }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Affiliation unit</span>
                <select
                  value={c.affiliation?.unitCode || unit?.unitCode || 'OTHER'}
                  onChange={(e) => {
                    const code = e.target.value
                    setAff(i, {
                      unitCode: code,
                      unit: IMPRINTS[code]?.title || code,
                      committeeCode: code === 'COM' ? (c.affiliation?.committeeCode || unit?.committeeCode || '') : undefined,
                    })
                  }}
                >
                  {IMPRINT_OPTIONS.map(opt => (
                    <option key={opt.code} value={opt.code}>{opt.title}</option>
                  ))}
                </select>
              </label>

              {/* Committee code when COM */}
              {isCOM && (
                <label style={{ display: 'grid', gap: 4 }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Committee code</span>
                  <input
                    placeholder="e.g. COM-FIN"
                    value={c.affiliation?.committeeCode || ''}
                    onChange={(e) => setAff(i, { committeeCode: e.target.value })}
                  />
                </label>
              )}
            </div>
          </div>
        )
      })}
    </fieldset>
  )
}