export const fixBug = [
  {
    id: 'bug-01',
    type: 'bug',
    topic: 'Clause order',
    difficulty: 'easy',
    question:
      'This query has a syntax bug. Write the fixed query that shows all employees sorted by name.',
    buggyQuery: 'SELECT * FROM employees LIMIT 5 ORDER BY name;',
    schema: {
      employees: {
        columns: ['id', 'name', 'salary'],
        rows: [
          [1, 'Alice', 70000],
          [2, 'Bob', 50000],
          [3, 'Carol', 85000],
        ],
      },
    },
    expected: {
      columns: ['id', 'name', 'salary'],
      rows: [
        [1, 'Alice', 70000],
        [2, 'Bob', 50000],
        [3, 'Carol', 85000],
      ],
      orderMatters: true,
    },
    hint: 'ORDER BY must come before LIMIT.',
    explanation:
      'The correct clause order is ORDER BY first, then LIMIT: SELECT * FROM employees ORDER BY name LIMIT 5;. Putting LIMIT before ORDER BY is a syntax error.',
  },
  {
    id: 'bug-02',
    type: 'bug',
    topic: 'String literals',
    difficulty: 'easy',
    question:
      'This query would raise an error in SQLite. Write the fixed query that shows London customers.',
    buggyQuery: "SELECT * FROM customers WHERE city = London;",
    schema: {
      customers: {
        columns: ['id', 'name', 'city'],
        rows: [
          [1, 'Alice', 'London'],
          [2, 'Bob', 'New York'],
          [3, 'Carol', 'London'],
        ],
      },
    },
    expected: {
      columns: ['id', 'name', 'city'],
      rows: [
        [1, 'Alice', 'London'],
        [3, 'Carol', 'London'],
      ],
      orderMatters: false,
    },
    hint: 'Strings need single quotes.',
    explanation:
      "SELECT * FROM customers WHERE city = 'London';. Without quotes, London is treated as an identifier (column name), which does not exist, so SQLite raises an error.",
  },
  {
    id: 'bug-03',
    type: 'bug',
    topic: 'Comparison operator',
    difficulty: 'medium',
    question:
      'The goal is to find products with FEWER than 30 units in stock, but this query returns the wrong rows. Fix it.',
    buggyQuery: 'SELECT name, stock FROM products WHERE stock > 30;',
    schema: {
      products: {
        columns: ['id', 'name', 'stock'],
        rows: [
          [1, 'Desk', 15],
          [2, 'Mouse', 120],
          [3, 'Lamp', 25],
          [4, 'Chair', 40],
        ],
      },
    },
    expected: {
      columns: ['name', 'stock'],
      rows: [
        ['Desk', 15],
        ['Lamp', 25],
      ],
      orderMatters: false,
    },
    hint: '"Fewer than 30" means stock < 30.',
    explanation:
      'The bug is the direction of the comparison. SELECT name, stock FROM products WHERE stock < 30; returns Desk (15) and Lamp (25).',
  },
  {
    id: 'bug-04',
    type: 'bug',
    topic: 'Missing JOIN condition',
    difficulty: 'medium',
    question:
      'This query accidentally produces a Cartesian product (every customer paired with every order). Write a query that joins them correctly on customer_id.',
    buggyQuery: 'SELECT customers.name, orders.total FROM customers, orders;',
    schema: {
      customers: {
        columns: ['id', 'name'],
        rows: [
          [1, 'Alice'],
          [2, 'Bob'],
          [3, 'Carol'],
        ],
      },
      orders: {
        columns: ['id', 'customer_id', 'total'],
        rows: [
          [1, 1, 100],
          [2, 1, 50],
          [3, 2, 200],
        ],
      },
    },
    expected: {
      columns: ['name', 'total'],
      rows: [
        ['Alice', 100],
        ['Alice', 50],
        ['Bob', 200],
      ],
      orderMatters: false,
    },
    hint: 'Add a JOIN ... ON customers.id = orders.customer_id.',
    explanation:
      'SELECT customers.name, orders.total FROM customers JOIN orders ON customers.id = orders.customer_id;. Without the ON condition, each of 3 customers is paired with all 3 orders, producing 9 rows.',
  },
  {
    id: 'bug-05',
    type: 'bug',
    topic: 'Missing GROUP BY',
    difficulty: 'medium',
    question:
      'This query raises an error in SQLite: "misuse of aggregate". Write the fixed query that groups products by category and counts them.',
    buggyQuery: 'SELECT category, COUNT(*) FROM products;',
    schema: {
      products: {
        columns: ['id', 'name', 'category'],
        rows: [
          [1, 'Laptop', 'Electronics'],
          [2, 'Mouse', 'Electronics'],
          [3, 'Keyboard', 'Accessories'],
        ],
      },
    },
    expected: {
      columns: ['category', 'COUNT(*)'],
      rows: [
        ['Electronics', 2],
        ['Accessories', 1],
      ],
      orderMatters: false,
    },
    hint: 'Use GROUP BY category.',
    explanation:
      'SELECT category, COUNT(*) FROM products GROUP BY category;. A column with an aggregate must either be the aggregate itself or appear in GROUP BY — otherwise SQLite raises "misuse of aggregate".',
  },
  {
    id: 'bug-06',
    type: 'bug',
    topic: 'Wrong join key',
    difficulty: 'medium',
    question:
      'This query pairs posts with the wrong user — it joins on the wrong column. Write the fixed query so each post shows its author.',
    buggyQuery: 'SELECT users.name, posts.title FROM users JOIN posts ON users.id = posts.id;',
    schema: {
      users: {
        columns: ['id', 'name'],
        rows: [
          [1, 'Maya'],
          [2, 'Leo'],
        ],
      },
      posts: {
        columns: ['id', 'user_id', 'title'],
        rows: [
          [1, 1, 'Hello'],
          [2, 1, 'World'],
          [3, 2, 'Hi'],
        ],
      },
    },
    expected: {
      columns: ['name', 'title'],
      rows: [
        ['Maya', 'Hello'],
        ['Maya', 'World'],
        ['Leo', 'Hi'],
      ],
      orderMatters: false,
    },
    hint: 'Join on posts.user_id, not posts.id.',
    explanation:
      'SELECT users.name, posts.title FROM users JOIN posts ON users.id = posts.user_id;. Using posts.id as the foreign key matches a post to the user whose id equals the post id — almost always wrong.',
  },
  {
    id: 'bug-07',
    type: 'bug',
    topic: 'HAVING vs WHERE',
    difficulty: 'hard',
    question:
      'This query has a syntax error: you cannot use an aggregate in WHERE, and WHERE cannot come after GROUP BY. Rewrite it to count products per category but keep only categories with more than 1 product.',
    buggyQuery: 'SELECT category, COUNT(*) FROM products GROUP BY category WHERE COUNT(*) > 1;',
    schema: {
      products: {
        columns: ['id', 'name', 'category'],
        rows: [
          [1, 'Laptop', 'Electronics'],
          [2, 'Mouse', 'Electronics'],
          [3, 'Keyboard', 'Accessories'],
          [4, 'Monitor', 'Electronics'],
          [5, 'Desk', 'Furniture'],
          [6, 'Chair', 'Furniture'],
        ],
      },
    },
    expected: {
      columns: ['category', 'COUNT(*)'],
      rows: [
        ['Electronics', 3],
        ['Furniture', 2],
      ],
      orderMatters: false,
    },
    hint: 'Filters on aggregates belong in HAVING, placed after GROUP BY.',
    explanation:
      'SELECT category, COUNT(*) FROM products GROUP BY category HAVING COUNT(*) > 1;. HAVING filters groups after aggregation; WHERE filters rows before grouping and cannot reference COUNT(*).',
  },
  {
    id: 'bug-08',
    type: 'bug',
    topic: 'Logical boundary',
    difficulty: 'hard',
    question:
      'The goal is to return products costing AT LEAST $100, including any product that costs exactly $100. The current query has a subtle off-by-one bug.',
    buggyQuery: 'SELECT name, price FROM products WHERE price > 100;',
    schema: {
      products: {
        columns: ['id', 'name', 'price'],
        rows: [
          [1, 'Mouse', 99.99],
          [2, 'Monitor', 100],
          [3, 'Desk', 150],
          [4, 'Laptop', 249.99],
        ],
      },
    },
    expected: {
      columns: ['name', 'price'],
      rows: [
        ['Monitor', 100],
        ['Desk', 150],
        ['Laptop', 249.99],
      ],
      orderMatters: false,
    },
    hint: '"At least $100" includes 100 itself: price >= 100.',
    explanation:
      'SELECT name, price FROM products WHERE price >= 100;. The original query missed the Monitor which costs exactly $100.',
  },
]

export default fixBug