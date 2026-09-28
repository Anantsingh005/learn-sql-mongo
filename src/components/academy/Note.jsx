import { Inline } from './Prose.jsx'

// The note backgrounds are tinted, so the code marks inside them get a neutral
// chip rather than the paper-background one `Prose` uses by default. `strong`
// borrows the tone's own heading colour so a bolded phrase still reads as part
// of the note rather than as body text.
const NOTE_CODE =
  'rounded bg-slate-900/[0.08] px-1.5 py-0.5 font-mono text-[0.82em] text-slate-900 ring-1 ring-slate-900/10'

const TONES = {
  tip: {
    box: 'border-emerald-600/25 bg-emerald-50/80',
    bar: 'bg-emerald-500',
    title: 'text-emerald-900',
    body: 'text-emerald-900/75',
    icon: '✦',
  },
  warn: {
    box: 'border-amber-600/30 bg-amber-50/80',
    bar: 'bg-amber-500',
    title: 'text-amber-900',
    body: 'text-amber-900/75',
    icon: '!',
  },
  info: {
    box: 'border-sky-600/25 bg-sky-50/80',
    bar: 'bg-sky-500',
    title: 'text-sky-900',
    body: 'text-sky-900/75',
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
