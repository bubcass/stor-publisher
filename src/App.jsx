// src/App.jsx
import React, { useMemo, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import History from '@tiptap/extension-history'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import * as mammoth from 'mammoth/mammoth.browser'

import MenuBar from './components/MenuBar.jsx'
import Accordion from './components/Accordion.jsx'
import MetadataStatus from './components/MetadataStatus.jsx'
import MetadataForm from './components/MetadataForm.jsx'
import ContributorsEditor from './components/ContributorsEditor.jsx'

import { MetadataSchema } from './metadata/schema.js'
import { validateMetadata } from './metadata/validate.js'
import { unitFromCode } from './utils/imprint.js'
import { extractDocxMetadata } from './utils/extractDocxMetadata.js'
import { wrapHtml } from './serializers/htmlTemplate.js'
import { pmJsonToXml } from './serializers/toXml.js'
import { downloadFile } from './utils/download.js'

/** Prefer meta-aware XML, fall back for older serializer signatures */
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

/** Parse semicolon-separated contributors:
 * "Family, Given|role|unitOrCommitteeCode|email?|orcid?"
 */
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

      // name split
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
  // --- TipTap setup (v2) ---
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
      '<p>Welcome to the <strong>Stór Publisher</strong> document portal proof of concept.</p><p>The best way to get documents into <strong>Stór</strong> is by uploading Word documents from the correct template with appropriate metadata. Documents may also be edited within this online <strong>Stór Publisher</strong> platform.</p><p>Document data available as ProseMirror JSON (canonical source), HTML and XML.</p>',
  })

  // --- Metadata state (lenient defaults per schema) ---
  const [metadata, setMetadata] = useState(
    MetadataSchema.parse({
      title: 'Untitled research document',
      language: 'en',
      status: 'draft',
      version: '',
      keywords: [],
      contributors: [],
      // unit optional until set or imported
    }),
  )

  // --- Memoized validation to prevent input "bounce" ---
  const validation = useMemo(() => validateMetadata(metadata), [metadata])
  const canExport = validation.ok && validation.errors.length === 0

  // --- File input ref ---
  const fileInputRef = useRef(null)

  // --- Export: HTML (wrapped) ---
  const handleExportHTML = () => {
    if (!editor) return
    const body = editor.getHTML()
    const page = wrapHtml(body)
    downloadFile('document.html', page, 'text/html;charset=utf-8')
  }

  // --- Export: XML ---
  const handleExportXML = () => {
    if (!editor) return
    const json = editor.getJSON()
    const xml = buildXml(json, metadata)
    downloadFile('document.xml', xml, 'application/xml;charset=utf-8')
  }

  // --- Import: DOCX ---
  const handleDocxSelected = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const arrayBuffer = await file.arrayBuffer()

      // 1) Body -> HTML via Mammoth (browser build)
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
      editor?.chain().focus().setContent(result.value, true).run()

      // 2) Metadata extraction
      const { core, custom } = await extractDocxMetadata(arrayBuffer)

      // 3) Map to our canonical metadata (Unit instead of Imprint)
      const docUnitCode = (custom.ImprintCode || 'OTHER').toUpperCase()
      const unit = custom.ImprintCode
        ? { unitCode: docUnitCode, unit: unitFromCode(docUnitCode) }
        : undefined

      const mapped = {
        title: custom.Title || core.title || metadata.title || 'Untitled research document',
        subtitle: custom.Subtitle || metadata.subtitle,
        abstract: custom.Abstract || metadata.abstract,
        language: (custom.Language || core.language || metadata.language || 'en').trim(),
        status: (custom.Status || core.contentStatus || metadata.status || 'draft').toLowerCase(),
        version: custom.Version ?? metadata.version ?? '',
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
        unit, // renamed field
        contributors: parseContributors(custom.Contributors, unit?.unitCode, undefined),
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
      e.target.value = '' // allow re-selecting same file
    }
  }

  // --- Copy JSON helper ---
  const handleCopyJSON = async () => {
    if (!editor) return
    await navigator.clipboard.writeText(JSON.stringify(editor.getJSON(), null, 2))
  }

  // --- Live XML preview ---
  const xmlPreview = useMemo(() => {
    if (!editor) return ''
    try {
      return buildXml(editor.getJSON(), metadata)
    } catch (e) {
      return `<!-- XML preview error: ${e?.message || e} -->`
    }
  }, [editor, metadata])

  if (!editor) return <p style={{ padding: 12, fontFamily: 'system-ui' }}>Loading editor…</p>

  return (
    <div className="container">
      <h1>Stór | Publisher</h1>
      <h2 className="subtitle">Structured publishing proof of concept</h2>

      {/* Status pill */}
      <MetadataStatus report={validation} metadata={metadata} />

      {/* Metadata accordion */}
      <Accordion
  title="Metadata"
  defaultOpen={false}
  badge={validation.errors.length > 0 ? `Needs attention (${validation.errors.length})` : undefined}
>
  <MetadataForm value={metadata} onChange={setMetadata} />
  <ContributorsEditor
    value={metadata.contributors}
    unit={metadata.unit}
    onChange={(nextList) => setMetadata(m => ({ ...m, contributors: nextList }))}
  />
</Accordion>

      {/* Editor */}
      <div className="editor-shell">
        <MenuBar editor={editor} />
        <div className="content">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Actions: import left, export/copy right */}
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

      {/* Live outputs accordion */}
      <Accordion title="Live output (JSON, HTML & XML)" defaultOpen={false}>
        <div style={{ display: 'grid', gap: '12px' }}>
          <Accordion title="ProseMirror JSON (live)" defaultOpen={false}>
            <pre>{JSON.stringify(editor.getJSON(), null, 2)}</pre>
          </Accordion>
          <Accordion title="HTML (live)" defaultOpen={false}>
            <pre>{editor.getHTML()}</pre>
          </Accordion>
          <Accordion title="XML (live)" defaultOpen={false}>
            <pre>{xmlPreview}</pre>
          </Accordion>
        </div>
      </Accordion>
    </div>
  )
}