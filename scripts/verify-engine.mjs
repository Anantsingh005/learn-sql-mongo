import initSqlJs from 'sql.js'
import { allSqlQuestions } from '../src/data/sql/index.js'
import { storeSchema } from '../src/data/sql/schemas.js'
import checkAnswer from '../src/engine/AnswerChecker.js'
import { runSchema } from '../src/engine/sqlSchema.js'
import { resolveSchema } from '../src/engine/queryCheck.js'

const sql = await initSqlJs()

const correctAnswers = {
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
  'win-write-01': 'SELECT name, salary, dept, avg_salary FROM (SELECT name, salary, dept, AVG(salary) OVER (PARTITION BY dept) AS avg_salary FROM employees) WHERE salary > avg_salary',
  'win-write-02': 'SELECT category, name, price FROM (SELECT category, name, price, ROW_NUMBER() OVER (PARTITION BY category ORDER BY price ASC) AS rn FROM products) WHERE rn <= 2',
  'win-write-03': 'WITH per_customer AS (SELECT customer AS name, SUM(amount) AS total FROM orders GROUP BY customer), overall AS (SELECT AVG(total) AS avg_total FROM per_customer) SELECT name, total FROM per_customer WHERE total > (SELECT avg_total FROM overall)',
  'win-write-04': 'SELECT a.name, COUNT(b.title) AS book_count FROM authors a LEFT JOIN books b ON a.id = b.author_id GROUP BY a.id, a.name ORDER BY a.id',
  'win-write-05': 'SELECT month, amount AS revenue, LAG(amount, 1) OVER (ORDER BY month) AS prev FROM revenue',
  'win-write-06': 'SELECT name, salary, RANK() OVER (ORDER BY salary DESC) AS rnk FROM employees',
  'win-bug-01': 'SELECT name, dept, salary, ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) AS rn FROM employees',
  'win-bug-02': 'SELECT category, AVG(price) AS avg_price FROM products GROUP BY category',
}

const wrongAnswers = {
  'write-01': 'SELECT name FROM employees',                    // missing salary column
  'write-03': 'SELECT name FROM products',                     // no LIMIT, no order
  'write-04': 'SELECT customer FROM orders',                   // missing SUM
  'write-06': 'SELECT student, COUNT(*) FROM enrollments',     // no HAVING filter
  'write-07': 'SELECT * FROM authors',                         // no counts / no join
  'write-08': 'SELECT name, price FROM products',              // all products
  'write-09': 'SELECT category FROM products',                 // no revenue
  'bug-03': 'SELECT name, stock FROM products WHERE stock > 30',  // still buggy direction
  'bug-04': 'SELECT customers.name, orders.total FROM customers, orders',  // cartesian
  'bug-06': 'SELECT users.name, posts.title FROM users JOIN posts ON users.id = posts.id',  // still wrong key
  'bug-08': 'SELECT name, price FROM products WHERE price > 100',  // still misses monitor
}

function runQuery(db, q) {
  const stmt = db.prepare(q)
  stmt.bind()
  const columns = stmt.getColumnNames()
  const rows = []
  while (stmt.step()) rows.push(stmt.get())
  stmt.free()
  return { columns, rows }
}

function headers(q) {
  return `${q.id} [${q.type}] ${q.difficulty} · ${q.topic}`
}

let pass = 0, fail = 0

for (const q of allSqlQuestions) {
  const db = new sql.Database()
  const schema = resolveSchema(q.schema) ?? (q.schema === 'store' ? storeSchema : q.schema)
  runSchema(db, schema)

  if (q.type === 'mc') {
    if (q.answerIndex < 0 || q.answerIndex >= q.options.length || q.options.length < 4) {
      fail++; console.log(`FAIL ${q.id}: answerIndex/options invalid`)
    } else {
      pass++; console.log(`PASS ${headers(q)}`)
    }
    db.close()
    continue
  }

  const correct = correctAnswers[q.id]
  if (!correct) { fail++; console.log(`FAIL ${headers(q)}: no correct answer defined`); db.close(); continue }

  // correct answer path
  const good = runQuery(db, correct)
  const resGood = checkAnswer(good, q.expected, {
    orderMatters: q.expected.orderMatters ?? false,
    ignoreColumnOrder: true,
    numericTolerance: 1e-4,
  })

  const wrong = wrongAnswers[q.id]
  const resWrong = wrong
    ? checkAnswer(runQuery(db, wrong), q.expected, {
        orderMatters: q.expected.orderMatters ?? false,
        ignoreColumnOrder: true,
        numericTolerance: 1e-4,
      })
    : null

  if (resGood.correct && (!resWrong || !resWrong.correct)) {
    pass++; console.log(`PASS ${headers(q)}`)
  } else {
    fail++
    console.log(`FAIL ${headers(q)}: good=${resGood.correct}${resWrong ? ` wrong=${resWrong.correct}` : ''} ${resGood.reason ?? ''}`)
  }

  // ensure revenue float tolerance works for write-09
  if (q.id === 'write-09' && !resGood.correct) console.log('  check write-09 tolerance: precision issue?')
  db.close()
}

console.log(`\n${pass} passed · ${fail} failed`)