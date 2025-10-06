// src/utils/imprint.js

/**
 * Units (formerly "Imprints") within the Houses of the Oireachtas that can publish.
 * Each entry includes a stable code and display title.
 */

export const IMPRINTS = {
  PBO: {
    code: 'PBO',
    title: 'Parliamentary Budget Office',
  },
  LIB: {
    code: 'LIB',
    title: 'Library and Research Service',
  },
  COM: {
    code: 'COM',
    title: 'Committees',
  },
  COMMS: {
    code: 'COMMS',
    title: 'Communications',
  },
  COMMISSION: {
    code: 'COMMISSION',
    title: 'Houses of the Oireachtas Commission',
  },
  OTHER: {
    code: 'OTHER',
    title: 'Other',
  },
}

/**
 * Convenience array for dropdowns.
 * Example: [{ code: 'PBO', title: 'Parliamentary Budget Office' }, ...]
 */
export const IMPRINT_OPTIONS = Object.values(IMPRINTS)

/**
 * Given a code like "PBO", returns its display name.
 * Falls back to the code itself if not found.
 */
export function unitFromCode(code) {
  if (!code) return 'Unknown'
  const c = code.toUpperCase()
  return IMPRINTS[c]?.title || c
}