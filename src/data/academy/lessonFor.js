import { CHAPTERS } from './book.js'

const WRITTEN = new Set(CHAPTERS.map((c) => c.slug))

/**
 * Every question in the app carries a free-form label — `topic` in the quiz
 * bank, `subtopic` in the practice bank. They were never written as a taxonomy
 * (there are 152 of them in the quiz bank alone), so we classify the label by
 * the words in it and see which chapter it belongs to.
 *
 * The rules are ordered most-specific first, and the first match wins. The
 * window/CTE rule therefore has to sit *above* aggregation, because those labels
 * contain words like `sum` and `count` that would otherwise win first and send
 * a `RANK` question to the chapter that does not teach it.
 */
const RULES = [
  {
    slug: 'ctes-windows',
    tokens: [
      'window', 'windows', 'partition', 'rank', 'row', 'rows', 'over', 'lag', 'lead',
      'cte', 'with', 'recursive', 'running', 'cumulative', 'dense',
    ],
  },
  {
    slug: 'modify-data',
    tokens: [
      'insert', 'update', 'delete', 'create', 'drop', 'alter', 'comment', 'comments',
      'transaction', 'transactions', 'commit', 'rollback', 'atomic',
      'constraint', 'constraints',
    ],
  },
  {
    slug: 'sorting-limiting',
    tokens: ['order', 'sort', 'limit', 'offset', 'desc', 'asc', 'clause', 'direction'],
  },
  {
    slug: 'joins',
    tokens: ['join', 'joins', 'inner', 'outer', 'self', 'anti'],
  },
  {
    slug: 'subqueries',
    tokens: ['subquery', 'subqueries', 'exists', 'correlated', 'scalar', 'nested', 'union'],
  },
  {
    slug: 'aggregation',
    tokens: [
      'group', 'having', 'aggregate', 'aggregates', 'count', 'sum', 'avg', 'min', 'max',
      'case', 'coalesce',
    ],
  },
  {
    slug: 'reading-data',
    tokens: ['select', 'column', 'alias', 'distinct', 'table', 'basic'],
  },
  {
    slug: 'filtering',
    tokens: [
      'where', 'and', 'or', 'not', 'null', 'like', 'between', 'in', 'comparison',
      'equality', 'inequality', 'operator', 'boundary', 'logical', 'condition', 'filter',
      'quoting', 'literal', 'wildcard', 'string',
    ],
  },
]

function slugForLabel(label) {
  const tokens = String(label).toLowerCase().match(/[a-z]+/g)
  if (!tokens) return null
  for (const rule of RULES) {
    if (rule.tokens.some((t) => tokens.includes(t))) return rule.slug
  }
  return null
}

/**
 * @returns the chapter slug to link to, or null when the question's real home
 *   is a chapter that has not been written yet.
 */
export function chapterSlugForQuestion(question) {
  if (!question) return null
  const slug = slugForLabel(question.subtopic) ?? slugForLabel(question.topic)
  return slug && WRITTEN.has(slug) ? slug : null
}
