// src/utils/download.js

let _anchor = null
function getAnchor() {
  if (_anchor && document.body.contains(_anchor)) return _anchor
  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = 'about:blank'
  a.download = 'download'
  document.body.appendChild(a)
  _anchor = a
  return a
}

/**
 * Reliable download helper for text/binary.
 * - Reuses one hidden <a>
 * - Assigns Blob URL, clicks, resets href, then revokes after a short delay
 */
export function downloadFile(content, filename, mime = 'application/octet-stream') {
  try {
    const a = getAnchor()
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)

    a.download = filename || 'download'
    a.href = 'about:blank'

    requestAnimationFrame(() => {
      a.href = url
      a.click()
      a.href = 'about:blank'
      setTimeout(() => URL.revokeObjectURL(url), 1200)
    })
  } catch (err) {
    console.error('downloadFile() failed', err)
    // Fallback to data URL for small text
    try {
      const text = typeof content === 'string' ? content : String(content)
      const a = getAnchor()
      a.download = filename || 'download'
      a.href = `data:${mime},${encodeURIComponent(text)}`
      a.click()
      a.href = 'about:blank'
    } catch (e) {
      console.error('downloadFile() data-URL fallback failed', e)
      alert('Download failed. See console for details.')
    }
  }
}