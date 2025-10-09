// src/utils/extractDocxMetadata.js
// Read DOCX core & custom properties in the browser (or Vite dev) and
// return a normalized { core, custom } object for mapping into your metadata.

import JSZip from 'jszip'

/* ------------------ small helpers ------------------ */
const text = (n) => (n && 'textContent' in n ? n.textContent : '') || ''

const toDateISO = (s) => {
  if (!s) return undefined
  // Word uses W3CDTF like "2025-10-05T14:22:33Z" or without Z
  const d = new Date(s)
  return isNaN(d.getTime()) ? undefined : d.toISOString()
}

const splitKeywords = (s) =>
  String(s || '')
    .split(/[,;]\s*|\s*\n+\s*/)
    .map((k) => k.trim())
    .filter(Boolean)

/** find first element by localName under doc */
function firstByLocalName(doc, localName) {
  if (!doc) return null
  const all = doc.getElementsByTagNameNS('*', localName)
  return all && all.length ? all[0] : null
}

/** get *all* elements by localName */
function allByLocalName(doc, localName) {
  if (!doc) return []
  return Array.from(doc.getElementsByTagNameNS('*', localName))
}

/* ------------------ parsers ------------------ */
function parseCoreXml(xml) {
  if (!xml) return {}
  const dom = new DOMParser().parseFromString(xml, 'application/xml')

  // Common core props (namespaced): dc:title, dc:creator, cp:contentStatus, cp:keywords, dcterms:created/modified
  const title = text(firstByLocalName(dom, 'title'))
  const subject = text(firstByLocalName(dom, 'subject'))
  const description = text(firstByLocalName(dom, 'description'))
  const creator = text(firstByLocalName(dom, 'creator'))   // primary author
  const lastModifiedBy = text(firstByLocalName(dom, 'lastModifiedBy'))
  const revision = text(firstByLocalName(dom, 'revision'))
  const category = text(firstByLocalName(dom, 'category'))
  const contentStatus = text(firstByLocalName(dom, 'contentStatus'))
  const language = text(firstByLocalName(dom, 'language')) // e.g., "en-IE"
  const keywordsRaw = text(firstByLocalName(dom, 'keywords'))

  const createdEl = firstByLocalName(dom, 'created')
  const modifiedEl = firstByLocalName(dom, 'modified')

  return {
    title: title || undefined,
    subject: subject || undefined,
    description: description || undefined,
    creator: creator || undefined,
    author: creator || undefined, // alias for convenience
    lastModifiedBy: lastModifiedBy || undefined,
    revision: revision || undefined,
    category: category || undefined,
    contentStatus: contentStatus || undefined,
    language: language || undefined,
    keywords: splitKeywords(keywordsRaw),

    // Dates (normalized to ISO strings)
    createdRaw: text(createdEl) || undefined,
    modifiedRaw: text(modifiedEl) || undefined,
    dateCreated: toDateISO(text(createdEl)),
    dateModified: toDateISO(text(modifiedEl)),
  }
}

function parseCustomXml(xml) {
  if (!xml) return {}
  const dom = new DOMParser().parseFromString(xml, 'application/xml')

  // Custom properties look like:
  // <property fmtid="..." pid="2" name="MyField">
  //   <vt:lpwstr>Value</vt:lpwstr>
  // </property>
  const props = allByLocalName(dom, 'property')

  const out = {}
  for (const p of props) {
    const name = p.getAttribute('name') || ''
    if (!name) continue
    // find the first child element (vt:*), capture its text
    let val = ''
    for (const child of Array.from(p.childNodes)) {
      if (child.nodeType === 1) {
        val = text(child)
        break
      }
    }
    out[name] = val
  }

  // Helpful normalizations if your templates use these names:
  // (No-op if they don't exist)
  if (out.DatePublished) out.DatePublished = toDateISO(out.DatePublished)
  if (out.DateModified) out.DateModified = toDateISO(out.DateModified)
  if (out.Language) out.Language = (out.Language || '').trim()
  if (out.Keywords) out.Keywords = splitKeywords(out.Keywords)

  return out
}

/* ------------------ main API ------------------ */
/**
 * Extract core & custom metadata from a DOCX ArrayBuffer.
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<{core: object, custom: object}>}
 */
export async function extractDocxMetadata(arrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer)

  // Some producers write only one of these; both are optional
  const coreXml = zip.file('docProps/core.xml')
    ? await zip.file('docProps/core.xml').async('string')
    : ''
  const customXml = zip.file('docProps/custom.xml')
    ? await zip.file('docProps/custom.xml').async('string')
    : ''

  const core = parseCoreXml(coreXml)
  const custom = parseCustomXml(customXml)

  return { core, custom }
}

/* Optional: tiny convenience for debugging in console
export async function debugPrintProps(file) {
  const buf = await file.arrayBuffer()
  const { core, custom } = await extractDocxMetadata(buf)
  console.log('CORE:', core)
  console.log('CUSTOM:', custom)
}
*/