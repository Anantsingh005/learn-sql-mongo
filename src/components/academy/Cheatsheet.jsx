import ResultTable from '../quiz/ResultTable.jsx'
import Console from './Console.jsx'

/**
 * The reference table at the end of a chapter.
 *
 * The cheat sheet is a two-column table — a plain-English description and the
 * SQL for it — and it renders inside a dark console where the whole right-hand
 * column is already monospace. So the `backticks` the chapter data wraps its SQL
 * in would print as literal characters, which is the same leak `Prose` exists
 * to prevent, just in a place `Prose` does not render. Only a *surrounding*
 * pair is removed: an inner pair like `` `MAX` within a sentence is left alone.
 */
function unwrap(row) {
  return row.map((cell) =>
    typeof cell === 'string' && cell.length > 2 && cell.startsWith('`') && cell.endsWith('`')
      ? cell.slice(1, -1)
      : cell,
  )
}

export default function Cheatsheet({ cheatsheet, accent = '#38bdf8' }) {
  if (!cheatsheet) return null

  return (
    <section className="mt-10">
      <div
        className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.3em]"
        style={{ color: accent }}
      >
        Reference
      </div>
      <h3 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">
        {cheatsheet.title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
        Keep this open next to you while you practise. It is the whole chapter, compressed.
      </p>

      <Console title="cheat sheet" className="mt-4" bodyClass="p-3">
        <ResultTable columns={cheatsheet.columns} rows={cheatsheet.rows.map(unwrap)} />
      </Console>
    </section>
  )
}
