import { useState } from 'react'

function HintReveal({ hint }) {
  const [open, setOpen] = useState(false)
  if (!hint) return null

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:bg-slate-800"
      >
        {open ? 'Hide hint' : 'Show hint'}
      </button>
      {open && (
        <p className="mt-2 rounded-lg border border-sky-600/40 bg-sky-500/5 px-3 py-2 text-sm text-sky-200">
          {hint}
        </p>
      )}
    </div>
  )
}

export default HintReveal
