// src/components/MenuBar.jsx
import React, { useRef } from 'react'

export default function MenuBar({ editor }) {
  const fileInputRef = useRef(null)
  if (!editor) return null

  const divider = <span className="tb-divider" aria-hidden="true"></span>

  const setHeading = (level) => {
    if (level === 0) {
      editor.chain().focus().setParagraph().run()
    } else {
      editor.chain().focus().toggleHeading({ level }).run()
    }
  }

  const setList = (type) => {
    const chain = editor.chain().focus()
    if (type === 'bullet') chain.toggleBulletList().run()
    if (type === 'ordered') chain.toggleOrderedList().run()
    if (type === 'none') {
      // Remove list nodes if active
      if (editor.isActive('bulletList')) chain.toggleBulletList().run()
      if (editor.isActive('orderedList')) chain.toggleOrderedList().run()
    }
  }

  const promptLink = () => {
    const prev = editor.getAttributes('link')?.href || ''
    const url = window.prompt('Enter URL', prev)
    if (url === null) return // cancel
    if (url.trim() === '') {
      editor.chain().focus().unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  const addImageByUrl = () => {
    const url = window.prompt('Image URL')
    if (!url) return
    editor.chain().focus().setImage({ src: url }).run()
  }

  const addImageFromFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      editor.chain().focus().setImage({ src: reader.result }).run()
    }
    reader.readAsDataURL(f)
    e.target.value = '' // allow reselecting same file
  }

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
  }

  const Btn = ({ onClick, active, disabled, title, children }) => (
    <button
      type="button"
      className={`tb-btn${active ? ' active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  )

  return (
    <div className="toolbar">
      {/* Left cluster */}
      <div className="tb-group">
        <Btn
          title="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          ⟲
        </Btn>
        <Btn
          title="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          ⟳
        </Btn>
      </div>

      {divider}

      {/* Heading dropdown */}
      <div className="tb-group">
        <select
          className="tb-select"
          title="Heading level"
          value={
            editor.isActive('heading', { level: 1 }) ? 'h1' :
            editor.isActive('heading', { level: 2 }) ? 'h2' :
            editor.isActive('heading', { level: 3 }) ? 'h3' :
            editor.isActive('heading', { level: 4 }) ? 'h4' : 'p'
          }
          onChange={(e) => {
            const v = e.target.value
            if (v === 'p') setHeading(0)
            else setHeading(Number(v.replace('h', '')))
          }}
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>
      </div>

      {/* Lists dropdown + codeblock */}
      <div className="tb-group">
        <select
          className="tb-select"
          title="List type"
          value={
            editor.isActive('bulletList') ? 'bullet' :
            editor.isActive('orderedList') ? 'ordered' : 'none'
          }
          onChange={(e) => setList(e.target.value)}
        >
          <option value="none">No list</option>
          <option value="bullet">• Bulleted</option>
          <option value="ordered">1. Ordered</option>
        </select>
        <Btn
          title="Code block"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
        >
          <span className="tb-ic mono">{'{ }'}</span>
        </Btn>
      </div>

      {divider}

      {/* Marks: bold italic strike code underline highlight link */}
      <div className="tb-group">
        <Btn
          title="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          disabled={!editor.can().toggleBold()}
        >
          <b>B</b>
        </Btn>
        <Btn
          title="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          disabled={!editor.can().toggleItalic()}
        >
          <i>I</i>
        </Btn>
        <Btn
          title="Strikethrough"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          disabled={!editor.can().toggleStrike()}
        >
          <s>S</s>
        </Btn>
        <Btn
          title="Inline code"
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          disabled={!editor.can().toggleCode()}
        >
          <span className="tb-ic mono">{'</>'}</span>
        </Btn>
        <Btn
          title="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
        >
          <u>U</u>
        </Btn>
        <Btn
          title="Highlight"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')}
        >
          ✺
        </Btn>
        <Btn
          title={editor.isActive('link') ? 'Edit / remove link' : 'Add link'}
          onClick={promptLink}
          active={editor.isActive('link')}
        >
          🔗
        </Btn>
      </div>

      {divider}

      {/* Super/Sub */}
      <div className="tb-group">
        <Btn
          title="Superscript"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          active={editor.isActive('superscript')}
        >
          x<sup>2</sup>
        </Btn>
        <Btn
          title="Subscript"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          active={editor.isActive('subscript')}
        >
          x<sub>2</sub>
        </Btn>
      </div>

      {divider}

      {/* Align */}
      <div className="tb-group">
        <Btn
          title="Align left"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
        >
          ⬅︎
        </Btn>
        <Btn
          title="Align centre"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
        >
          ⬌
        </Btn>
        <Btn
          title="Align right"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
        >
          ➡︎
        </Btn>
        <Btn
          title="Justify"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          active={editor.isActive({ textAlign: 'justify' })}
        >
          ═
        </Btn>
      </div>

      {divider}

      {/* Image + file input */}
      <div className="tb-group">
        <Btn title="Add image (URL)" onClick={addImageByUrl}>🖼️ URL</Btn>
        <button
          type="button"
          className="tb-btn"
          title="Add image (file)"
          onClick={() => fileInputRef.current?.click()}
        >
          🖼️ File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={addImageFromFile}
        />
      </div>

      {/* Spacer pushes theme toggle to the right */}
      <div style={{ flex: 1 }} />

      {/* Theme toggle */}
      <div className="tb-group">
        <Btn title="Toggle light/dark" onClick={toggleTheme}>☀︎/☾</Btn>
      </div>
    </div>
  )
}