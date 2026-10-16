const KEYWORDS = new Set([
  'select', 'from', 'where', 'group', 'by', 'having', 'order', 'limit', 'offset',
  'asc', 'desc', 'and', 'or', 'not', 'in', 'is', 'null', 'like', 'between',
  'exists', 'distinct', 'as', 'join', 'inner', 'left', 'right', 'outer', 'full',
  'cross', 'natural', 'on', 'using', 'union', 'all', 'with', 'recursive', 'case',
  'when', 'then', 'else', 'end', 'insert', 'into', 'values', 'update', 'set',
  'delete', 'create', 'table', 'drop', 'alter', 'index', 'view', 'primary', 'key',
  'foreign', 'references', 'default', 'unique', 'check', 'constraint',
  'transaction', 'commit', 'rollback', 'over', 'partition', 'window', 'rows',
  'range', 'preceding', 'following', 'unbounded', 'current', 'row', 'filter',
  'within', 'lateral', 'nulls', 'first', 'last', 'if', 'cascade', 'temporary',
])

const FUNCTIONS = new Set([
  'count', 'sum', 'avg', 'min', 'max', 'round', 'abs', 'length', 'lower', 'upper',
  'trim', 'ltrim', 'rtrim', 'substr', 'substring', 'replace', 'instr', 'coalesce',
  'ifnull', 'nullif', 'date', 'datetime', 'time', 'strftime', 'julianday',
  'cast', 'typeof', 'row_number', 'rank', 'dense_rank', 'lag', 'lead', 'ntile',
  'first_value', 'last_value', 'group_concat', 'printf', 'char', 'random',
  'iif', 'sign', 'sqrt', 'power', 'ceil', 'ceiling', 'floor', 'mod',
])

// Ordered: comments and strings first so their contents are never re-read as code.
const RULES = [
  ['comment', /--[^\n]*/y],
  ['comment', /\/\*[\s\S]*?\*\//y],
  ['string', /'(?:[^']|'')*'/y],
  ['number', /\b\d+(?:\.\d+)?\b/y],
  ['word', /[A-Za-z_][A-Za-z0-9_]*/y],
  ['space', /\s+/y],
  ['punct', /::|[(),;.*=<>!+\-/%|]+/y],
]

const CLASSES = {
  keyword: 'text-brand-700',
  function: 'text-brand-700',
  string: 'text-leaf-700',
  number: 'text-amber-700',
  comment: 'text-muted italic',
  punct: 'text-muted',
  name: 'text-body',
  text: 'text-body',
  space: 'text-body',
}

// Same token colours, retuned for a dark (ink) surface. Kept light enough to
// hold contrast on #2d0022 without leaving the brand/leaf/amber families.
const DARK_CLASSES = {
  keyword: 'text-brand-300',
  function: 'text-brand-200',
  string: 'text-leaf-200',
  number: 'text-amber-200',
  comment: 'text-paper/50 italic',
  punct: 'text-paper/60',
  name: 'text-paper',
  text: 'text-paper',
  space: 'text-paper',
}

// Whitespace is normally consumed but not emitted (the light surfaces lean on
// the surrounding markup for spacing). `keepWhitespace` emits it as tokens
// instead, so a caller that renders raw SQL — like the practice code card —
// gets its spaces back without changing any existing caller's output.
function tokenize(code, keepWhitespace = false) {
  const out = []
  let i = 0

  while (i < code.length) {
    let matched = false

    for (const [kind, re] of RULES) {
      re.lastIndex = i
      const m = re.exec(code)
      if (!m || m.index !== i) continue

      const text = m[0]
      if (kind === 'word') {
        const lower = text.toLowerCase()
        if (KEYWORDS.has(lower)) out.push({ kind: 'keyword', text })
        else if (FUNCTIONS.has(lower)) out.push({ kind: 'function', text })
        else out.push({ kind: 'name', text })
      } else if (kind !== 'space' || keepWhitespace) {
        out.push({ kind, text })
      }

      i += text.length
      matched = true
      break
    }

    if (!matched) {
      out.push({ kind: 'text', text: code[i] })
      i += 1
    }
  }

  return out
}

export default function SqlCode({ code, tone = 'light', keepWhitespace = false }) {
  const classes = tone === 'dark' ? DARK_CLASSES : CLASSES
  return (
    <code className="block">
      {tokenize(code, keepWhitespace).map((t, i) => (
        <span key={i} className={classes[t.kind]}>
          {t.text}
        </span>
      ))}
    </code>
  )
}
