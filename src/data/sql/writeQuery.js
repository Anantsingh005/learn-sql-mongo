export const writeQuery = [
  {
    id: 'write-01',
    type: 'write',
    topic: 'SELECT · WHERE',
    difficulty: 'easy',
    question: 'Write a query that shows the name and salary of every employee earning more than $60,000.',
    schema: {
      employees: {
        columns: ['id', 'name', 'salary'],
        rows: [
          [1, 'Alice', 70000],
          [2, 'Bob', 50000],
          [3, 'Carol', 85000],
          [4, 'Dave', 45000],
          [5, 'Eve', 60000],
          [6, 'Frank', 62000],
        ],
      },
    },
    expected: {
      columns: ['name', 'salary'],
      rows: [
        ['Alice', 70000],
        ['Carol', 85000],
        ['Frank', 62000],
      ],
      orderMatters: false,
    },
    hint: 'Use WHERE salary > 60000.',
    explanation:
      'SELECT name, salary FROM employees WHERE salary > 60000; Eve earns exactly $60,000, which is not more than $60,000, so she is excluded.',
  },
  {
    id: 'write-02',
    type: 'write',
    topic: 'DISTINCT',
    difficulty: 'easy',
    question: 'Write a query that lists every unique department exactly once.',
    schema: {
      employees: {
        columns: ['id', 'name', 'dept'],
        rows: [
          [1, 'Alice', 'Engineering'],
          [2, 'Bob', 'Sales'],
          [3, 'Carol', 'Engineering'],
          [4, 'Dave', 'Marketing'],
          [5, 'Eve', 'Engineering'],
          [6, 'Frank', 'Sales'],
        ],
      },
    },
    expected: {
      columns: ['dept'],
      rows: [['Engineering'], ['Sales'], ['Marketing']],
      orderMatters: false,
    },
    hint: 'SELECT DISTINCT dept FROM employees;',
    explanation:
      'SELECT DISTINCT dept FROM employees; removes duplicates, so Engineering and Sales appear only once.',
  },
  {
    id: 'write-03',
    type: 'write',
    topic: 'ORDER BY · LIMIT',
    difficulty: 'easy',
    question: 'Write a query that returns the names of the 3 cheapest products, cheapest first.',
    schema: {
      products: {
        columns: ['id', 'name', 'price'],
        rows: [
          [1, 'Phone', 999.99],
          [2, 'Mouse', 19.99],
          [3, 'Keyboard', 49.99],
          [4, 'Monitor', 199.99],
          [5, 'Cable', 9.99],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [['Cable'], ['Mouse'], ['Keyboard']],
      orderMatters: true,
    },
    hint: 'ORDER BY price ASC LIMIT 3.',
    explanation:
      'SELECT name FROM products ORDER BY price ASC LIMIT 3; sorts by price rising and keeps the first 3 rows (Cable, Mouse, Keyboard).',
  },
  {
    id: 'write-04',
    type: 'write',
    topic: 'GROUP BY · SUM',
    difficulty: 'medium',
    question: 'Write a query that shows each customer along with the total amount they have spent.',
    schema: {
      orders: {
        columns: ['id', 'customer', 'amount'],
        rows: [
          [1, 'Alice', 100],
          [2, 'Bob', 50],
          [3, 'Alice', 75],
          [4, 'Carol', 200],
          [5, 'Bob', 25],
        ],
      },
    },
    expected: {
      columns: ['customer', 'total'],
      rows: [
        ['Alice', 175],
        ['Bob', 75],
        ['Carol', 200],
      ],
      orderMatters: false,
    },
    hint: 'GROUP BY customer and use SUM(amount).',
    explanation:
      'SELECT customer, SUM(amount) AS total FROM orders GROUP BY customer; Alice spends 100+75=175, Bob 50+25=75, Carol 200.',
  },
  {
    id: 'write-05',
    type: 'write',
    topic: 'INNER JOIN',
    difficulty: 'medium',
    question:
      'Write a query that pairs each student with their grade in each subject (student name, subject, grade).',
    schema: {
      students: {
        columns: ['id', 'name'],
        rows: [
          [1, 'Amy'],
          [2, 'Ben'],
          [3, 'Cid'],
        ],
      },
      scores: {
        columns: ['student_id', 'subject', 'grade'],
        rows: [
          [1, 'Math', 90],
          [1, 'Science', 85],
          [2, 'Math', 78],
          [2, 'History', 92],
        ],
      },
    },
    expected: {
      columns: ['name', 'subject', 'grade'],
      rows: [
        ['Amy', 'Math', 90],
        ['Amy', 'Science', 85],
        ['Ben', 'Math', 78],
        ['Ben', 'History', 92],
      ],
      orderMatters: false,
    },
    hint: 'INNER JOIN scores ON students.id = scores.student_id',
    explanation:
      'Joining on students.id = scores.student_id pairs each score row with its student. Cid has no scores and therefore does not appear in an INNER JOIN.',
  },
  {
    id: 'write-06',
    type: 'write',
    topic: 'GROUP BY · HAVING',
    difficulty: 'medium',
    question:
      'Write a query that shows each student and the number of courses they take, but only for students taking 2 or more courses.',
    schema: {
      enrollments: {
        columns: ['student', 'course'],
        rows: [
          ['Amy', 'Math'],
          ['Amy', 'Science'],
          ['Ben', 'Math'],
          ['Cid', 'Math'],
          ['Cid', 'Art'],
          ['Cid', 'Music'],
        ],
      },
    },
    expected: {
      columns: ['student', 'courses'],
      rows: [
        ['Amy', 2],
        ['Cid', 3],
      ],
      orderMatters: false,
    },
    hint: 'GROUP BY student with COUNT(*) and HAVING COUNT(*) >= 2.',
    explanation:
      'SELECT student, COUNT(*) AS courses FROM enrollments GROUP BY student HAVING COUNT(*) >= 2; includes Amy (2) and Cid (3), not Ben (1).',
  },
  {
    id: 'write-07',
    type: 'write',
    topic: 'LEFT JOIN · COUNT',
    difficulty: 'medium',
    question:
      'Write a query that shows each author and how many books they have written. Authors with no books must still appear, with 0.',
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
        columns: ['id', 'author_id', 'title'],
        rows: [
          [1, 1, 'Dawn'],
          [2, 1, 'Night'],
          [3, 2, 'Storm'],
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
    hint: 'LEFT JOIN keeps every author; count matched books.',
    explanation:
      'SELECT a.name, COUNT(b.id) FROM authors a LEFT JOIN books b ON a.id = b.author_id GROUP BY a.name; Ivy has no books but still appears with 0.',
  },
  {
    id: 'write-08',
    type: 'write',
    topic: 'Subquery · MAX',
    difficulty: 'hard',
    question: 'Write a query that returns the name and price of the most expensive product.',
    schema: {
      products: {
        columns: ['id', 'name', 'price'],
        rows: [
          [1, 'Laptop', 999.99],
          [2, 'Mouse', 19.99],
          [3, 'Monitor', 199.99],
          [4, 'Desk', 299.99],
        ],
      },
    },
    expected: {
      columns: ['name', 'price'],
      rows: [['Laptop', 999.99]],
      orderMatters: false,
    },
    hint: 'Compare price to (SELECT MAX(price) FROM products).',
    explanation:
      'SELECT name, price FROM products WHERE price = (SELECT MAX(price) FROM products); finds the highest price first, then the product(s) matching it.',
  },
  {
    id: 'write-09',
    type: 'write',
    topic: 'JOIN · aggregate',
    difficulty: 'hard',
    question:
      'Write a query that shows total revenue per category, where order items are in sales and products have a price.',
    schema: {
      products: {
        columns: ['id', 'name', 'category', 'price'],
        rows: [
          [1, 'Laptop', 'Electronics', 999.99],
          [2, 'Mouse', 'Electronics', 19.99],
          [3, 'Keyboard', 'Accessories', 49.99],
          [4, 'Monitor', 'Electronics', 199.99],
          [5, 'Desk', 'Furniture', 299.99],
        ],
      },
      sales: {
        columns: ['product_id', 'qty'],
        rows: [
          [1, 2],
          [2, 10],
          [3, 5],
          [4, 1],
          [5, 3],
        ],
      },
    },
    expected: {
      columns: ['category', 'revenue'],
      rows: [
        ['Electronics', 2399.87],
        ['Accessories', 249.95],
        ['Furniture', 899.97],
      ],
      orderMatters: false,
    },
    hint: 'Join products to sales, sum price * qty, group by category.',
    explanation:
      'SELECT p.category, SUM(p.price * s.qty) AS revenue FROM products p JOIN sales s ON p.id = s.product_id GROUP BY p.category; Electronics = 999.99*2 + 19.99*10 + 199.99*1 = 2399.87.',
  },
]

export default writeQuery