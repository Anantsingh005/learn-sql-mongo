import { useId, useRef } from 'react'

function Glyph({ children, filled = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const DATABASES = [
  {
    key: 'sql',
    label: 'SQL',
    icon: (
      <Glyph>
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6" />
        <path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
      </Glyph>
    ),
  },
  {
    key: 'mongo',
    label: 'Mongo',
    soon: true,
    icon: (
      <Glyph>
        <path d="M11 20A7 7 0 0 1 4 13c0-6 7-9 16-10 0 9-3 16-9 17Z" />
        <path d="M4 21c3-6 6-9 11-11" />
      </Glyph>
    ),
  },
]

const MODES = [
  {
    key: 'mc',
    label: 'MC',
    full: 'Multiple Choice',
    icon: (
      <Glyph>
        <path d="m3 5 2 2 4-4" />
        <path d="M11 6h10" />
        <path d="m3 14 2 2 4-4" />
        <path d="M11 15h10" />
      </Glyph>
    ),
  },
  {
    key: 'write',
    label: 'Write',
    full: 'Write the Query',
    icon: (
      <Glyph>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </Glyph>
    ),
  },
  {
    key: 'bug',
    label: 'Fix Bug',
    full: 'Fix the Bug',
    icon: (
      <Glyph>
        <path d="M9 7.13v-1a3 3 0 1 1 6 0v1" />
        <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
        <path d="M12 20v-9" />
        <path d="M6 13H2" />
        <path d="M18 13h4" />
        <path d="M6.5 9C4.6 8.8 3 7.1 3 5" />
        <path d="M17.5 9c1.9-.2 3.5-1.9 3.5-4" />
      </Glyph>
    ),
  },
  {
    key: 'global',
    label: 'Global',
    full: 'Global · all modes & levels',
    icon: (
      <Glyph>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
      </Glyph>
    ),
  },
]

const LEVELS = [
  {
    key: 'easy',
    label: 'Easy',
    icon: (
      <Glyph>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <path d="M9 9h.01" />
        <path d="M15 9h.01" />
      </Glyph>
    ),
  },
  {
    key: 'medium',
    label: 'Medium',
    icon: (
      <Glyph>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 15h8" />
        <path d="M9 9h.01" />
        <path d="M15 9h.01" />
      </Glyph>
    ),
  },
  {
    key: 'hard',
    label: 'Hard',
    icon: (
      <Glyph>
        <path d="M12 22a7 7 0 0 0 7-7c0-4-3-5-3-9-3 1-4 3-4 5-1-1-1-2-1-3-2 1.5-6 4-6 7a7 7 0 0 0 7 7Z" />
      </Glyph>
    ),
  },
  {
    key: 'all',
    label: 'All Levels',
    icon: (
      <Glyph>
        <path d="m12 2 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5" />
        <path d="m3 17 9 5 9-5" />
      </Glyph>
    ),
  },
]

function RadioPills({ items, value, onSelect, labelledBy, disabled = false }) {
  const refs = useRef([])
  const selectedIndex = items.findIndex((i) => i.key === value)
  const focusIndex = selectedIndex === -1 ? 0 : selectedIndex

  function handleKeyDown(event, index) {
    let next = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = (index + 1) % items.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = (index - 1 + items.length) % items.length
    } else if (event.key === 'Home') {
      next = 0
    } else if (event.key === 'End') {
      next = items.length - 1
    }
    if (next === null) return
    event.preventDefault()
    onSelect(items[next].key)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-disabled={disabled || undefined}
      className={
        'flex gap-2.5 max-[699px]:snap-x max-[699px]:overflow-x-auto max-[699px]:pb-1 min-[700px]:flex-wrap min-[700px]:overflow-visible max-[699px]:[-webkit-mask-image:linear-gradient(to_right,transparent,#000_10px,#000_calc(100%-10px),transparent)] max-[699px]:[mask-image:linear-gradient(to_right,transparent,#000_10px,#000_calc(100%-10px),transparent)]' +
        (disabled ? ' opacity-70' : '')
      }
    >
      {items.map((item, index) => {
        const selected = value === item.key
        return (
          <button
            key={item.key}
            ref={(el) => {
              refs.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={item.full ?? item.label}
            title={item.full ?? item.label}
            tabIndex={disabled ? -1 : index === focusIndex ? 0 : -1}
            disabled={disabled}
            onClick={() => onSelect(item.key)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={
              'flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1 max-[699px]:snap-start ' +
              (selected
                ? 'bg-brand-600 text-white shadow-[0_2px_8px_rgba(140,21,104,0.28)]'
                : 'border border-line bg-white text-muted hover:border-brand-200 hover:text-body') +
              (disabled ? ' cursor-not-allowed opacity-60 hover:border-line hover:text-muted' : '')
            }
          >
            {item.icon}
            <span>{item.label}</span>
            {item.soon && (
              <span
                className={
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ' +
                  (selected ? 'bg-white/20 text-white' : 'bg-plum-100 text-plum-700')
                }
              >
                Soon
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function FilterGroup({ label, children }) {
  const id = useId()
  return (
    <div className="min-w-0 min-[1200px]:flex-1">
      <div id={id} className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
        {label}
      </div>
      {children(id)}
    </div>
  )
}

function GroupDivider() {
  return (
    <div
      aria-hidden="true"
      className="h-px w-full bg-line/70 min-[1200px]:mx-4 min-[1200px]:h-10 min-[1200px]:w-px"
    />
  )
}

export default function LeaderboardFilters({ db, mode, level, onChange }) {
  return (
    <section className="filter-bar" aria-labelledby="leaderboard-filters-heading">
      <h2 id="leaderboard-filters-heading" className="sr-only">Leaderboard filters</h2>
      <div className="relative overflow-hidden rounded-2xl border border-line/80 bg-gradient-to-br from-brand-50 via-white to-plum-50 p-4 shadow-[0_1px_3px_rgba(45,0,34,0.05)] sm:p-5">
        <div className="flex flex-col gap-3 min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:gap-0">
          <FilterGroup label="Database">
            {(id) => (
              <RadioPills
                items={DATABASES}
                value={db}
                labelledBy={id}
                onSelect={(key) => onChange({ db: key })}
              />
            )}
          </FilterGroup>

          <GroupDivider />

          <FilterGroup label="Mode">
            {(id) => (
              <RadioPills
                items={MODES}
                value={mode}
                labelledBy={id}
                onSelect={(key) => onChange({ mode: key })}
              />
            )}
          </FilterGroup>

          <GroupDivider />

          <FilterGroup label="Difficulty">
            {(id) => (
              <RadioPills
                items={LEVELS}
                value={level}
                labelledBy={id}
                onSelect={(key) => onChange({ level: key })}
                disabled={mode === 'global'}
              />
            )}
          </FilterGroup>
        </div>
      </div>
    </section>
  )
}
