import { Inline } from './Prose.jsx'
import { BulbIcon, InfoIcon, WarnIcon } from './BlockIcons.jsx'

// The Tip box: a note from the data. Tips and info notes share the soft
// lavender treatment (lightbulb / info icon); warnings keep an amber treatment.

const NOTE_CODE =
  'rounded bg-white px-1.5 py-0.5 font-mono text-[0.82em] text-ink ring-1 ring-plum-200'

const TONES = {
  tip: {
    box: 'border-plum-200 bg-plum-50',
    chip: 'bg-plum-100 text-plum-700',
    title: 'text-plum-700',
    body: 'text-plum-700/90',
    Glyph: BulbIcon,
  },
  info: {
    box: 'border-plum-200 bg-plum-50',
    chip: 'bg-plum-100 text-plum-700',
    title: 'text-plum-700',
    body: 'text-plum-700/90',
    Glyph: InfoIcon,
  },
  warn: {
    box: 'border-amber-200 bg-amber-50',
    chip: 'bg-amber-100 text-amber-700',
    title: 'text-amber-700',
    body: 'text-amber-900/90',
    Glyph: WarnIcon,
  },
}

export default function Note({ tone = 'info', title, body }) {
  const t = TONES[tone] ?? TONES.info
  const Glyph = t.Glyph

  return (
    <aside className={`flex gap-3 rounded-2xl border p-4 ${t.box}`}>
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${t.chip}`}
        aria-hidden="true"
      >
        <Glyph className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        {title && <div className={`text-[14px] font-bold ${t.title}`}>{title}</div>}
        <p className={`mt-0.5 max-w-[70ch] text-[16px] leading-[1.7] ${t.body}`}>
          <Inline
            text={body}
            codeClass={NOTE_CODE}
            strongClass={`font-semibold ${t.title}`}
          />
        </p>
      </div>
    </aside>
  )
}
