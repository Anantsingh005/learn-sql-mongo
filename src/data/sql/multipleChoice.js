export const multipleChoice = [
  {
    id: 'mc-01',
    type: 'mc',
    topic: 'SELECT · WHERE',
    difficulty: 'easy',
    schema: 'store',
    question:
      'The customers table has the columns (id, name, city, signup_date). Which query returns only the names of all customers living in London?',
    options: [
      'SELECT name FROM customers WHERE city = `London`',
      "SELECT name FROM customers WHERE city = 'London'",
      'SELECT city FROM customers WHERE name = \'London\'',
      'SELECT * FROM customers WHERE city = "London"',
    ],
    answerIndex: 1,
    explanation:
      "In SQL, string values must be wrapped in single quotes ('London'). Double quotes are for identifiers, and backticks are non-standard. WHERE filters rows, so this returns only London customers, and we select the name column.",
  },
  {
    id: 'mc-02',
    type: 'mc',
    topic: 'WHERE · comparison',
    difficulty: 'easy',
    schema: 'store',
    question:
      'The products table has a price column. Which query returns all products priced under $50?',
    options: [
      'SELECT * FROM products WHERE price > 50',
      'SELECT * FROM products WHERE price <= 50',
      'SELECT * FROM products WHERE price < 50',
      'SELECT * FROM products WHERE price = 50',
    ],
    answerIndex: 2,
    explanation:
      '"Under $50" means strictly less than 50, so WHERE price < 50. The <= (less-than-or-equal) option would wrongly include a $50 product.',
  },
  {
    id: 'mc-03',
    type: 'mc',
    topic: 'COUNT',
    difficulty: 'easy',
    schema: 'store',
    question:
      'In the store database, what does this query return?\n\nSELECT COUNT(*) FROM orders WHERE customer_id = 1;\n\n(Alice is customer id 1 and placed orders 1 and 2; other customers use other ids.)',
    options: ['The orders themselves', '3 named columns', '4 supplier names', '2 orders'],
    answerIndex: 3,
    explanation:
      'COUNT(*) counts the rows that match the WHERE filter. The orders table shows customer_id 1 on orders 1 and 2, so COUNT(*) returns 2.',
  },
  {
    id: 'mc-04',
    type: 'mc',
    topic: 'DISTINCT',
    difficulty: 'easy',
    schema: 'store',
    question: 'Which keyword removes duplicate values from a result column?',
    options: ['UNIQUE', 'DISTINCT', 'GROUP', 'ONLY'],
    answerIndex: 1,
    explanation:
      'SELECT DISTINCT column ... drops repeated values. UNIQUE exists but is used when defining table constraints, not for query output.',
  },
  {
    id: 'mc-05',
    type: 'mc',
    topic: 'ORDER BY',
    difficulty: 'easy',
    schema: 'store',
    question: 'In the query `ORDER BY price DESC`, DESC sorts the results:',
    options: ['From highest to lowest', 'From lowest to highest', 'Alphabetically A-Z', 'In insertion order'],
    answerIndex: 0,
    explanation:
      'DESC means "descending", so the largest values come first. ASC (default) is lowest to highest.',
  },
  {
    id: 'mc-06',
    type: 'mc',
    topic: 'LIMIT',
    difficulty: 'easy',
    schema: 'store',
    question:
      'Which query returns the 2 most expensive products (name + price) from the products table?',
    options: [
      'SELECT name, price FROM products LIMIT 2',
      'SELECT name, price FROM products ORDER BY price DESC LIMIT 2',
      'SELECT name, price FROM products ORDER BY price ASC LIMIT 2',
      'SELECT name, price FROM products ORDER BY price DESC FETCH 2',
    ],
    answerIndex: 1,
    explanation:
      'ORDER BY price DESC sorts from most to least expensive, and LIMIT 2 keeps only the top two. Sorting must happen before limiting.',
  },
  {
    id: 'mc-07',
    type: 'mc',
    topic: 'SUM',
    difficulty: 'easy',
    schema: 'store',
    question: 'Which aggregate function returns the total of all values in a numeric column?',
    options: ['TOTAL()', 'AVG()', 'SUM()', 'MAX()'],
    answerIndex: 2,
    explanation:
      'SUM(column) adds up all values. AVG gives the mean, MAX the largest, and TOTAL() is a rarely-used synonym for SUM.',
  },
  {
    id: 'mc-08',
    type: 'mc',
    topic: 'IN',
    difficulty: 'medium',
    schema: 'store',
    question:
      'Which query returns customers from London, Paris, or Berlin in a single condition?',
    options: [
      "SELECT * FROM customers WHERE city = 'London' OR city = 'Paris' OR city = 'Berlin'",
      "SELECT * FROM customers WHERE city IN ('London', 'Paris', 'Berlin')",
      "SELECT * FROM customers WHERE city LIKE ('London', 'Paris', 'Berlin')",
      "SELECT * FROM customers WHERE city = 'London, Paris, Berlin'",
    ],
    answerIndex: 1,
    explanation:
      'The IN operator checks membership against a list of values. While option 0 works, IN is cleaner and means the same thing.',
  },
  {
    id: 'mc-09',
    type: 'mc',
    topic: 'GROUP BY',
    difficulty: 'medium',
    schema: 'store',
    question:
      'How many result rows does this query produce?\n\nSELECT city, COUNT(*) FROM customers GROUP BY city;',
    options: ['5 (every customer)', '9 (every order)', '4 (unique cities, limit: London, New York, Paris, Berlin)', '1 (a single total)'],
    answerIndex: 2,
    explanation:
      'GROUP BY city collapses rows into one per unique city. There are 4 distinct cities, so the query returns 4 rows, each with its city and count.',
  },
  {
    id: 'mc-10',
    type: 'mc',
    topic: 'HAVING',
    difficulty: 'medium',
    schema: 'store',
    question: 'Which clause is used to filter grouped rows (after GROUP BY)?',
    options: ['WHERE', 'HAVING', 'LIMIT', 'FILTER'],
    answerIndex: 1,
    explanation:
      'HAVING filters groups produced by GROUP BY (e.g., HAVING COUNT(*) > 2). WHERE filters individual rows before grouping and cannot use aggregates.',
  },
  {
    id: 'mc-11',
    type: 'mc',
    topic: 'INNER JOIN',
    difficulty: 'medium',
    schema: 'store',
    question:
      'products has 7 rows and orders has 9 rows. Every order references a valid product. How many rows does this return?\n\nSELECT orders.id, products.name\nFROM orders\nINNER JOIN products ON orders.product_id = products.id;',
    options: ['16 (7 items x 7 orders = 49)', '7 (products only)', '9 (one per order)', '63 (9 + 7)'],
    answerIndex: 2,
    explanation:
      'INNER JOIN matches each order to its product. Since this is a one-to-many relationship (each order → one product) and every order matches, the result has one row per order: 9 rows.',
  },
  {
    id: 'mc-12',
    type: 'mc',
    topic: 'LEFT JOIN',
    difficulty: 'hard',
    schema: 'store',
    question:
      'Imagine a customer who has never placed an order. Which query still returns that customer, with NULL order data?',
    options: [
      'SELECT * FROM customers INNER JOIN orders ON customers.id = orders.customer_id',
      'SELECT * FROM customers FULL JOIN orders ON customers.id = orders.customer_id',
      'SELECT * FROM customers LEFT JOIN orders ON customers.id = orders.customer_id',
      'SELECT * FROM customers JOIN orders ON customers.id = orders.customer_id',
    ],
    answerIndex: 2,
    explanation:
      'LEFT JOIN keeps every row from the left (customers) table; unmatched orders columns become NULL. INNER JOIN would drop that customer entirely.',
  },
]

export default multipleChoice