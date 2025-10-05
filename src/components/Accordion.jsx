// src/components/Accordion.jsx
import React from 'react'

export default function Accordion({ title, defaultOpen = false, children, badge }) {
  const [open, setOpen] = React.useState(!!defaultOpen)
  React.useEffect(() => { setOpen(!!defaultOpen) }, [defaultOpen])

  return (
    <div className="acc">
      <button
        type="button"
        className="acc-summary"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span className={`chev ${open ? 'down' : 'right'}`} aria-hidden>▸</span>
        <span className="acc-title">{title}</span>
        {badge ? <span className="acc-badge">{badge}</span> : null}
      </button>
      {open && <div className="acc-panel">{children}</div>}
    </div>
  )
}