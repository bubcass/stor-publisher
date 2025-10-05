// src/utils/extractDocxMetadata.js
import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' })

export async function extractDocxMetadata(arrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer)

  let core = {}
  if (zip.files['docProps/core.xml']) {
    const xml = await zip.files['docProps/core.xml'].async('string')
    const x = parser.parse(xml)['cp:coreProperties'] || {}
    core = {
      title: x['dc:title'] || '',
      subject: x['dc:subject'] || '',
      creator: x['dc:creator'] || '',
      keywords: (x['cp:keywords'] || '').split(',').map(s => s.trim()).filter(Boolean),
      contentStatus: x['cp:contentStatus'] || '',
      language: x['dc:language'] || '',
      dateCreated: x['dcterms:created']?.['#text'] || x['dcterms:created'] || '',
      dateModified: x['dcterms:modified']?.['#text'] || x['dcterms:modified'] || '',
    }
  }

  let custom = {}
  if (zip.files['docProps/custom.xml']) {
    const xml = await zip.files['docProps/custom.xml'].async('string')
    const x = parser.parse(xml)
    const props = x?.Properties?.property || []
    const arr = Array.isArray(props) ? props : [props]
    for (const p of arr) {
      const name = p?.name
      const val = Object.entries(p || {}).find(([k]) => k.startsWith('vt:'))?.[1] ?? ''
      if (name) custom[name] = typeof val === 'object' && '#text' in val ? val['#text'] : String(val)
    }
  }

  return { core, custom }
}