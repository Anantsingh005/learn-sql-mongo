import { storeSchema } from '../data/sql/schemas.js'
import checkAnswer from './AnswerChecker.js'

const sharedSchemas = { store: storeSchema }

export function resolveSchema(schema) {
  if (typeof schema === 'string') return sharedSchemas[schema]
  if (schema && typeof schema === 'object') return schema
  return null
}

export function buildCheckQuery(QueryRunner) {
  return async function checkQuery(question, sql) {
    await QueryRunner.setup(question.schema)
    const actual = await QueryRunner.run(sql)
    const result = checkAnswer(actual, question.expected, {
      orderMatters: question.expected.orderMatters ?? false,
      ignoreColumnOrder: true,
    })
    return { ...result, actual }
  }
}