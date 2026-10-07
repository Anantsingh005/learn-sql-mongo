import { Inline } from './Prose.jsx'

const NOTE_CODE =
  'rounded bg-mist px-1.5 py-0.5 font-mono text-[0.82em] text-ink ring-1 ring-brand-200'

const TONES = {
  tip: {
    box: 'border-leaf-200 bg-leaf-100 shadow-[0_2px_12px_-8px_rgba(61,127,85,0.3)]',
    bar: 'bg-leaf-100',
    title: 'text-leaf-700',
    body: 'text-leaf-700',
    icon: '✦',
    chip: 'bg-white/70 text-leaf-700',
  },
  warn: {
    box: 'border-amber-200 bg-amber-100 shadow-[0_2px_12px_-8px_rgba(165,104,15,0.3)]',
    bar: 'bg-amber-50',
    title: 'text-amber-700',
    body: 'text-amber-800',
    icon: '!',
    chip: 'bg-white/70 text-amber-700',
  },
  info: {
    box: 'border-brand-200 bg-brand-100 shadow-[0_2px_12px_-8px_rgba(21,84,199,0.3)]',
    bar: 'bg-brand-100',
    title: 'text-brand-700',
    body: 'text-brand-700',
    icon: 'i',
    chip: 'bg-white/70 text-brand-700',
  },
}

export default function Note({ tone = 'info', title, body }) {
  const t = TONES[tone] ?? TONES.info

  return (
    <aside className={`relative overflow-hidden rounded-2xl border py-3.5 pl-4 pr-4 sm:py-4 sm:pl-5 ${t.box}`}>
      <span className={`absolute inset-y-0 left-0 w-1 ${t.bar}`} aria-hidden="true" />
      <div className="flex items-center gap-2">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-black ${t.chip}`}
          aria-hidden="true"
        >
          {t.icon}
        </span>
        <span className={`text-[13px] font-bold ${t.title}`}>{title}</span>
      </div>
      <p className={`mt-1.5 text-[13px] leading-relaxed ${t.body}`}>
        <Inline
          text={body}
          codeClass={NOTE_CODE}
          strongClass={`font-semibold ${t.title}`}
        />
      </p>
    </aside>
  )
}
