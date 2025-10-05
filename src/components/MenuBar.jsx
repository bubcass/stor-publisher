// src/components/MenuBar.jsx
import React from 'react'

export default function MenuBar({ editor }) {
  if (!editor) return null

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
      {/* Text style group */}
      <div className="tb-group">
        <Btn
          title="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          disabled={!editor.can().chain().focus().toggleBold().run()}
        >
          <span className="tb-ic"><b>B</b></span>
        </Btn>
        <Btn
          title="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
        >
          <span className="tb-ic"><i>I</i></span>
        </Btn>
        <Btn
          title="Strike"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
        >
          <span className="tb-ic"><s>S</s></span>
        </Btn>
        <Btn
          title="Inline code"
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          disabled={!editor.can().chain().focus().toggleCode().run()}
        >
          <span className="tb-ic mono">{'</>'}</span>
        </Btn>
      </div>

      {/* Headings */}
      <div className="tb-group">
        <Btn
          title="Heading 1"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
        >
          H1
        </Btn>
        <Btn
          title="Heading 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
        >
          H2
        </Btn>
        <Btn
          title="Heading 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
        >
          H3
        </Btn>
        <Btn
          title="Paragraph"
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive('paragraph')}
        >
          ¶
        </Btn>
      </div>

      {/* Lists & Block */}
      <div className="tb-group">
        <Btn
          title="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
        >
          • • •
        </Btn>
        <Btn
          title="Ordered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
        >
          1·2·3
        </Btn>
        <Btn
          title="Blockquote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
        >
          “ ”
        </Btn>
        <Btn
          title="Code block"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
        >
          <span className="tb-ic mono">{'{ }'}</span>
        </Btn>
        <Btn
          title="Horizontal rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          ―
        </Btn>
      </div>

      {/* Undo/Redo */}
      <div className="tb-group">
        <Btn
          title="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
        >
          ⟲
        </Btn>
        <Btn
          title="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
        >
          ⟳
        </Btn>
      </div>
    </div>
  )
}