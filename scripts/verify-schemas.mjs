import initSqlJs from 'sql.js'
import { allSqlQuestions, sqlQuestionBank } from '../src/data/sql/index.js'
import { storeSchema } from '../src/data/sql/schemas.js'

const sql = await initSqlJs()

function buildSchema(db, schema) {
  for (const [table, def] of Object.entries(schema)) {
    const cols = def.columns.join(', ')
    db.run(`CREATE TABLE ${table} (${cols});`)
    for (const row of def.rows) {
      const values = row.map((v) => (typeof v === 'number' ? v : `'${v}'`)).join(', ')
      db.run(`INSERT INTO ${table} VALUES (${values});`)
    }
  }
}

async function main() {
  let failures = 0

  for (const q of allSqlQuestions) {
    const db = new sql.Database()
    try {
      const schema = q.schema === 'store' ? storeSchema : q.schema
      if (!schema) { console.log(`skip ${q.id}: no schema`); continue }
      buildSchema(db, schema)
      console.log(`OK ${q.id} [${q.type}] schema + seed OK (${q.topic})`)
    } catch (e) {
      failures++
      console.log(`FAIL ${q.id} [${q.type}] SCHEMA ERROR: ${e.message}`)
    } finally {
      db.close()
    }
  }

  for (const q of sqlQuestionBank.types.mc) {
    if (q.schema === 'store') {
      const db = new sql.Database()
      try {
        buildSchema(db, storeSchema)
        console.log(`OK ${q.id} [mc] store schema loads`)
      } catch (e) {
        failures++
        console.log(`FAIL ${q.id} [mc] schema error: ${e.message}`)
      } finally {
        db.close()
      }
    }
  }

  console.log(failures === 0 ? '\nALL SCHEMAS VALID' : `\n${failures} FAILURES`)
}

main()