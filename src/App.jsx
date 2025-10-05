// src/App.jsx
import React, { useMemo, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import History from '@tiptap/extension-history'

// extra formatting/layout extensions (v2.x)
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'

import * as mammoth from 'mammoth/mammoth.browser'

// UI + utils
import MenuBar from './components/MenuBar.jsx'
import { wrapHtml } from './serializers/htmlTemplate.js'
import { pmJsonToXml } from './serializers/toXml.js'
import { downloadFile } from './utils/download.js'

// Metadata
import { MetadataSchema } from './metadata/schema.js'
import { unitFromCode } from './utils/imprint.js'
import { extractDocxMetadata } from './utils/extractDocxMetadata.js'
import { validateMetadata } from './metadata/validate.js'
import MetadataStatus from './components/MetadataStatus.jsx'
import MetadataForm from './components/MetadataForm.jsx'
import ContributorsEditor from './components/ContributorsEditor.jsx'
import Accordion from './components/Accordion.jsx'

function buildXml(docJson, meta) {
  try {
    return pmJsonToXml(docJson, meta)
  } catch (e) {
    try {
      return pmJsonToXml(docJson)
    } catch {
      throw e
    }
  }
}

function parseContributors(raw, fallbackUnitCode, fallbackCommitteeCode) {
  if (!raw) return []
  return raw
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .map(tok => {
      const [name, role = 'author', unitTok = '', email = '', orcid = ''] = tok
        .split('|')
        .map(t => t.trim())

      let given = '', family = name
      if (name.includes(',')) {
        const [fam, giv] = name.split(',').map(t => t.trim())
        family = fam
        given = giv
      } else if (name.includes(' ')) {
        const parts = name.split(' ')
        given = parts[0]
        family = parts.slice(1).join(' ')
      }

      const isCommitteeToken = unitTok?.toUpperCase?.().startsWith('COM-')
      const unitCode = isCommitteeToken
        ? 'COM'
        : (unitTok || fallbackUnitCode || 'OTHER').toUpperCase()
      const committeeCode = isCommitteeToken
        ? unitTok
        : unitCode === 'COM'
          ? (fallbackCommitteeCode || undefined)
          : undefined

      return {
        role: role.toLowerCase(),
        given,
        family,
        email: email || undefined,
        orcid: orcid || undefined,
        affiliation: {
          org: 'Houses of the Oireachtas',
          unitCode,
          unit: unitFromCode(unitCode),
          committeeCode,
          country: 'IE',
        },
      }
    })
}

export default function App() {
  const extensions = useMemo(
    () => [
      History.configure({ depth: 100, newGroupDelay: 500 }),
      StarterKit.configure({
        history: false,
        heading: { levels: [1, 2, 3, 4] },
      }),
      Placeholder.configure({ placeholder: 'Write something… or import a .docx' }),
      Underline,
      Highlight,
      Link.configure({
        autolink: true,
        openOnClick: true,
        linkOnPaste: true,
        protocols: ['http', 'https', 'mailto'],
      }),
      Superscript,
      Subscript,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false }),
    ],
    [],
  )

  const editor = useEditor({
    extensions,
    content:
      '<p>Welcome to your Tiptap POC.</p><p>Try typing, then export to HTML/XML, or import a .docx.</p>',
  })

  const [metadata, setMetadata] = useState(
    MetadataSchema.parse({
      title: 'Untitled',
      language: 'en',
      status: 'draft',
      keywords: [],
      contributors: [],
    }),
  )

  const validation = validateMetadata(metadata)
  const canExport = validation.ok && validation.errors.length === 0
  const fileInputRef = useRef(null)

  const handleExportHTML = () => {
    if (!editor) return
    const body = editor.getHTML()
    const page = wrapHtml(body)
    downloadFile('document.html', page, 'text/html;charset=utf-8')
  }

  const handleExportXML = () => {
    if (!editor) return
    const json = editor.getJSON()
    const xml = buildXml(json, metadata)
    downloadFile('document.xml', xml, 'application/xml;charset=utf-8')
  }

  const handleDocxSelected = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          styleMap: [
            "p[style-name='Title'] => h1",
            "p[style-name='Heading 1'] => h1",
            "p[style-name='Heading 2'] => h2",
            "p[style-name='Heading 3'] => h3",
            "p[style-name='Heading 4'] => h4",
          ],
          includeDefaultStyleMap: true,
        },
      )
      editor.chain().focus().setContent(result.value, true).run()

      const { core, custom } = await extractDocxMetadata(arrayBuffer)
      const docImprintCode = (custom.ImprintCode || 'OTHER').toUpperCase()
      const imprint = custom.ImprintCode
        ? { unitCode: docImprintCode, unit: unitFromCode(docImprintCode) }
        : undefined

      const mapped = {
        title: custom.Title || core.title || metadata.title || 'Untitled',
        subtitle: custom.Subtitle || metadata.subtitle,
        abstract: custom.Abstract || metadata.abstract,
        language: (custom.Language || core.language || metadata.language || 'en').trim(),
        status: (custom.Status || core.contentStatus || metadata.status || 'draft').toLowerCase(),
        version: custom.Version || metadata.version,
        datePublished: custom.DatePublished || core.dateCreated || metadata.datePublished,
        dateModified: core.dateModified || metadata.dateModified,
        doi: custom.DOI || metadata.doi,
        license: custom.License || metadata.license,
        keywords: (custom.Keywords || core.keywords || metadata.keywords || [])
          .toString()
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        publisher: 'Houses of the Oireachtas',
        imprint,
        contributors: parseContributors(custom.Contributors, imprint?.unitCode, undefined),
      }

      try {
        setMetadata(MetadataSchema.parse({ ...metadata, ...mapped }))
      } catch {
        setMetadata(prev => ({ ...prev, ...mapped }))
      }
    } catch (err) {
      console.error(err)
      alert('Failed to import .docx: ' + (err?.message || String(err)))
    } finally {
      e.target.value = ''
    }
  }

  const handleCopyJSON = async () => {
    if (!editor) return
    await navigator.clipboard.writeText(JSON.stringify(editor.getJSON(), null, 2))
  }

  const xmlPreview = (() => {
    if (!editor) return ''
    try {
      return buildXml(editor.getJSON(), metadata)
    } catch (e) {
      return `<!-- XML preview error: ${e?.message || e} -->`
    }
  })()

  if (!editor) return <p style={{ padding: 12, fontFamily: 'system-ui' }}>Loading editor…</p>

  return (
    <div className="container">
      <h1>Stór Publisher</h1>

      <MetadataStatus report={validation} metadata={metadata} />

      <Accordion
        title="Metadata"
        defaultOpen={validation.errors.length > 0}
        badge={validation.errors.length > 0 ? `Needs attention (${validation.errors.length})` : undefined}
      >
        <MetadataForm value={metadata} onChange={setMetadata} />
        <ContributorsEditor
          value={metadata.contributors}
          imprint={metadata.imprint}
          onChange={(nextList) => setMetadata(m => ({ ...m, contributors: nextList }))}
        />
      </Accordion>

      <div className="editor-shell">
        <MenuBar editor={editor} />
        <div className="content">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Actions bar: left = import, right = export/copy */}
      <div className="actions">
        <div className="actions-left">
          <label className="file-label">
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx"
              onChange={handleDocxSelected}
              style={{ display: 'none' }}
            />
            Import .docx
          </label>
        </div>

        <div className="actions-right">
          <button onClick={handleExportHTML}>Export HTML</button>
          <button
            onClick={handleExportXML}
            disabled={!canExport}
            title={!canExport ? 'Fix required metadata first' : 'Export XML'}
          >
            Export XML
          </button>
          <button onClick={handleCopyJSON}>Copy JSON</button>
        </div>
      </div>

      {/* Live output accordion with JSON, HTML, and XML previews */}
      <Accordion title="Live output (JSON, HTML, XML)" defaultOpen={false}>
        <div style={{ display: 'grid', gap: '12px' }}>
          <Accordion title="ProseMirror JSON (canonical)" defaultOpen={false}>
            <pre>{JSON.stringify(editor.getJSON(), null, 2)}</pre>
          </Accordion>

          <Accordion title="HTML" defaultOpen={false}>
            <pre>{editor.getHTML()}</pre>
          </Accordion>

          <Accordion title="XML" defaultOpen={false}>
            <pre>{xmlPreview}</pre>
          </Accordion>
        </div>
      </Accordion>
    </div>
  )
}