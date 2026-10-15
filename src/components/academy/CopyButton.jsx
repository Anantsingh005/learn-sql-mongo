import { useEffect, useRef, useState } from 'react'
import { CheckIcon, CopyIcon } from './BlockIcons.jsx'

// Copies a code block's text and shows a short "Copied" confirmation. Falls
// back to a hidden textarea + execCommand when the async Clipboard API is
// unavailable (older browsers / insecure contexts). Purely an affordance — the
// block still computes nothing.

export default function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const area = document.createElement('textarea')
        area.value = text
        area.setAttribute('readonly', '')
        area.style.position = 'fixed'
        area.style.top = '-1000px'
        area.style.opacity = '0'
        document.body.appendChild(area)
        area.select()
        document.execCommand('copy')
        document.body.removeChild(area)
      }
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1600)
    } catch {
      // Copy can fail if the document is not focused; leave the button as-is.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
      className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
        copied
          ? 'border-leaf-200 bg-leaf-50 text-leaf-700'
          : 'border-line bg-white text-muted hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700'
      } ${className}`}
    >
      {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}
