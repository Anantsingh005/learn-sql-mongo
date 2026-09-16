export const windowCte = [
  {
    id: 'win-write-01',
    type: 'write',
    topic: 'Window · AVG · PARTITION BY',
    difficulty: 'hard',
    question:
      'Write a query that returns each employee who earns strictly more than their own department average (columns: name, salary, dept, avg_salary).',
    schema: {
      employees: {
        columns: ['id', 'name', 'dept', 'salary'],
        rows: [
          [1, 'Ana', 'Eng', 90],
          [2, 'Bo', 'Eng', 70],
          [3, 'Cy', 'Sales', 60],
          [4, 'Di', 'Sales', 80],
          [5, 'Eli', 'Eng', 80],
        ],
      },
    },
    expected: {
      columns: ['name', 'salary', 'dept', 'avg_salary'],
      rows: [
        ['Di', 80, 'Sales', 70],
        ['Ana', 90, 'Eng', 80],
      ],
      orderMatters: false,
    },
    hint: 'AVG(salary) OVER (PARTITION BY dept) computes each department\'s average next to every row.',
    explanation:
      'SELECT name, salary, dept, AVG(salary) OVER (PARTITION BY dept) AS avg_salary FROM employees WHERE salary > AVG(salary) OVER (PARTITION BY dept); — but WHERE cannot use window functions, so you must wrap it: WITH stats AS (SELECT *, AVG(salary) OVER (PARTITION BY dept) AS avg_salary FROM employees) SELECT name, salary, dept, avg_salary FROM stats WHERE salary > avg_salary;. Eng average is (90+70+80)/3 = 80 → only Ana (90) stays; Sales average is (60+80)/2 = 70 → only Di (80) stays. Eli (exactly 80) does not qualify because she is not strictly greater.',
  },
  {
    id: 'win-write-02',
    type: 'write',
    topic: 'ROW_NUMBER · TOP-N per group',
    difficulty: 'hard',
    question:
      'Write a query that returns the 2 cheapest products in each category (columns: category, name, price).',
    schema: {
      products: {
        columns: ['id', 'name', 'category', 'price'],
        rows: [
          [1, 'Laptop', 'Electronics', 999.99],
          [2, 'Mouse', 'Electronics', 19.99],
          [3, 'Monitor', 'Electronics', 199.99],
          [4, 'Desk', 'Furniture', 299.99],
          [5, 'Chair', 'Furniture', 129.99],
          [6, 'Lamp', 'Furniture', 39.99],
        ],
      },
    },
    expected: {
      columns: ['category', 'name', 'price'],
      rows: [
        ['Electronics', 'Mouse', 19.99],
        ['Electronics', 'Monitor', 199.99],
        ['Furniture', 'Lamp', 39.99],
        ['Furniture', 'Chair', 129.99],
      ],
      orderMatters: false,
    },
    hint: 'ROW_NUMBER() OVER (PARTITION BY category ORDER BY price ASC) then keep rn <= 2.',
    explanation:
      'WITH ranked AS (SELECT category, name, price, ROW_NUMBER() OVER (PARTITION BY category ORDER BY price ASC) AS rn FROM products) SELECT category, name, price FROM ranked WHERE rn <= 2;. Electronics: Mouse(19.99), Monitor(199.99); Furniture: Lamp(39.99), Chair(129.99).',
  },
  {
    id: 'win-write-03',
    type: 'write',
    topic: 'CTE · aggregate compare',
    difficulty: 'medium',
    question:
      'Write a query that returns each customer\'s name and the total they have spent, but only for customers whose total exceeds the average total across all customers (columns: name, total).',
    schema: {
      orders: {
        columns: ['customer', 'amount'],
        rows: [
          ['Amy', 100],
          ['Bo', 50],
          ['Cy', 200],
          ['Di', 75],
          ['Eli', 25],
        ],
      },
    },
    expected: {
      columns: ['name', 'total'],
      rows: [
        ['Cy', 200],
        ['Amy', 100],
      ],
      orderMatters: false,
    },
    hint: 'SUM per customer in one CTE, then AVG(total) in a second CTE, then compare.',
    explanation:
      'WITH per_customer AS (SELECT customer AS name, SUM(amount) AS total FROM orders GROUP BY customer), overall AS (SELECT AVG(total) AS avg_total FROM per_customer) SELECT name, total FROM per_customer WHERE total > (SELECT avg_total FROM overall);. Totals are Amy 100, Bo 50, Cy 200, Di 75, Eli 25 → average 90. Only Cy (200) and Amy (100) exceed it.',
  },
  {
    id: 'win-write-04',
    type: 'write',
    topic: 'COALESCE · LEFT JOIN · COUNT',
    difficulty: 'medium',
    question:
      'Write a query that lists every author and how many books they have written; authors with no books must appear with count 0.',
    schema: {
      authors: {
        columns: ['id', 'name'],
        rows: [
          [1, 'Maya'],
          [2, 'Leo'],
          [3, 'Ivy'],
        ],
      },
      books: {
        columns: ['author_id', 'title'],
        rows: [
          [1, 'Dawn'],
          [1, 'Night'],
          [2, 'Storm'],
        ],
      },
    },
    expected: {
      columns: ['name', 'book_count'],
      rows: [
        ['Maya', 2],
        ['Leo', 1],
        ['Ivy', 0],
      ],
      orderMatters: false,
    },
    hint: 'LEFT JOIN books, COUNT only book ids, and remember Ivy has none.',
    explanation:
      'SELECT a.name, COUNT(b.title) AS book_count FROM authors a LEFT JOIN books b ON a.id = b.author_id GROUP BY a.id, a.name ORDER BY a.id;. LEFT JOIN keeps Ivy even with zero matching books → COUNT gives 0.',
  },
  {
    id: 'win-write-05',
    type: 'write',
    topic: 'LAG · month-over-month',
    difficulty: 'hard',
    question:
      'Write a query that shows each month and its revenue, plus the previous month\'s revenue in a column called prev (columns: month, revenue, prev).',
    schema: {
      revenue: {
        columns: ['month', 'amount'],
        rows: [
          ['2023-01', 100],
          ['2023-02', 150],
          ['2023-03', 120],
          ['2023-04', 200],
        ],
      },
    },
    expected: {
      columns: ['month', 'revenue', 'prev'],
      rows: [
        ['2023-01', 100, null],
        ['2023-02', 150, 100],
        ['2023-03', 120, 150],
        ['2023-04', 200, 120],
      ],
      orderMatters: true,
    },
    hint: 'LAG(amount, 1) OVER (ORDER BY month) gives the previous row\'s revenue.',
    explanation:
      'SELECT month, amount AS revenue, LAG(amount, 1) OVER (ORDER BY month) AS prev FROM revenue;. The first month has no previous row so prev is NULL; every later month shows the amount from one row earlier.',
  },
  {
    id: 'win-write-06',
    type: 'write',
    topic: 'RANK · ties',
    difficulty: 'medium',
    question:
      'Write a query that ranks employees by salary, where employees with equal salaries share the same rank (columns: name, salary, rnk).',
    schema: {
      employees: {
        columns: ['id', 'name', 'salary'],
        rows: [
          [1, 'Ana', 90],
          [2, 'Bo', 80],
          [3, 'Cy', 80],
          [4, 'Di', 70],
        ],
      },
    },
    expected: {
      columns: ['name', 'salary', 'rnk'],
      rows: [
        ['Ana', 90, 1],
        ['Bo', 80, 2],
        ['Cy', 80, 2],
        ['Di', 70, 4],
      ],
      orderMatters: true,
    },
    hint: 'RANK() OVER (ORDER BY salary DESC) skips numbers when ties exist.',
    explanation:
      'SELECT name, salary, RANK() OVER (ORDER BY salary DESC) AS rnk FROM employees;. Bo and Cy tie at 80 → both get rank 2, and Di is then rank 4 (the next rank after the tie counts 3 ranks: 1, 2, 2, 4). DENSE_RANK would give 1, 2, 2, 3 instead.',
  },
  {
    id: 'win-bug-01',
    type: 'bug',
    topic: 'Window · missing PARTITION',
    difficulty: 'hard',
    question:
      'The goal: number employees from 1 within each department ordered by salary descending. This query numbers the whole company. Write the fixed query.',
    buggyQuery:
      'SELECT name, dept, salary, ROW_NUMBER() OVER (ORDER BY salary DESC) AS rn FROM employees;',
    schema: {
      employees: {
        columns: ['id', 'name', 'dept', 'salary'],
        rows: [
          [1, 'Ana', 'Eng', 90],
          [2, 'Bo', 'Eng', 70],
          [3, 'Cy', 'Sales', 80],
          [4, 'Di', 'Sales', 60],
        ],
      },
    },
    expected: {
      columns: ['name', 'dept', 'salary', 'rn'],
      rows: [
        ['Ana', 'Eng', 90, 1],
        ['Bo', 'Eng', 70, 2],
        ['Cy', 'Sales', 80, 1],
        ['Di', 'Sales', 60, 2],
      ],
      orderMatters: true,
    },
    hint: 'Add PARTITION BY dept to the OVER clause.',
    explanation:
      'SELECT name, dept, salary, ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) AS rn FROM employees;. PARTITION BY dept restarts the numbering at 1 for every department: Eng = Ana(1) Bo(2), Sales = Cy(1) Di(2). Ordering by salary across the company would give Ana 1, Cy 2, Bo 3, Di 4 — wrong.',
  },
  {
    id: 'win-bug-02',
    type: 'bug',
    topic: 'CTE · alias scope',
    difficulty: 'easy',
    question:
      'The goal: show each category and the average price of products in itainer. This query fails with "no such column: category". Write the fixed query.',
    buggyQuery:
      'SELECT category, AVG(price) FROM (SELECT category, price FROM products ORDER BY price) WHERE category IS NOT NULL;',
    schema: {
      products: {
        columns: ['id', 'name', 'category', 'price'],
        rows: [
          [1, 'Laptop', 'Electronics', 999.99],
          [2, 'Mouse', 'Electronics', 19.99],
          [3, 'Desk', 'Furniture', 299.99],
        ],
      },
    },
    expected: {
      columns: ['category', 'avg_price'],
      rows: [
        ['Electronics', 509.99],
        ['Furniture', 299.99],
      ],
      orderMatters: false,
    },
    hint: 'Use GROUP BY category on the base table — no subquery needed.',
    explanation:
      'SELECT category, AVG(price) AS avg_price FROM products GROUP BY category;. The original bug is missing GROUP BY — without it, SQLite cannot combine a non-aggregated category column with AVG(price). Electronics: (999.99+19.99)/2 = 509.99; Furniture just 299.99.',
  },
]

export default windowCte
