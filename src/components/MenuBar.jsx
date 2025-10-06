// src/components/MenuBar.jsx
import React from 'react'

function Btn({ onClick, disabled, active, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={active ? 'active' : ''}
      style={{ padding: '0.4rem 0.6rem', borderRadius: 8, border: '1px solid #7f6c2e', background: '#fff' }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span aria-hidden style={{ width: 1, height: 24, background: '#e5e7eb', margin: '0 8px' }} />
}

export default function MenuBar({ editor }) {
  if (!editor) return null

  const setHeading = (level) => editor.chain().focus().toggleHeading({ level }).run()

  return (
  <div className="menubar">
    {/* Undo / Redo */}
    <div className="menubar-group">
      <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">↶</Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">↷</Btn>
    </div>

    {/* Headings + lists + codeblock */}
    <div className="menubar-group">
      <select
        onChange={(e) => {
          const val = e.target.value
          if (val === 'p') editor.chain().focus().setParagraph().run()
          else editor.chain().focus().toggleHeading({ level: Number(val) }).run()
        }}
        value={
          editor.isActive('heading', { level: 1 }) ? '1' :
          editor.isActive('heading', { level: 2 }) ? '2' :
          editor.isActive('heading', { level: 3 }) ? '3' :
          editor.isActive('heading', { level: 4 }) ? '4' : 'p'
        }
        title="Heading level"
      >
        <option value="p">Paragraph</option>
        <option value="1">H1</option>
        <option value="2">H2</option>
        <option value="3">H3</option>
        <option value="4">H4</option>
      </select>

      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">• List</Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">1. List</Btn>
      <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">{'</>'}</Btn>
    </div>

    {/* Marks */}
    <div className="menubar-group">
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><span className="iconish">B</span></Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><span className="iconish">I</span></Btn>
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><span className="iconish">S</span></Btn>
      <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code"><span className="iconish">{'`</>`'}</span></Btn>
      <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><span className="iconish">U</span></Btn>
      <Btn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">✺</Btn>
      <Btn
        onClick={() => {
          const prev = editor.getAttributes('link')?.href || ''
          const url = window.prompt('Enter URL', prev)
          if (url === null) return
          if (url === '') return editor.chain().focus().unsetLink().run()
          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
        }}
        active={editor.isActive('link')}
        title="Link"
      >
        🔗
      </Btn>
    </div>

    {/* Super/Sub */}
    <div className="menubar-group">
      <Btn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript">x⁺</Btn>
      <Btn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript">x₋</Btn>
    </div>

    {/* Align */}
    <div className="menubar-group">
      <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()}    active={editor.isActive({ textAlign: 'left' })}    title="Align left">⟸</Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()}  active={editor.isActive({ textAlign: 'center' })}  title="Align center">⇔</Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()}   active={editor.isActive({ textAlign: 'right' })}   title="Align right">⟹</Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">≋</Btn>
    </div>
  </div>
)
}