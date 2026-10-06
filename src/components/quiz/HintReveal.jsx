import { useState } from 'react'

function HintReveal({ hint }) {
  const [open, setOpen] = useState(false)
  if (!hint) return null

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg border border-line bg-line/60 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-line hover:bg-line"
      >
        {open ? 'Hide hint' : 'Show hint'}
      </button>
      {open && (
        <p className="mt-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700">
          {hint}
        </p>
      )}
    </div>
  )
}

export default HintReveal
