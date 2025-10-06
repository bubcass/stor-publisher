// src/serializers/toXml.js

// ---------- helpers ----------
const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

// inline text + marks
function textWithMarks(node) {
  if (!node) return ''
  if (node.type === 'text') {
    let txt = esc(node.text || '')
    if (Array.isArray(node.marks)) {
      for (const m of node.marks) {
        if (m.type === 'bold' || m.type === 'strong') txt = `<b>${txt}</b>`
        else if (m.type === 'italic' || m.type === 'em') txt = `<i>${txt}</i>`
        else if (m.type === 'code') txt = `<code>${txt}</code>`
        else if (m.type === 'link' && m.attrs?.href) {
          const href = esc(m.attrs.href)
          const title = m.attrs.title ? ` title="${esc(m.attrs.title)}"` : ''
          txt = `<a href="${href}"${title}>${txt}</a>`
        }
      }
    }
    return txt
  }
  if (Array.isArray(node.content)) {
    return node.content.map(textWithMarks).join('')
  }
  return ''
}

// block serializer
function serializeBlock(node) {
  const C = (node.content || []).map(serializeBlock).join('')
  switch (node.type) {
    case 'paragraph':
      return `<p>${textWithMarks(node)}</p>`

    case 'heading': {
      // If headings leak through (no custom Section extension), serialize as <section><title>…</title>
      const title = textWithMarks(node) || 'Untitled'
      return `<section><title>${title}</title></section>`
    }

    case 'blockquote':
      return `<blockquote>${C}</blockquote>`

    case 'bulletList':
      return `<list type="bullet">${C}</list>`

    case 'orderedList':
      return `<list type="ordered">${C}</list>`

    case 'listItem':
      return `<item>${C}</item>`

    case 'codeBlock': {
      const code = esc(node.textContent || '')
      return `<codeblock>${code}</codeblock>`
    }

    case 'horizontalRule':
      return `<hr/>`

    case 'hardBreak':
      return `<br/>`

    // If you later add custom nodes (section, figure, table…), add cases here.
    default:
      if (node.type === 'text') return textWithMarks(node)
      return C
  }
}

// ---------- metadata helpers ----------
function contributorsXml(list = []) {
  if (!list.length) return ''
  const items = list
    .map((c) => {
      const role = esc(c.role || 'contributor')
      const given = esc(c.given || '')
      const family = esc(c.family || '')
      const email = c.email ? `<email>${esc(c.email)}</email>` : ''
      const orcid = c.orcid ? `<orcid>${esc(c.orcid)}</orcid>` : ''
      const uri = c.uri ? `<uri>${esc(c.uri)}</uri>` : ''
      const corresponding = c.corresponding ? ` corresponding="true"` : ''

      let aff = ''
      if (c.affiliation) {
        const a = c.affiliation
        const attrs = []
        if (a.unitCode) attrs.push(`unitCode="${esc(a.unitCode)}"`)
        if (a.committeeCode) attrs.push(`committeeCode="${esc(a.committeeCode)}"`)
        if (a.unitUri) attrs.push(`unitUri="${esc(a.unitUri)}"`)
        if (a.committeeUri) attrs.push(`committeeUri="${esc(a.committeeUri)}"`)
        if (a.orgId) attrs.push(`orgId="${esc(a.orgId)}"`)
        const country = a.country ? `<country>${esc(a.country)}</country>` : ''
        const unitText = a.unit ? esc(a.unit) : ''
        aff = `<affiliation ${attrs.join(' ')}>
  <org>Houses of the Oireachtas</org>
  ${unitText ? `<unit>${unitText}</unit>` : ''}
  ${country}
</affiliation>`
      }

      return `<contrib role="${role}"${corresponding}>
  <name><given>${given}</given><family>${family}</family></name>
  ${aff}
  ${orcid}
  ${email}
  ${uri}
</contrib>`
    })
    .join('\n')

  return `<contributors>\n${items}\n</contributors>`
}

function keywordsXml(list = []) {
  if (!list.length) return ''
  return `<keywords>\n${list.map((k) => `  <keyword>${esc(k)}</keyword>`).join('\n')}\n</keywords>`
}

function relatedXml(list = []) {
  if (!list.length) return ''
  const items = list
    .map((r) => `<item relation="${esc(r.relation)}" uri="${esc(r.uri)}"/>`)
    .join('\n')
  return `<related>\n${items}\n</related>`
}

function dataLinksXml(list = []) {
  if (!list.length) return ''
  const items = list
    .map((d) => `<item label="${esc(d.label)}" uri="${esc(d.uri)}"/>`)
    .join('\n')
  return `<dataLinks>\n${items}\n</dataLinks>`
}

// ---------- main ----------
export function pmJsonToXml(docJson, meta = {}) {
  // Backward-compat: accept meta.imprint but prefer meta.unit
  const unitOrImprint = meta.unit || meta.imprint

  // sensible defaults so callers can omit meta during the transition
  const M = {
    schemaVersion: meta.schemaVersion || 'researchDocument@0.2',
    title: meta.title || 'Untitled',
    subtitle: meta.subtitle,
    abstract: meta.abstract,
    language: meta.language || 'en',
    status: meta.status || 'draft',

    // Defaults you requested
    version: meta.version && String(meta.version).trim() ? meta.version : '0.1',
    datePublished: meta.datePublished,
    dateModified: meta.dateModified,
    doi: meta.doi,
    series: meta.series, // {name, number}

    license:
      meta.license && String(meta.license).trim()
        ? meta.license
        : 'Oireachtas (Open Data) PSI Licence',

    keywords: meta.keywords || [],
    contributors: meta.contributors || [],
    related: meta.related || [],
    dataLinks: meta.dataLinks || [],
    publisher: meta.publisher || 'Houses of the Oireachtas',

    // renamed: use meta.unit going forward
    unit: unitOrImprint, // { unit, unitCode, committeeCode?, unitUri?, committeeUri? }
  }

  const body = (docJson?.content || []).map(serializeBlock).join('')

  // unit / publisher
  const unitStr = M.unit
    ? (() => {
        const attrs = []
        if (M.unit.unitCode) attrs.push(`unitCode="${esc(M.unit.unitCode)}"`)
        if (M.unit.committeeCode) attrs.push(`committeeCode="${esc(M.unit.committeeCode)}"`)
        if (M.unit.unitUri) attrs.push(`unitUri="${esc(M.unit.unitUri)}"`)
        if (M.unit.committeeUri) attrs.push(`committeeUri="${esc(M.unit.committeeUri)}"`)
        const label = M.unit.unit ? esc(M.unit.unit) : ''
        return `    <unit ${attrs.join(' ')}>${label}</unit>\n`
      })()
    : ''

  const seriesStr = M.series
    ? `    <series><name>${esc(M.series.name)}</name>${M.series.number ? `<number>${esc(M.series.number)}</number>` : ''}</series>\n`
    : ''

  const doiStr = M.doi ? `    <doi>${esc(M.doi)}</doi>\n` : ''
  const licenseStr = M.license ? `    <license>${esc(M.license)}</license>\n` : ''
  const subtitleStr = M.subtitle ? `    <subtitle>${esc(M.subtitle)}</subtitle>\n` : ''
  const abstractStr = M.abstract ? `    <abstract>${esc(M.abstract)}</abstract>\n` : ''
  const versionStr = M.version ? `    <version>${esc(M.version)}</version>\n` : ''
  const datePubStr = M.datePublished ? `    <datePublished>${esc(M.datePublished)}</datePublished>\n` : ''
  const dateModStr = M.dateModified ? `    <dateModified>${esc(M.dateModified)}</dateModified>\n` : ''
  const publisherStr = M.publisher ? `    <publisher>${esc(M.publisher)}</publisher>\n` : ''

  const keywordsStr = keywordsXml(M.keywords)
  const contributorsStr = contributorsXml(M.contributors)
  const relatedStr = relatedXml(M.related)
  const dataLinksStr = dataLinksXml(M.dataLinks)

  const metaXml =
`  <metadata>
    <title>${esc(M.title)}</title>
${subtitleStr}${abstractStr}    <status>${esc(M.status)}</status>
    <language>${esc(M.language)}</language>
${versionStr}${datePubStr}${dateModStr}${doiStr}${seriesStr}${licenseStr}${publisherStr}${unitStr}${keywordsStr ? '    ' + keywordsStr.replace(/\n/g, '\n    ') + '\n' : ''}${contributorsStr ? '    ' + contributorsStr.replace(/\n/g, '\n    ') + '\n' : ''}${relatedStr ? '    ' + relatedStr.replace(/\n/g, '\n    ') + '\n' : ''}${dataLinksStr ? '    ' + dataLinksStr.replace(/\n/g, '\n    ') + '\n' : ''}
  </metadata>`

  // final document
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
`<researchDocument version="${esc(M.schemaVersion.split('@')[1] || '0.2')}" xml:lang="${esc(M.language)}">\n` +
`${metaXml}\n` +
`  <body>\n${body}\n  </body>\n` +
`</researchDocument>`
}