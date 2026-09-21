import initSqlJs from 'sql.js'
import { allSqlQuestions } from '../src/data/sql/index.js'
import { storeSchema } from '../src/data/sql/schemas.js'

const sql = await initSqlJs()

const storeQueries = {
  'mc-03': "SELECT COUNT(*) FROM orders WHERE customer_id = 1",
  'mc-07': "SELECT SUM(price) FROM products",
  'mc-09': "SELECT city, COUNT(*) FROM customers GROUP BY city",
  'mc-11': "SELECT orders.id, products.name FROM orders INNER JOIN products ON orders.product_id = products.id",
}

const reference = {
  'write-01': 'SELECT name, salary FROM employees WHERE salary > 60000',
  'write-02': 'SELECT DISTINCT dept FROM employees',
  'write-03': 'SELECT name FROM products ORDER BY price ASC LIMIT 3',
  'write-04': 'SELECT customer, SUM(amount) AS total FROM orders GROUP BY customer',
  'write-05': 'SELECT students.name, scores.subject, scores.grade FROM students JOIN scores ON students.id = scores.student_id',
  'write-06': 'SELECT student, COUNT(*) AS courses FROM enrollments GROUP BY student HAVING COUNT(*) >= 2',
  'write-07': 'SELECT a.name, COUNT(b.id) FROM authors a LEFT JOIN books b ON a.id = b.author_id GROUP BY a.name',
  'write-08': 'SELECT name, price FROM products WHERE price = (SELECT MAX(price) FROM products)',
  'write-09': 'SELECT p.category, SUM(p.price * s.qty) AS revenue FROM products p JOIN sales s ON p.id = s.product_id GROUP BY p.category',
  'bug-01': 'SELECT * FROM employees ORDER BY name LIMIT 5',
  'bug-02': "SELECT * FROM customers WHERE city = 'London'",
  'bug-03': 'SELECT name, stock FROM products WHERE stock < 30',
  'bug-04': 'SELECT customers.name, orders.total FROM customers JOIN orders ON customers.id = orders.customer_id',
  'bug-05': 'SELECT category, COUNT(*) FROM products GROUP BY category',
  'bug-06': 'SELECT users.name, posts.title FROM users JOIN posts ON users.id = posts.user_id',
  'bug-07': 'SELECT category, COUNT(*) FROM products GROUP BY category HAVING COUNT(*) > 1',
  'bug-08': 'SELECT name, price FROM products WHERE price >= 100',
}

function buildSchema(db, schema) {
  for (const [table, def] of Object.entries(schema)) {
    const cols = def.columns.join(', ')
    db.run(`CREATE TABLE ${table} (${cols});`)
    for (const row of def.rows) {
      const values = row
        .map((v) => (v === null ? 'NULL' : typeof v === 'number' ? v : `'${v}'`))
        .join(', ')
      db.run(`INSERT INTO ${table} VALUES (${values});`)
    }
  }
}

function run(db, query) {
  const stmt = db.prepare(query)
  stmt.bind()
  const cols = stmt.getColumnNames()
  const rows = []
  while (stmt.step()) rows.push(stmt.get())
  stmt.free()
  return { columns: cols, rows }
}

function norm(v) {
  return typeof v === 'number' ? +v.toFixed(4) : v
}

let ok = 0, fail = 0
for (const q of allSqlQuestions) {
  const db = new sql.Database()
  try {
    const schema = q.schema === 'store' ? storeSchema : q.schema
    buildSchema(db, schema)
    const query =
      storeQueries[q.id] ||
      reference[q.id] ||
      q.fixedQuery
    if (!query) { console.log(`– ${q.id}: no reference query`); continue }
    const actual = run(db, query)
    const expected = q.type === 'mc'
      ? null
      : { columns: q.expected.columns, rows: q.expected.rows }

    if (q.type === 'mc') {
      console.log(`${q.id} [mc] option picked: ${JSON.stringify(q.options[q.answerIndex])}`)
      ok++; continue
    }

    const aRows = actual.rows.map((r) => r.map(norm))
    const eRows = expected.rows.map((r) => r.map(norm))
    const same = q.expected.orderMatters
      ? JSON.stringify(aRows) === JSON.stringify(eRows)
      : JSON.stringify([...aRows].sort()) === JSON.stringify([...eRows].sort())
    if (same) {
      ok++
    } else {
      fail++
      console.log(`✗ ${q.id}: expected ${JSON.stringify(eRows)} got ${JSON.stringify(aRows)}`)
    }
  } catch (e) {
    fail++
    console.log(`✗ ${q.id}: ERROR ${e.message}`)
  } finally {
    db.close()
  }
}

console.log(`\n${ok} match · ${fail} mismatch`)