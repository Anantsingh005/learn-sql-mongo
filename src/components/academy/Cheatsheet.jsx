import ResultTable from '../quiz/ResultTable.jsx'
import Console from './Console.jsx'
import Reveal from './Reveal.jsx'

function unwrap(row) {
  return row.map((cell) =>
    typeof cell === 'string' && cell.length > 2 && cell.startsWith('`') && cell.endsWith('`')
      ? cell.slice(1, -1)
      : cell,
  )
}

export default function Cheatsheet({ cheatsheet, accent = '#1554c7', ink = accent }) {
  if (!cheatsheet) return null

  return (
    <Reveal as="section" delay={0} className="mt-10">
      <div
        className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.3em]"
        style={{ color: ink }}
      >
        Reference
      </div>
      <h3 className="font-serif text-xl font-semibold tracking-tight text-ink sm:text-2xl">
        {cheatsheet.title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-body">
        Keep this open next to you while you practise. It is the whole chapter, compressed.
      </p>

      <Console title="cheat sheet" className="mt-4" bodyClass="p-3">
        <ResultTable columns={cheatsheet.columns} rows={cheatsheet.rows.map(unwrap)} />
      </Console>
    </Reveal>
  )
}
