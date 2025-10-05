// src/components/ContributorsEditor.jsx
import React from 'react'
import { IMPRINTS } from '../utils/imprint.js'

const ROLE_OPTIONS = ['author','editor','reviewer','translator','contributor']
const IMPRINT_OPTIONS = Object.values(IMPRINTS)

export default function ContributorsEditor({ value = [], imprint, onChange }) {
  const contributors = value

  const up = (i, patch) => {
    const next = contributors.map((c, idx) => (idx === i ? { ...c, ...patch } : c))
    onChange(next)
  }
  const upAff = (i, patch) => {
    const baseAff = contributors[i]?.affiliation || imprintToAff(imprint)
    up(i, { affiliation: { ...baseAff, ...patch } })
  }

  const add = () => {
    const baseAff = imprintToAff(imprint)
    onChange([
      ...contributors,
      {
        role: 'author',
        given: '',
        family: '',
        email: '',
        orcid: '',
        affiliation: baseAff,
      },
    ])
  }
  const remove = (i) => onChange(contributors.filter((_, idx) => idx !== i))

  return (
    <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
      <legend style={{ padding: '0 6px' }}>Contributors</legend>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <small style={{ color: '#555' }}>
          Default affiliation comes from the document Imprint. You can override per person.
        </small>
        <button type="button" onClick={add} className="btn-small">+ Add contributor</button>
      </div>

      {contributors.length === 0 && (
        <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>No contributors yet.</div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {contributors.map((c, i) => (
          <div key={i} style={{ border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', gap: 8 }}>
              <label style={{ display: 'grid', gap: 4 }}>
                <span>Role</span>
                <select value={c.role} onChange={e => up(i, { role: e.target.value })}>
                  {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>

              <label style={{ display: 'grid', gap: 4 }}>
                <span>Given *</span>
                <input value={c.given || ''} onChange={e => up(i, { given: e.target.value })} />
              </label>

              <label style={{ display: 'grid', gap: 4 }}>
                <span>Family *</span>
                <input value={c.family || ''} onChange={e => up(i, { family: e.target.value })} />
              </label>

              <label style={{ display: 'grid', gap: 4 }}>
                <span>Email</span>
                <input value={c.email || ''} onChange={e => up(i, { email: e.target.value })} />
              </label>

              <label style={{ display: 'grid', gap: 4 }}>
                <span>ORCID (URL)</span>
                <input value={c.orcid || ''} onChange={e => up(i, { orcid: e.target.value })} />
              </label>

              <div style={{ display:'flex', alignItems:'end', justifyContent:'flex-end' }}>
                <button type="button" onClick={() => remove(i)} className="btn-small danger">Remove</button>
              </div>
            </div>

            {/* Affiliation override row */}
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <label style={{ display: 'grid', gap: 4 }}>
                <span>Affiliation unit</span>
                <select
                  value={c.affiliation?.unitCode || imprint?.unitCode || ''}
                  onChange={e => {
                    const unitCode = e.target.value
                    const unit = IMPRINTS[unitCode]?.title || unitCode
                    const patch = { unitCode, unit }
                    if (unitCode !== 'COM') patch.committeeCode = undefined
                    upAff(i, patch)
                  }}
                >
                  <option value="" disabled>Choose a unit…</option>
                  {IMPRINT_OPTIONS.map(opt => (
                    <option key={opt.code} value={opt.code}>{opt.title}</option>
                  ))}
                </select>
              </label>

              <label style={{ display: 'grid', gap: 4 }}>
                <span>Committee code {c.affiliation?.unitCode === 'COM' ? '(required for COM)' : '(optional)'}</span>
                <input
                  value={c.affiliation?.committeeCode || ''}
                  onChange={e => upAff(i, { committeeCode: e.target.value.trim() })}
                  disabled={c.affiliation?.unitCode !== 'COM'}
                  placeholder="COM-XXXX"
                />
              </label>

              <label style={{ display: 'grid', gap: 4 }}>
                <span>Country</span>
                <input
                  value={c.affiliation?.country || 'IE'}
                  onChange={e => upAff(i, { country: e.target.value.toUpperCase() })}
                  placeholder="IE"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .btn-small {
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          background: #fff;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
        }
        .btn-small:hover { background: #f9fafb; }
        .btn-small.danger { border-color: #fca5a5; color: #7f1d1d; }
        fieldset input, fieldset select {
          padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font: inherit;
        }
        fieldset input:focus, fieldset select:focus {
          outline: 3px solid #c7d2fe; outline-offset: 1px; border-color: #a5b4fc;
        }
      `}</style>
    </fieldset>
  )
}

function imprintToAff(imprint) {
  if (!imprint || !imprint.unitCode) return undefined
  return {
    org: 'Houses of the Oireachtas',
    unitCode: imprint.unitCode,
    unit: IMPRINTS[imprint.unitCode]?.title || imprint.unit || imprint.unitCode,
    committeeCode: imprint.unitCode === 'COM' ? imprint.committeeCode : undefined,
    country: 'IE',
  }
}