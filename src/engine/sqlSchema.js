function columnType(def, index) {
  for (const row of def.rows) {
    const value = row[index]
    if (typeof value === 'number') return Number.isInteger(value) ? 'INTEGER' : 'REAL'
  }
  return 'TEXT'
}

function serializeValue(value) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return String(value)
  return `'${String(value).replace(/'/g, "''")}'`
}

export function schemaToStatements(schema) {
  const statements = []
  for (const [table, def] of Object.entries(schema)) {
    const columns = def.columns
      .map((name, i) => `"${name}" ${columnType(def, i)}`)
      .join(', ')
    statements.push(`CREATE TABLE IF NOT EXISTS "${table}" (${columns});`)
    for (const row of def.rows) {
      const values = row.map(serializeValue).join(', ')
      statements.push(`INSERT INTO "${table}" VALUES (${values});`)
    }
  }
  return statements
}

export function runSchema(db, schema) {
  const statements = schemaToStatements(schema)
  for (const stmt of statements) db.run(stmt)
  return statements
}

export function tableNames(schema) {
  return Object.keys(schema)
}