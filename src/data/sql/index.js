import { fixBug } from './fixBug.js'
import { multipleChoice } from './multipleChoice.js'
import { storeSchema } from './schemas.js'
import { windowCte } from './windowCte.js'
import { writeQuery } from './writeQuery.js'

export const sqlQuestionBank = {
  meta: {
    id: 'sql',
    title: 'SQL',
    description: 'Queries, joins, and aggregates against a small in-browser SQLite database.',
    schemas: { store: storeSchema },
  },
  types: {
    mc: multipleChoice,
    write: writeQuery,
    bug: fixBug,
  },
}

export const allSqlQuestions = [
  ...multipleChoice,
  ...writeQuery,
  ...fixBug,
  ...windowCte,
]

export default sqlQuestionBank