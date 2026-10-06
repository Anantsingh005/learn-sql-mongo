import { Inline } from './Prose.jsx'

const NOTE_CODE =
  'rounded bg-mist px-1.5 py-0.5 font-mono text-[0.82em] text-ink ring-1 ring-brand-200'

const TONES = {
  tip: {
    box: 'border-leaf-200 bg-leaf-100',
    bar: 'bg-leaf-100',
    title: 'text-leaf-700',
    body: 'text-leaf-700',
    icon: '✦',
  },
  warn: {
    box: 'border-amber-200 bg-amber-100',
    bar: 'bg-amber-50',
    title: 'text-amber-700',
    body: 'text-amber-800',
    icon: '!',
  },
  info: {
    box: 'border-brand-200 bg-brand-100',
    bar: 'bg-brand-100',
    title: 'text-brand-700',
    body: 'text-brand-700',
    icon: 'i',
  },
}

export default function Note({ tone = 'info', title, body }) {
  const t = TONES[tone] ?? TONES.info

  return (
    <aside className={`relative overflow-hidden rounded-lg border py-3 pl-4 pr-3.5 ${t.box}`}>
      <span className={`absolute inset-y-0 left-0 w-1 ${t.bar}`} aria-hidden="true" />
      <div className="flex items-baseline gap-2">
        <span className={`font-mono text-[11px] font-black ${t.title}`} aria-hidden="true">
          {t.icon}
        </span>
        <span className={`text-[13px] font-bold ${t.title}`}>{title}</span>
      </div>
      <p className={`mt-1 text-[13px] leading-relaxed ${t.body}`}>
        <Inline
          text={body}
          codeClass={NOTE_CODE}
          strongClass={`font-semibold ${t.title}`}
        />
      </p>
    </aside>
  )
}
