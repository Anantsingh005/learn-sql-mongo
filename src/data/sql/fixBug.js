export const fixBug = [
  {
    id: 'bug-01',
    type: 'bug',
    topic: 'Clause order',
    difficulty: 'easy',
    question:
      'This query has a syntax bug. Write the fixed query that shows all employees sorted by name.',
    buggyQuery: 'SELECT * FROM employees LIMIT 5 ORDER BY name;',
    fixedQuery: 'SELECT * FROM employees ORDER BY name LIMIT 5',
    schema: {
      'employees': {
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
    buggyQuery: 'SELECT * FROM customers WHERE city = London;',
    fixedQuery: 'SELECT * FROM customers WHERE city = \'London\'',
    schema: {
      'customers': {
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
      'SELECT * FROM customers WHERE city = \'London\';. Without quotes, London is treated as an identifier (column name), which does not exist, so SQLite raises an error.',
  },
  {
    id: 'bug-03',
    type: 'bug',
    topic: 'Comparison operator',
    difficulty: 'medium',
    question:
      'The goal is to find products with FEWER than 30 units in stock, but this query returns the wrong rows. Fix it.',
    buggyQuery: 'SELECT name, stock FROM products WHERE stock > 30;',
    fixedQuery: 'SELECT name, stock FROM products WHERE stock < 30',
    schema: {
      'products': {
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
    fixedQuery: 'SELECT customers.name, orders.total FROM customers JOIN orders ON customers.id = orders.customer_id',
    schema: {
      'customers': {
        columns: ['id', 'name'],
        rows: [
          [1, 'Alice'],
          [2, 'Bob'],
          [3, 'Carol'],
        ],
      },
      'orders': {
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
        ['Alice', 50],
        ['Alice', 100],
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
    fixedQuery: 'SELECT category, COUNT(*) FROM products GROUP BY category',
    schema: {
      'products': {
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
        ['Accessories', 1],
        ['Electronics', 2],
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
    fixedQuery: 'SELECT users.name, posts.title FROM users JOIN posts ON users.id = posts.user_id',
    schema: {
      'users': {
        columns: ['id', 'name'],
        rows: [
          [1, 'Maya'],
          [2, 'Leo'],
        ],
      },
      'posts': {
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
    fixedQuery: 'SELECT category, COUNT(*) FROM products GROUP BY category HAVING COUNT(*) > 1',
    schema: {
      'products': {
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
    fixedQuery: 'SELECT name, price FROM products WHERE price >= 100',
    schema: {
      'products': {
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
  {
    id: 'bug_e1',
    type: 'bug',
    topic: 'String literals',
    difficulty: 'easy',
    question:
      'This query fails with \'no such column: Sales\'. Write the fixed query that lists employees in the Sales department.',
    buggyQuery: 'SELECT name FROM employees WHERE dept = Sales;',
    fixedQuery: 'SELECT name FROM employees WHERE dept = \'Sales\';',
    schema: {
      'employees': {
        columns: ['id', 'name', 'dept'],
        rows: [
          [1, 'Ada', 'Sales'],
          [2, 'Bo', 'Eng'],
          [3, 'Ci', 'Sales'],
          [4, 'Dex', 'Eng'],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Ada'],
        ['Ci'],
      ],
      orderMatters: false,
    },
    hint: 'Text values need single quotes.',
    explanation:
      'SELECT name FROM employees WHERE dept = \'Sales\';. Without quotes, SQLite treats Sales as a column name, which does not exist, so the query fails.',
  },
  {
    id: 'bug_e2',
    type: 'bug',
    topic: 'Comparison direction',
    difficulty: 'easy',
    question:
      'The goal is to list products that cost less than 20, but this returns the wrong rows. Fix it.',
    buggyQuery: 'SELECT name FROM products WHERE price > 20;',
    fixedQuery: 'SELECT name FROM products WHERE price < 20;',
    schema: {
      'products': {
        columns: ['id', 'name', 'price'],
        rows: [
          [1, 'Pen', 5],
          [2, 'Desk', 40],
          [3, 'Cup', 15],
          [4, 'Lamp', 25],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Pen'],
        ['Cup'],
      ],
      orderMatters: false,
    },
    hint: '"Less than 20" means price < 20.',
    explanation:
      'SELECT name FROM products WHERE price < 20; returns Pen (5) and Cup (15). The bug is the direction of the comparison.',
  },
  {
    id: 'bug_e3',
    type: 'bug',
    topic: 'Boundary operator',
    difficulty: 'easy',
    question:
      'The goal is to list products costing at least 100, including anything that costs exactly 100. This query misses one. Fix it.',
    buggyQuery: 'SELECT name FROM products WHERE price > 100;',
    fixedQuery: 'SELECT name FROM products WHERE price >= 100;',
    schema: {
      'products': {
        columns: ['id', 'name', 'price'],
        rows: [
          [1, 'Pen', 99],
          [2, 'Desk', 100],
          [3, 'Cup', 150],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Desk'],
        ['Cup'],
      ],
      orderMatters: false,
    },
    hint: '"At least 100" includes 100 itself: price >= 100.',
    explanation:
      'SELECT name FROM products WHERE price >= 100;. The original query dropped Desk, which costs exactly 100.',
  },
  {
    id: 'bug_e4',
    type: 'bug',
    topic: 'Equality vs inequality',
    difficulty: 'easy',
    question:
      'The goal is to list accounts that are NOT inactive, but this returns the inactive ones. Fix it.',
    buggyQuery: 'SELECT name FROM accounts WHERE status = \'inactive\';',
    fixedQuery: 'SELECT name FROM accounts WHERE status <> \'inactive\';',
    schema: {
      'accounts': {
        columns: ['id', 'name', 'status'],
        rows: [
          [1, 'Ada', 'active'],
          [2, 'Bo', 'inactive'],
          [3, 'Ci', 'active'],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Ada'],
        ['Ci'],
      ],
      orderMatters: false,
    },
    hint: 'Use <> (or !=) to exclude a value.',
    explanation:
      'SELECT name FROM accounts WHERE status <> \'inactive\';. The bug was using = instead of <>, which selected the inactive account instead of filtering it out.',
  },
  {
    id: 'bug_e5',
    type: 'bug',
    topic: 'NULL comparison',
    difficulty: 'easy',
    question:
      'This query returns no rows even though some customers have no phone. Write the fixed query listing customers with no phone.',
    buggyQuery: 'SELECT name FROM customers WHERE phone = NULL;',
    fixedQuery: 'SELECT name FROM customers WHERE phone IS NULL;',
    schema: {
      'customers': {
        columns: ['id', 'name', 'phone'],
        rows: [
          [1, 'Ada', '555-1'],
          [2, 'Bo', null],
          [3, 'Ci', null],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Bo'],
        ['Ci'],
      ],
      orderMatters: false,
    },
    hint: 'NULL cannot be compared with =.',
    explanation:
      'SELECT name FROM customers WHERE phone IS NULL;. In SQL, = NULL is never true; you must use IS NULL.',
  },
  {
    id: 'bug_e6',
    type: 'bug',
    topic: 'NULL comparison',
    difficulty: 'easy',
    question:
      'This query returns no rows even though some customers have a phone. Write the fixed query listing customers who have a phone.',
    buggyQuery: 'SELECT name FROM customers WHERE phone <> NULL;',
    fixedQuery: 'SELECT name FROM customers WHERE phone IS NOT NULL;',
    schema: {
      'customers': {
        columns: ['id', 'name', 'phone'],
        rows: [
          [1, 'Ada', '555-1'],
          [2, 'Bo', null],
          [3, 'Ci', '555-3'],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Ada'],
        ['Ci'],
      ],
      orderMatters: false,
    },
    hint: 'Use IS NOT NULL for non-null checks.',
    explanation:
      'SELECT name FROM customers WHERE phone IS NOT NULL;. Comparing with <> NULL is never true, so the query returned nothing.',
  },
  {
    id: 'bug_e7',
    type: 'bug',
    topic: 'Clause order',
    difficulty: 'easy',
    question:
      'This query has a clause-order syntax bug. Write the fixed query listing the two highest-paid employees.',
    buggyQuery: 'SELECT name FROM employees LIMIT 2 ORDER BY salary DESC;',
    fixedQuery: 'SELECT name FROM employees ORDER BY salary DESC LIMIT 2;',
    schema: {
      'employees': {
        columns: ['id', 'name', 'salary'],
        rows: [
          [1, 'Ada', 90000],
          [2, 'Bo', 70000],
          [3, 'Ci', 80000],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Ada'],
        ['Ci'],
      ],
      orderMatters: true,
    },
    hint: 'ORDER BY must come before LIMIT.',
    explanation:
      'SELECT name FROM employees ORDER BY salary DESC LIMIT 2;. LIMIT cannot precede ORDER BY — that is a syntax error.',
  },
  {
    id: 'bug_e8',
    type: 'bug',
    topic: 'LIKE pattern',
    difficulty: 'easy',
    question:
      'This query fails with a syntax error. Write the fixed query listing customers whose name starts with \'Al\'.',
    buggyQuery: 'SELECT name FROM customers WHERE name LIKE Al%;',
    fixedQuery: 'SELECT name FROM customers WHERE name LIKE \'Al%\';',
    schema: {
      'customers': {
        columns: ['id', 'name'],
        rows: [
          [1, 'Alice'],
          [2, 'Alan'],
          [3, 'Bo'],
          [4, 'Alex'],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Alice'],
        ['Alan'],
        ['Alex'],
      ],
      orderMatters: false,
    },
    hint: 'The LIKE pattern is a string, so it needs quotes.',
    explanation:
      'SELECT name FROM customers WHERE name LIKE \'Al%\';. Without quotes, the pattern is parsed as invalid SQL.',
  },
  {
    id: 'bug_e9',
    type: 'bug',
    topic: 'DISTINCT',
    difficulty: 'easy',
    question:
      'The goal is to list each city once, but this repeats NY. Write the fixed query.',
    buggyQuery: 'SELECT city FROM customers;',
    fixedQuery: 'SELECT DISTINCT city FROM customers;',
    schema: {
      'customers': {
        columns: ['id', 'name', 'city'],
        rows: [
          [1, 'Ada', 'NY'],
          [2, 'Bo', 'LA'],
          [3, 'Ci', 'NY'],
        ],
      },
    },
    expected: {
      columns: ['city'],
      rows: [
        ['NY'],
        ['LA'],
      ],
      orderMatters: false,
    },
    hint: 'SELECT DISTINCT removes duplicate values.',
    explanation:
      'SELECT DISTINCT city FROM customers;. Without DISTINCT, every row (including duplicate cities) is returned.',
  },
  {
    id: 'bug_e10',
    type: 'bug',
    topic: 'SUM vs COUNT',
    difficulty: 'easy',
    question:
      'The goal is the total value of all products, but this returns 3. Fix it.',
    buggyQuery: 'SELECT COUNT(price) FROM products;',
    fixedQuery: 'SELECT SUM(price) FROM products;',
    schema: {
      'products': {
        columns: ['id', 'name', 'price'],
        rows: [
          [1, 'Pen', 5],
          [2, 'Desk', 40],
          [3, 'Cup', 15],
        ],
      },
    },
    expected: {
      columns: ['SUM(price)'],
      rows: [
        [60],
      ],
      orderMatters: false,
    },
    hint: 'SUM adds the values; COUNT counts rows.',
    explanation:
      'SELECT SUM(price) FROM products; returns 60. COUNT(price) only counted how many prices exist.',
  },
  {
    id: 'bug_e11',
    type: 'bug',
    topic: 'AND vs OR',
    difficulty: 'easy',
    question:
      'The goal is cheap office products (category Office AND price under 50), but this also returns Kitchen items. Fix it.',
    buggyQuery: 'SELECT name FROM products WHERE category = \'Office\' OR price < 50;',
    fixedQuery: 'SELECT name FROM products WHERE category = \'Office\' AND price < 50;',
    schema: {
      'products': {
        columns: ['id', 'name', 'category', 'price'],
        rows: [
          [1, 'Pen', 'Office', 5],
          [2, 'Desk', 'Office', 200],
          [3, 'Clip', 'Office', 10],
          [4, 'Cup', 'Kitchen', 15],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Pen'],
        ['Clip'],
      ],
      orderMatters: false,
    },
    hint: 'Both conditions must hold: use AND.',
    explanation:
      'SELECT name FROM products WHERE category = \'Office\' AND price < 50; returns Pen and Clip. OR matched the cheap Kitchen cup too.',
  },
  {
    id: 'bug_e12',
    type: 'bug',
    topic: 'BETWEEN boundaries',
    difficulty: 'easy',
    question:
      'The goal is salaries from 50000 to 70000 inclusive, but this excludes both endpoints. Fix it.',
    buggyQuery: 'SELECT name FROM employees WHERE salary > 50000 AND salary < 70000;',
    fixedQuery: 'SELECT name FROM employees WHERE salary BETWEEN 50000 AND 70000;',
    schema: {
      'employees': {
        columns: ['id', 'name', 'salary'],
        rows: [
          [1, 'Ada', 45000],
          [2, 'Bo', 50000],
          [3, 'Ci', 65000],
          [4, 'Dex', 70000],
          [5, 'Eve', 80000],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Bo'],
        ['Ci'],
        ['Dex'],
      ],
      orderMatters: false,
    },
    hint: 'BETWEEN is inclusive of both bounds.',
    explanation:
      'SELECT name FROM employees WHERE salary BETWEEN 50000 AND 70000; returns Bo, Ci and Dex. The original excluded 50000 and 70000.',
  },
  {
    id: 'bug_e13',
    type: 'bug',
    topic: 'Alias scope',
    difficulty: 'easy',
    question:
      'This query fails with \'no such column: doubled\'. Write the fixed query listing products whose doubled price exceeds 100.',
    buggyQuery: 'SELECT name FROM products WHERE doubled > 100;',
    fixedQuery: 'SELECT name FROM products WHERE price * 2 > 100;',
    schema: {
      'products': {
        columns: ['id', 'name', 'price'],
        rows: [
          [1, 'Pen', 30],
          [2, 'Desk', 80],
          [3, 'Cup', 20],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Desk'],
      ],
      orderMatters: false,
    },
    hint: 'WHERE cannot reference a SELECT alias; repeat the expression.',
    explanation:
      'SELECT name FROM products WHERE price * 2 > 100;. SELECT aliases are not visible in WHERE, so the expression must be repeated.',
  },
  {
    id: 'bug_e14',
    type: 'bug',
    topic: 'Wrong column',
    difficulty: 'easy',
    question:
      'The goal is to list product names, but this returns ids. Write the fixed query.',
    buggyQuery: 'SELECT id FROM products;',
    fixedQuery: 'SELECT name FROM products;',
    schema: {
      'products': {
        columns: ['id', 'name', 'price'],
        rows: [
          [1, 'Pen', 5],
          [2, 'Desk', 40],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Pen'],
        ['Desk'],
      ],
      orderMatters: false,
    },
    hint: 'Select the name column, not id.',
    explanation:
      'SELECT name FROM products;. The original selected the id column instead of name.',
  },
  {
    id: 'bug_e15',
    type: 'bug',
    topic: 'ORDER BY direction',
    difficulty: 'easy',
    question:
      'The goal is most expensive first, but this lists cheapest first. Write the fixed query.',
    buggyQuery: 'SELECT name FROM products ORDER BY price ASC;',
    fixedQuery: 'SELECT name FROM products ORDER BY price DESC;',
    schema: {
      'products': {
        columns: ['id', 'name', 'price'],
        rows: [
          [1, 'Pen', 5],
          [2, 'Desk', 40],
          [3, 'Cup', 15],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Desk'],
        ['Cup'],
        ['Pen'],
      ],
      orderMatters: true,
    },
    hint: 'DESC sorts from largest to smallest.',
    explanation:
      'SELECT name FROM products ORDER BY price DESC;. ASC (the default) sorts ascending, which put the cheapest first.',
  },
  {
    id: 'bug_e16',
    type: 'bug',
    topic: 'LIMIT count',
    difficulty: 'easy',
    question:
      'The goal is the two most expensive products, but this returns three. Fix it.',
    buggyQuery: 'SELECT name FROM products ORDER BY price DESC LIMIT 3;',
    fixedQuery: 'SELECT name FROM products ORDER BY price DESC LIMIT 2;',
    schema: {
      'products': {
        columns: ['id', 'name', 'price'],
        rows: [
          [1, 'Pen', 5],
          [2, 'Desk', 40],
          [3, 'Cup', 15],
          [4, 'Lamp', 25],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Desk'],
        ['Lamp'],
      ],
      orderMatters: true,
    },
    hint: 'Use LIMIT 2.',
    explanation:
      'SELECT name FROM products ORDER BY price DESC LIMIT 2;. The LIMIT value controls how many rows come back.',
  },
  {
    id: 'bug_e17',
    type: 'bug',
    topic: 'Wrong table',
    difficulty: 'easy',
    question:
      'This query fails with \'no such column: name\' because it reads the wrong table. Write the fixed query listing customer names.',
    buggyQuery: 'SELECT name FROM orders;',
    fixedQuery: 'SELECT name FROM customers;',
    schema: {
      'customers': {
        columns: ['id', 'name'],
        rows: [
          [1, 'Ada'],
          [2, 'Bo'],
        ],
      },
      'orders': {
        columns: ['id', 'customer_id', 'total'],
        rows: [
          [1, 1, 100],
          [2, 2, 50],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Ada'],
        ['Bo'],
      ],
      orderMatters: false,
    },
    hint: 'Names live in the customers table.',
    explanation:
      'SELECT name FROM customers;. The orders table has no name column, which caused the error.',
  },
  {
    id: 'bug_e18',
    type: 'bug',
    topic: 'AVG vs SUM',
    difficulty: 'easy',
    question:
      'The goal is the average price, but this returns the total. Write the fixed query.',
    buggyQuery: 'SELECT SUM(price) FROM products;',
    fixedQuery: 'SELECT AVG(price) FROM products;',
    schema: {
      'products': {
        columns: ['id', 'name', 'price'],
        rows: [
          [1, 'Pen', 5],
          [2, 'Desk', 10],
          [3, 'Cup', 15],
        ],
      },
    },
    expected: {
      columns: ['AVG(price)'],
      rows: [
        [10],
      ],
      orderMatters: false,
    },
    hint: 'AVG computes the mean.',
    explanation:
      'SELECT AVG(price) FROM products; returns 10. SUM returned 30, which is the total, not the average.',
  },
  {
    id: 'bug_e19',
    type: 'bug',
    topic: 'ORDER BY column',
    difficulty: 'easy',
    question:
      'The goal is names in alphabetical order, but this orders by id. Write the fixed query.',
    buggyQuery: 'SELECT name FROM employees ORDER BY id ASC;',
    fixedQuery: 'SELECT name FROM employees ORDER BY name ASC;',
    schema: {
      'employees': {
        columns: ['id', 'name'],
        rows: [
          [1, 'Cara'],
          [2, 'Ada'],
          [3, 'Bo'],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Ada'],
        ['Bo'],
        ['Cara'],
      ],
      orderMatters: true,
    },
    hint: 'Sort by the name column.',
    explanation:
      'SELECT name FROM employees ORDER BY name ASC;. Sorting by id does not put the names in alphabetical order.',
  },
  {
    id: 'bug_e20',
    type: 'bug',
    topic: 'Equality vs inequality',
    difficulty: 'easy',
    question:
      'The goal is employees NOT in Sales, but this returns only Sales. Fix it.',
    buggyQuery: 'SELECT name FROM employees WHERE dept = \'Sales\';',
    fixedQuery: 'SELECT name FROM employees WHERE dept <> \'Sales\';',
    schema: {
      'employees': {
        columns: ['id', 'name', 'dept'],
        rows: [
          [1, 'Ada', 'Sales'],
          [2, 'Bo', 'Eng'],
          [3, 'Ci', 'Sales'],
          [4, 'Dex', 'Eng'],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Bo'],
        ['Dex'],
      ],
      orderMatters: false,
    },
    hint: 'Exclude Sales with <>.',
    explanation:
      'SELECT name FROM employees WHERE dept <> \'Sales\'; returns Bo and Dex. The bug was using = instead of <>.',
  },
  {
    id: 'bug_e21',
    type: 'bug',
    topic: 'DISTINCT',
    difficulty: 'easy',
    question:
      'The goal is each category once, but this repeats Office. Write the fixed query.',
    buggyQuery: 'SELECT category FROM products;',
    fixedQuery: 'SELECT DISTINCT category FROM products;',
    schema: {
      'products': {
        columns: ['id', 'name', 'category'],
        rows: [
          [1, 'Pen', 'Office'],
          [2, 'Desk', 'Office'],
          [3, 'Cup', 'Kitchen'],
        ],
      },
    },
    expected: {
      columns: ['category'],
      rows: [
        ['Office'],
        ['Kitchen'],
      ],
      orderMatters: false,
    },
    hint: 'Add DISTINCT.',
    explanation:
      'SELECT DISTINCT category FROM products;. DISTINCT collapses the duplicate Office rows into one.',
  },
  {
    id: 'bug_e22',
    type: 'bug',
    topic: 'Strict comparison',
    difficulty: 'easy',
    question:
      'The goal is quantities greater than 5, but this includes a quantity of exactly 5. Fix it.',
    buggyQuery: 'SELECT item FROM inventory WHERE qty >= 5;',
    fixedQuery: 'SELECT item FROM inventory WHERE qty > 5;',
    schema: {
      'inventory': {
        columns: ['id', 'item', 'qty'],
        rows: [
          [1, 'Pen', 5],
          [2, 'Desk', 8],
          [3, 'Cup', 3],
        ],
      },
    },
    expected: {
      columns: ['item'],
      rows: [
        ['Desk'],
      ],
      orderMatters: false,
    },
    hint: 'Greater than 5 means > 5, not >= 5.',
    explanation:
      'SELECT item FROM inventory WHERE qty > 5; returns only Desk. >= included the Pen with qty 5.',
  },
  {
    id: 'bug_e23',
    type: 'bug',
    topic: 'BETWEEN boundaries',
    difficulty: 'easy',
    question:
      'The goal is prices from 10 to 20 inclusive, but this excludes both 10 and 20. Write the fixed query.',
    buggyQuery: 'SELECT name FROM products WHERE price > 10 AND price < 20;',
    fixedQuery: 'SELECT name FROM products WHERE price BETWEEN 10 AND 20;',
    schema: {
      'products': {
        columns: ['id', 'name', 'price'],
        rows: [
          [1, 'Pen', 9],
          [2, 'Desk', 10],
          [3, 'Cup', 20],
          [4, 'Lamp', 21],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Desk'],
        ['Cup'],
      ],
      orderMatters: false,
    },
    hint: 'BETWEEN includes both endpoints.',
    explanation:
      'SELECT name FROM products WHERE price BETWEEN 10 AND 20; returns Desk and Cup. The original excluded the endpoints.',
  },
  {
    id: 'bug_e24',
    type: 'bug',
    topic: 'LIKE wildcard',
    difficulty: 'easy',
    question:
      'The goal is names ending in \'a\', but this matches names starting with \'a\'. Fix it.',
    buggyQuery: 'SELECT name FROM customers WHERE name LIKE \'a%\';',
    fixedQuery: 'SELECT name FROM customers WHERE name LIKE \'%a\';',
    schema: {
      'customers': {
        columns: ['id', 'name'],
        rows: [
          [1, 'Ada'],
          [2, 'Mina'],
          [3, 'Bo'],
          [4, 'Rex'],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Ada'],
        ['Mina'],
      ],
      orderMatters: false,
    },
    hint: 'The % goes at the start for a suffix match.',
    explanation:
      'SELECT name FROM customers WHERE name LIKE \'%a\'; returns Ada and Mina. The wildcard was on the wrong side.',
  },
  {
    id: 'bug_e25',
    type: 'bug',
    topic: 'Wrong column',
    difficulty: 'easy',
    question:
      'This query fails with \'no such column: amount\'. Write the fixed query listing order totals.',
    buggyQuery: 'SELECT amount FROM orders;',
    fixedQuery: 'SELECT total FROM orders;',
    schema: {
      'orders': {
        columns: ['id', 'ref', 'total'],
        rows: [
          [1, 'A-1', 100],
          [2, 'A-2', 50],
        ],
      },
    },
    expected: {
      columns: ['total'],
      rows: [
        [100],
        [50],
      ],
      orderMatters: false,
    },
    hint: 'The column is named total.',
    explanation:
      'SELECT total FROM orders;. There is no amount column, so the query errored.',
  },
  {
    id: 'bug_e26',
    type: 'bug',
    topic: 'Boundary operator',
    difficulty: 'easy',
    question:
      'The goal is prices at most 100, but this drops the product that costs exactly 100. Fix it.',
    buggyQuery: 'SELECT name FROM products WHERE price < 100;',
    fixedQuery: 'SELECT name FROM products WHERE price <= 100;',
    schema: {
      'products': {
        columns: ['id', 'name', 'price'],
        rows: [
          [1, 'Pen', 5],
          [2, 'Desk', 100],
          [3, 'Cup', 101],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Pen'],
        ['Desk'],
      ],
      orderMatters: false,
    },
    hint: '"At most 100" means <= 100.',
    explanation:
      'SELECT name FROM products WHERE price <= 100;. The original used <, which excluded the 100 item.',
  },
  {
    id: 'bug_e27',
    type: 'bug',
    topic: 'AND vs OR',
    difficulty: 'easy',
    question:
      'The goal is salaries over 50000 and under 80000, but this returns every employee. Write the fixed query.',
    buggyQuery: 'SELECT name FROM employees WHERE salary > 50000 OR salary < 80000;',
    fixedQuery: 'SELECT name FROM employees WHERE salary > 50000 AND salary < 80000;',
    schema: {
      'employees': {
        columns: ['id', 'name', 'salary'],
        rows: [
          [1, 'Ada', 40000],
          [2, 'Bo', 60000],
          [3, 'Ci', 90000],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Bo'],
      ],
      orderMatters: false,
    },
    hint: 'Both bounds must hold: use AND.',
    explanation:
      'SELECT name FROM employees WHERE salary > 50000 AND salary < 80000; returns only Bo. OR is true for almost every number.',
  },
  {
    id: 'bug_e28',
    type: 'bug',
    topic: 'MAX vs MIN',
    difficulty: 'easy',
    question:
      'The goal is the highest salary, but this returns the lowest. Write the fixed query.',
    buggyQuery: 'SELECT MIN(salary) FROM employees;',
    fixedQuery: 'SELECT MAX(salary) FROM employees;',
    schema: {
      'employees': {
        columns: ['id', 'name', 'salary'],
        rows: [
          [1, 'Ada', 90000],
          [2, 'Bo', 50000],
          [3, 'Ci', 70000],
        ],
      },
    },
    expected: {
      columns: ['MAX(salary)'],
      rows: [
        [90000],
      ],
      orderMatters: false,
    },
    hint: 'MAX returns the largest value.',
    explanation:
      'SELECT MAX(salary) FROM employees; returns 90000. MIN returned the smallest salary.',
  },
  {
    id: 'bug_e29',
    type: 'bug',
    topic: 'MIN vs MAX',
    difficulty: 'easy',
    question:
      'The goal is the lowest price, but this returns the highest. Write the fixed query.',
    buggyQuery: 'SELECT MAX(price) FROM products;',
    fixedQuery: 'SELECT MIN(price) FROM products;',
    schema: {
      'products': {
        columns: ['id', 'name', 'price'],
        rows: [
          [1, 'Pen', 5],
          [2, 'Desk', 40],
          [3, 'Cup', 15],
        ],
      },
    },
    expected: {
      columns: ['MIN(price)'],
      rows: [
        [5],
      ],
      orderMatters: false,
    },
    hint: 'MIN returns the smallest value.',
    explanation:
      'SELECT MIN(price) FROM products; returns 5. MAX returned the largest price.',
  },
  {
    id: 'bug_e30',
    type: 'bug',
    topic: 'IN list quoting',
    difficulty: 'easy',
    question:
      'This query fails with \'no such column: London\'. Write the fixed query listing customers in London or Paris.',
    buggyQuery: 'SELECT name FROM customers WHERE city IN (London, Paris);',
    fixedQuery: 'SELECT name FROM customers WHERE city IN (\'London\', \'Paris\');',
    schema: {
      'customers': {
        columns: ['id', 'name', 'city'],
        rows: [
          [1, 'Ada', 'London'],
          [2, 'Bo', 'Paris'],
          [3, 'Ci', 'London'],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Ada'],
        ['Bo'],
        ['Ci'],
      ],
      orderMatters: false,
    },
    hint: 'Each value in the IN list is a string and needs quotes.',
    explanation:
      'SELECT name FROM customers WHERE city IN (\'London\', \'Paris\');. Unquoted values are read as column names.',
  },
  {
    id: 'bug_m1',
    type: 'bug',
    topic: 'Wrong join key',
    difficulty: 'medium',
    question:
      'This query pairs posts with the wrong user. Write the fixed query so each post shows its author.',
    buggyQuery: 'SELECT users.name, posts.title FROM users JOIN posts ON users.id = posts.id;',
    fixedQuery: 'SELECT users.name, posts.title FROM users JOIN posts ON users.id = posts.user_id;',
    schema: {
      'users': {
        columns: ['id', 'name'],
        rows: [
          [1, 'Maya'],
          [2, 'Leo'],
        ],
      },
      'posts': {
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
      'SELECT users.name, posts.title FROM users JOIN posts ON users.id = posts.user_id;. Using posts.id matches a post to the user whose id equals the post id, which is wrong.',
  },
  {
    id: 'bug_m2',
    type: 'bug',
    topic: 'Missing JOIN condition',
    difficulty: 'medium',
    question:
      'This query produces every customer paired with every order. Write the fixed query that joins them on customer_id.',
    buggyQuery: 'SELECT customers.name, orders.total FROM customers, orders;',
    fixedQuery: 'SELECT customers.name, orders.total FROM customers JOIN orders ON customers.id = orders.customer_id;',
    schema: {
      'customers': {
        columns: ['id', 'name'],
        rows: [
          [1, 'Ada'],
          [2, 'Bo'],
          [3, 'Ci'],
        ],
      },
      'orders': {
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
        ['Ada', 50],
        ['Ada', 100],
        ['Bo', 200],
      ],
      orderMatters: false,
    },
    hint: 'Add JOIN ... ON customers.id = orders.customer_id.',
    explanation:
      'SELECT customers.name, orders.total FROM customers JOIN orders ON customers.id = orders.customer_id;. Without the ON condition, 3 customers times 3 orders produced 9 rows.',
  },
  {
    id: 'bug_m3',
    type: 'bug',
    topic: 'Missing GROUP BY',
    difficulty: 'medium',
    question:
      'This query raises "misuse of aggregate". Write the fixed query that counts products per category.',
    buggyQuery: 'SELECT category, COUNT(*) FROM products;',
    fixedQuery: 'SELECT category, COUNT(*) FROM products GROUP BY category;',
    schema: {
      'products': {
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
        ['Accessories', 1],
        ['Electronics', 2],
      ],
      orderMatters: false,
    },
    hint: 'Add GROUP BY category.',
    explanation:
      'SELECT category, COUNT(*) FROM products GROUP BY category;. A non-aggregated column must appear in GROUP BY when mixed with an aggregate.',
  },
  {
    id: 'bug_m4',
    type: 'bug',
    topic: 'HAVING vs WHERE',
    difficulty: 'medium',
    question:
      'This query has a syntax error because WHERE cannot follow GROUP BY or filter an aggregate. Write the fixed query keeping categories with more than one product.',
    buggyQuery: 'SELECT category, COUNT(*) FROM products GROUP BY category WHERE COUNT(*) > 1;',
    fixedQuery: 'SELECT category, COUNT(*) FROM products GROUP BY category HAVING COUNT(*) > 1;',
    schema: {
      'products': {
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
    hint: 'Aggregate filters belong in HAVING, after GROUP BY.',
    explanation:
      'SELECT category, COUNT(*) FROM products GROUP BY category HAVING COUNT(*) > 1;. HAVING filters groups after aggregation; WHERE cannot reference COUNT(*).',
  },
  {
    id: 'bug_m5',
    type: 'bug',
    topic: 'COUNT(*) vs COUNT(column)',
    difficulty: 'medium',
    question:
      'The goal is to count all customers, but this returns 2 because some phones are NULL. Write the fixed query.',
    buggyQuery: 'SELECT COUNT(phone) FROM customers;',
    fixedQuery: 'SELECT COUNT(*) FROM customers;',
    schema: {
      'customers': {
        columns: ['id', 'name', 'phone'],
        rows: [
          [1, 'Ada', '555-1'],
          [2, 'Bo', null],
          [3, 'Ci', '555-3'],
          [4, 'Dex', null],
        ],
      },
    },
    expected: {
      columns: ['COUNT(*)'],
      rows: [
        [4],
      ],
      orderMatters: false,
    },
    hint: 'COUNT(*) counts rows; COUNT(column) skips NULLs.',
    explanation:
      'SELECT COUNT(*) FROM customers; returns 4. COUNT(phone) ignored the two NULL phones and returned 2.',
  },
  {
    id: 'bug_m6',
    type: 'bug',
    topic: 'INNER vs LEFT JOIN',
    difficulty: 'medium',
    question:
      'The goal is every author with their book count (0 if none), but this drops authors with no books. Fix it.',
    buggyQuery: 'SELECT authors.name, COUNT(books.id) FROM authors JOIN books ON authors.id = books.author_id GROUP BY authors.name;',
    fixedQuery: 'SELECT authors.name, COUNT(books.id) FROM authors LEFT JOIN books ON authors.id = books.author_id GROUP BY authors.name;',
    schema: {
      'authors': {
        columns: ['id', 'name'],
        rows: [
          [1, 'Maya'],
          [2, 'Leo'],
          [3, 'Ivy'],
        ],
      },
      'books': {
        columns: ['id', 'title', 'author_id'],
        rows: [
          [1, 'Dawn', 1],
          [2, 'Night', 1],
          [3, 'Storm', 2],
        ],
      },
    },
    expected: {
      columns: ['name', 'COUNT(books.id)'],
      rows: [
        ['Ivy', 0],
        ['Leo', 1],
        ['Maya', 2],
      ],
      orderMatters: false,
    },
    hint: 'Use LEFT JOIN so authors with no books survive.',
    explanation:
      'SELECT authors.name, COUNT(books.id) FROM authors LEFT JOIN books ON authors.id = books.author_id GROUP BY authors.name;. The INNER JOIN silently removed Ivy, who has no books.',
  },
  {
    id: 'bug_m7',
    type: 'bug',
    topic: 'Missing DISTINCT',
    difficulty: 'medium',
    question:
      'The goal is the distinct customers who placed an order, but this repeats customer 1. Write the fixed query.',
    buggyQuery: 'SELECT customer_id FROM orders;',
    fixedQuery: 'SELECT DISTINCT customer_id FROM orders;',
    schema: {
      'orders': {
        columns: ['id', 'customer_id', 'total'],
        rows: [
          [1, 1, 100],
          [2, 1, 50],
          [3, 2, 200],
        ],
      },
    },
    expected: {
      columns: ['customer_id'],
      rows: [
        [1],
        [2],
      ],
      orderMatters: false,
    },
    hint: 'Add DISTINCT to collapse duplicates.',
    explanation:
      'SELECT DISTINCT customer_id FROM orders; returns 1 and 2. Without DISTINCT, customer 1 appears twice.',
  },
  {
    id: 'bug_m8',
    type: 'bug',
    topic: 'Wrong aggregate',
    difficulty: 'medium',
    question:
      'The goal is the total amount spent per customer, but this counts orders instead. Write the fixed query.',
    buggyQuery: 'SELECT customer, COUNT(total) FROM orders GROUP BY customer;',
    fixedQuery: 'SELECT customer, SUM(total) FROM orders GROUP BY customer;',
    schema: {
      'orders': {
        columns: ['id', 'customer', 'total'],
        rows: [
          [1, 'Ada', 100],
          [2, 'Ada', 50],
          [3, 'Bo', 75],
        ],
      },
    },
    expected: {
      columns: ['customer', 'SUM(total)'],
      rows: [
        ['Ada', 150],
        ['Bo', 75],
      ],
      orderMatters: false,
    },
    hint: 'Use SUM, not COUNT, to add amounts.',
    explanation:
      'SELECT customer, SUM(total) FROM orders GROUP BY customer; returns Ada 150 and Bo 75. COUNT returned the number of orders (2 and 1).',
  },
  {
    id: 'bug_m9',
    type: 'bug',
    topic: 'INNER vs LEFT JOIN',
    difficulty: 'medium',
    question:
      'The goal is every product with its supplier name (NULL if none), but this drops products without a supplier. Fix it.',
    buggyQuery: 'SELECT products.name, suppliers.name AS supplier FROM products JOIN suppliers ON products.supplier_id = suppliers.id;',
    fixedQuery: 'SELECT products.name, suppliers.name AS supplier FROM products LEFT JOIN suppliers ON products.supplier_id = suppliers.id;',
    schema: {
      'products': {
        columns: ['id', 'name', 'supplier_id'],
        rows: [
          [1, 'Pen', 1],
          [2, 'Desk', 2],
          [3, 'Cup', null],
        ],
      },
      'suppliers': {
        columns: ['id', 'name'],
        rows: [
          [1, 'NibCo'],
          [2, 'WoodCo'],
        ],
      },
    },
    expected: {
      columns: ['name', 'supplier'],
      rows: [
        ['Pen', 'NibCo'],
        ['Desk', 'WoodCo'],
        ['Cup', null],
      ],
      orderMatters: false,
    },
    hint: 'Use LEFT JOIN to keep products with no supplier.',
    explanation:
      'SELECT products.name, suppliers.name AS supplier FROM products LEFT JOIN suppliers ON products.supplier_id = suppliers.id;. The INNER JOIN removed Cup, which has a NULL supplier_id.',
  },
  {
    id: 'bug_m10',
    type: 'bug',
    topic: 'Clause order',
    difficulty: 'medium',
    question:
      'This query has a syntax error because HAVING appears before GROUP BY. Write the fixed query listing departments with more than two employees.',
    buggyQuery: 'SELECT dept FROM employees HAVING COUNT(*) > 2 GROUP BY dept;',
    fixedQuery: 'SELECT dept FROM employees GROUP BY dept HAVING COUNT(*) > 2;',
    schema: {
      'employees': {
        columns: ['id', 'name', 'dept'],
        rows: [
          [1, 'A', 'Eng'],
          [2, 'B', 'Eng'],
          [3, 'C', 'Eng'],
          [4, 'D', 'Sales'],
          [5, 'E', 'Sales'],
          [6, 'F', 'HR'],
        ],
      },
    },
    expected: {
      columns: ['dept'],
      rows: [
        ['Eng'],
      ],
      orderMatters: false,
    },
    hint: 'GROUP BY must come before HAVING.',
    explanation:
      'SELECT dept FROM employees GROUP BY dept HAVING COUNT(*) > 2;. HAVING filters grouped rows, so it must follow GROUP BY.',
  },
  {
    id: 'bug_m11',
    type: 'bug',
    topic: 'AND vs OR',
    difficulty: 'medium',
    question:
      'The goal is orders over 100 placed by customer 1, but this also returns other customers. Fix it.',
    buggyQuery: 'SELECT id FROM orders WHERE customer_id = 1 OR total > 100;',
    fixedQuery: 'SELECT id FROM orders WHERE customer_id = 1 AND total > 100;',
    schema: {
      'orders': {
        columns: ['id', 'customer_id', 'total'],
        rows: [
          [1, 1, 150],
          [2, 1, 50],
          [3, 2, 200],
        ],
      },
    },
    expected: {
      columns: ['id'],
      rows: [
        [1],
      ],
      orderMatters: false,
    },
    hint: 'Both conditions must hold: use AND.',
    explanation:
      'SELECT id FROM orders WHERE customer_id = 1 AND total > 100; returns order 1. OR also matched order 3 from customer 2.',
  },
  {
    id: 'bug_m12',
    type: 'bug',
    topic: 'Wrong GROUP BY column',
    difficulty: 'medium',
    question:
      'The goal is the number of employees per department, but this groups by id. Write the fixed query.',
    buggyQuery: 'SELECT dept, COUNT(*) FROM employees GROUP BY id;',
    fixedQuery: 'SELECT dept, COUNT(*) FROM employees GROUP BY dept;',
    schema: {
      'employees': {
        columns: ['id', 'name', 'dept'],
        rows: [
          [1, 'A', 'Eng'],
          [2, 'B', 'Eng'],
          [3, 'C', 'Sales'],
        ],
      },
    },
    expected: {
      columns: ['dept', 'COUNT(*)'],
      rows: [
        ['Eng', 2],
        ['Sales', 1],
      ],
      orderMatters: false,
    },
    hint: 'Group by dept, not by the unique id.',
    explanation:
      'SELECT dept, COUNT(*) FROM employees GROUP BY dept; returns Eng 2 and Sales 1. Grouping by id produced one row per employee because id is unique.',
  },
  {
    id: 'bug_h1',
    type: 'bug',
    topic: 'Window · missing PARTITION',
    difficulty: 'hard',
    question:
      'The goal is to number employees from 1 within each department, ordered by salary descending. This query numbers the whole company. Write the fixed query.',
    buggyQuery: 'SELECT name, dept, ROW_NUMBER() OVER (ORDER BY salary DESC) AS rn FROM employees;',
    fixedQuery: 'SELECT name, dept, ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) AS rn FROM employees;',
    schema: {
      'employees': {
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
      columns: ['name', 'dept', 'rn'],
      rows: [
        ['Ana', 'Eng', 1],
        ['Bo', 'Eng', 2],
        ['Cy', 'Sales', 1],
        ['Di', 'Sales', 2],
      ],
      orderMatters: false,
    },
    hint: 'Add PARTITION BY dept to the OVER clause.',
    explanation:
      'SELECT name, dept, ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) AS rn FROM employees;. PARTITION BY restarts numbering at 1 per department.',
  },
  {
    id: 'bug_h2',
    type: 'bug',
    topic: 'Correlated subquery',
    difficulty: 'hard',
    question:
      'The goal is products priced above the average of their own category, but this compares against the overall average. Write the fixed query.',
    buggyQuery: 'SELECT name FROM products p WHERE p.price > (SELECT AVG(price) FROM products);',
    fixedQuery: 'SELECT name FROM products p WHERE p.price > (SELECT AVG(price) FROM products WHERE category = p.category);',
    schema: {
      'products': {
        columns: ['id', 'name', 'category', 'price'],
        rows: [
          [1, 'Pen', 'Office', 5],
          [2, 'Desk', 'Office', 200],
          [3, 'Chair', 'Office', 100],
          [4, 'Lamp', 'Home', 300],
          [5, 'Cup', 'Home', 200],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Desk'],
        ['Lamp'],
      ],
      orderMatters: false,
    },
    hint: 'Correlate the subquery: WHERE category = p.category.',
    explanation:
      'SELECT name FROM products p WHERE p.price > (SELECT AVG(price) FROM products WHERE category = p.category); returns only Desk. The uncorrelated subquery used the global average (161) and wrongly matched Lamp and Cup too.',
  },
  {
    id: 'bug_h3',
    type: 'bug',
    topic: 'NOT IN with NULL',
    difficulty: 'hard',
    question:
      'The goal is customers with no orders, but this returns nothing because one order has a NULL customer_id. Write the fixed query.',
    buggyQuery: 'SELECT name FROM customers WHERE id NOT IN (SELECT customer_id FROM orders);',
    fixedQuery: 'SELECT name FROM customers WHERE NOT EXISTS (SELECT 1 FROM orders WHERE orders.customer_id = customers.id);',
    schema: {
      'customers': {
        columns: ['id', 'name'],
        rows: [
          [1, 'Ada'],
          [2, 'Bo'],
          [3, 'Ci'],
        ],
      },
      'orders': {
        columns: ['id', 'customer_id'],
        rows: [
          [1, 1],
          [2, 3],
          [3, null],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Bo'],
      ],
      orderMatters: false,
    },
    hint: 'NOT IN is unsafe with NULLs; use NOT EXISTS.',
    explanation:
      'SELECT name FROM customers WHERE NOT EXISTS (SELECT 1 FROM orders WHERE orders.customer_id = customers.id); returns Bo. Because the list contained NULL, every NOT IN comparison evaluated to unknown and no rows matched.',
  },
  {
    id: 'bug_h4',
    type: 'bug',
    topic: 'Self join key',
    difficulty: 'hard',
    question:
      'This query joins each employee to themselves instead of to their manager. Write the fixed query showing each employee\'s name and manager.',
    buggyQuery: 'SELECT e.name, m.name AS manager FROM employees e JOIN employees m ON e.id = m.id;',
    fixedQuery: 'SELECT e.name, m.name AS manager FROM employees e JOIN employees m ON e.manager_id = m.id;',
    schema: {
      'employees': {
        columns: ['id', 'name', 'manager_id'],
        rows: [
          [1, 'Ada', 3],
          [2, 'Bo', 3],
          [3, 'Ci', null],
          [4, 'Dex', 1],
        ],
      },
    },
    expected: {
      columns: ['name', 'manager'],
      rows: [
        ['Ada', 'Ci'],
        ['Bo', 'Ci'],
        ['Dex', 'Ada'],
      ],
      orderMatters: false,
    },
    hint: 'Join on e.manager_id = m.id.',
    explanation:
      'SELECT e.name, m.name AS manager FROM employees e JOIN employees m ON e.manager_id = m.id;. Joining on e.id = m.id matched each row to itself, so no manager was shown.',
  },
  {
    id: 'bug_h5',
    type: 'bug',
    topic: 'UNION vs UNION ALL',
    difficulty: 'hard',
    question:
      'The goal is one list of all names with no duplicates, but this repeats Bo. Write the fixed query.',
    buggyQuery: 'SELECT name FROM customers UNION ALL SELECT name FROM suppliers;',
    fixedQuery: 'SELECT name FROM customers UNION SELECT name FROM suppliers;',
    schema: {
      'customers': {
        columns: ['id', 'name'],
        rows: [
          [1, 'Ada'],
          [2, 'Bo'],
        ],
      },
      'suppliers': {
        columns: ['id', 'name'],
        rows: [
          [1, 'Ci'],
          [2, 'Bo'],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Ada'],
        ['Bo'],
        ['Ci'],
      ],
      orderMatters: false,
    },
    hint: 'UNION removes duplicates; UNION ALL keeps them.',
    explanation:
      'SELECT name FROM customers UNION SELECT name FROM suppliers; returns Ada, Bo and Ci. UNION ALL kept the duplicate Bo.',
  },
  {
    id: 'bug_h6',
    type: 'bug',
    topic: 'RANK vs ROW_NUMBER',
    difficulty: 'hard',
    question:
      'The goal is ranks where tied prices share a rank and the next rank skips (1, 1, 3, 4). This query gives 1, 1, 2, 3. Write the fixed query.',
    buggyQuery: 'SELECT name, ROW_NUMBER() OVER (ORDER BY price DESC) AS rn FROM products;',
    fixedQuery: 'SELECT name, RANK() OVER (ORDER BY price DESC) AS rn FROM products;',
    schema: {
      'products': {
        columns: ['id', 'name', 'price'],
        rows: [
          [1, 'Pen', 5],
          [2, 'Desk', 300],
          [3, 'Cup', 15],
          [4, 'Lamp', 300],
        ],
      },
    },
    expected: {
      columns: ['name', 'rn'],
      rows: [
        ['Desk', 1],
        ['Lamp', 1],
        ['Cup', 3],
        ['Pen', 4],
      ],
      orderMatters: false,
    },
    hint: 'RANK shares ranks for ties and skips the next number.',
    explanation:
      'SELECT name, RANK() OVER (ORDER BY price DESC) AS rn FROM products; gives Desk 1, Lamp 1, Cup 3, Pen 4. ROW_NUMBER would have assigned 1, 2, 3, 4 without ties.',
  },
  {
    id: 'bug_h7',
    type: 'bug',
    topic: 'LEFT JOIN · WHERE filter',
    difficulty: 'hard',
    question:
      'The goal is every department with its employee count (0 if none), but this drops the empty department. Fix it.',
    buggyQuery: 'SELECT departments.name, COUNT(employees.id) FROM departments LEFT JOIN employees ON departments.id = employees.dept_id WHERE employees.id IS NOT NULL GROUP BY departments.name;',
    fixedQuery: 'SELECT departments.name, COUNT(employees.id) FROM departments LEFT JOIN employees ON departments.id = employees.dept_id GROUP BY departments.name;',
    schema: {
      'departments': {
        columns: ['id', 'name'],
        rows: [
          [1, 'Eng'],
          [2, 'Sales'],
          [3, 'HR'],
        ],
      },
      'employees': {
        columns: ['id', 'name', 'dept_id'],
        rows: [
          [1, 'A', 1],
          [2, 'B', 1],
          [3, 'C', 2],
        ],
      },
    },
    expected: {
      columns: ['name', 'COUNT(employees.id)'],
      rows: [
        ['Eng', 2],
        ['HR', 0],
        ['Sales', 1],
      ],
      orderMatters: false,
    },
    hint: 'A WHERE on the right table turns a LEFT JOIN into an INNER JOIN.',
    explanation:
      'SELECT departments.name, COUNT(employees.id) FROM departments LEFT JOIN employees ON departments.id = employees.dept_id GROUP BY departments.name; keeps HR with count 0. The WHERE employees.id IS NOT NULL filter removed the NULL-extended row, defeating the LEFT JOIN.',
  },
  {
    id: 'bug_h8',
    type: 'bug',
    topic: 'CASE boundary',
    difficulty: 'hard',
    question:
      'The goal is to label orders \'big\' when total is at least 100 and \'small\' otherwise, but the order worth exactly 100 is mislabeled. Fix it.',
    buggyQuery: 'SELECT ref, CASE WHEN total > 100 THEN \'big\' ELSE \'small\' END AS size FROM orders;',
    fixedQuery: 'SELECT ref, CASE WHEN total >= 100 THEN \'big\' ELSE \'small\' END AS size FROM orders;',
    schema: {
      'orders': {
        columns: ['id', 'ref', 'total'],
        rows: [
          [1, 'A', 99],
          [2, 'B', 100],
          [3, 'C', 150],
        ],
      },
    },
    expected: {
      columns: ['ref', 'size'],
      rows: [
        ['A', 'small'],
        ['B', 'big'],
        ['C', 'big'],
      ],
      orderMatters: false,
    },
    hint: '"At least 100" means total >= 100.',
    explanation:
      'SELECT ref, CASE WHEN total >= 100 THEN \'big\' ELSE \'small\' END AS size FROM orders;. The original used > and labeled the 100 order \'small\'.',
  },
  {
    id: 'bug_h9',
    type: 'bug',
    topic: 'Recursive CTE anchor',
    difficulty: 'hard',
    question:
      'The goal is a column n with the numbers 1 through 5, but this starts at 0 and ends at 5. Write the fixed query.',
    buggyQuery: 'WITH RECURSIVE cnt(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM cnt WHERE n < 5) SELECT n FROM cnt;',
    fixedQuery: 'WITH RECURSIVE cnt(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM cnt WHERE n < 5) SELECT n FROM cnt;',
    schema: {
      'singleton': {
        columns: ['dummy'],
        rows: [
          [0],
        ],
      },
    },
    expected: {
      columns: ['n'],
      rows: [
        [1],
        [2],
        [3],
        [4],
        [5],
      ],
      orderMatters: true,
    },
    hint: 'The anchor SELECT defines the first value; start at 1.',
    explanation:
      'WITH RECURSIVE cnt(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM cnt WHERE n < 5) SELECT n FROM cnt;. Starting at 0 produced 0, 1, 2, 3, 4, 5 instead of 1 through 5.',
  },
  {
    id: 'bug_h10',
    type: 'bug',
    topic: 'HAVING aggregate',
    difficulty: 'hard',
    question:
      'The goal is teams whose total score is above 150, but this filters on the number of results instead. Write the fixed query.',
    buggyQuery: 'SELECT teams.name FROM teams JOIN results ON teams.id = results.team_id GROUP BY teams.name HAVING COUNT(*) > 150;',
    fixedQuery: 'SELECT teams.name FROM teams JOIN results ON teams.id = results.team_id GROUP BY teams.name HAVING SUM(results.score) > 150;',
    schema: {
      'teams': {
        columns: ['id', 'name'],
        rows: [
          [1, 'Reds'],
          [2, 'Blues'],
        ],
      },
      'results': {
        columns: ['id', 'team_id', 'score'],
        rows: [
          [1, 1, 90],
          [2, 1, 80],
          [3, 2, 60],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Reds'],
      ],
      orderMatters: false,
    },
    hint: 'Use SUM(score) in HAVING.',
    explanation:
      'SELECT teams.name FROM teams JOIN results ON teams.id = results.team_id GROUP BY teams.name HAVING SUM(results.score) > 150; returns Reds (170). COUNT(*) counted rows, not points.',
  },
  {
    id: 'bug_h11',
    type: 'bug',
    topic: 'Scalar subquery vs ALL',
    difficulty: 'hard',
    question:
      'The goal is products priced higher than every office product, but this scalar subquery only compares against one row. Write the fixed query.',
    buggyQuery: 'SELECT name FROM products WHERE price > (SELECT price FROM products WHERE category = \'Office\');',
    fixedQuery: 'SELECT name FROM products WHERE price > (SELECT MAX(price) FROM products WHERE category = \'Office\');',
    schema: {
      'products': {
        columns: ['id', 'name', 'category', 'price'],
        rows: [
          [1, 'Pen', 'Office', 5],
          [2, 'Desk', 'Office', 200],
          [3, 'Chair', 'Office', 100],
          [4, 'Lamp', 'Home', 300],
          [5, 'Cup', 'Home', 15],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['Lamp'],
      ],
      orderMatters: false,
    },
    hint: 'Compare against the MAX office price, not an arbitrary office row.',
    explanation:
      'SELECT name FROM products WHERE price > (SELECT MAX(price) FROM products WHERE category = \'Office\'); returns only Lamp (300), which beats every office price (5, 200, 100). The plain subquery returned just the first office price.',
  },
  {
    id: 'bug_h12',
    type: 'bug',
    topic: 'GROUP BY · HAVING',
    difficulty: 'hard',
    question:
      'The goal is the emails that appear more than once, but this lists every email. Write the fixed query.',
    buggyQuery: 'SELECT email FROM users GROUP BY email;',
    fixedQuery: 'SELECT email FROM users GROUP BY email HAVING COUNT(*) > 1;',
    schema: {
      'users': {
        columns: ['id', 'name', 'email'],
        rows: [
          [1, 'Ada', 'a@x.com'],
          [2, 'Bo', 'b@x.com'],
          [3, 'Ci', 'a@x.com'],
        ],
      },
    },
    expected: {
      columns: ['email'],
      rows: [
        ['a@x.com'],
      ],
      orderMatters: false,
    },
    hint: 'Add HAVING COUNT(*) > 1.',
    explanation:
      'SELECT email FROM users GROUP BY email HAVING COUNT(*) > 1; returns a@x.com. GROUP BY alone kept one row per email without filtering duplicates.',
  },
  {
    id: 'bug_h13',
    type: 'bug',
    topic: 'LEFT JOIN · IS NULL',
    difficulty: 'hard',
    question:
      'The goal is publishers that have released no books, but this returns nothing because it uses an INNER JOIN. Write the fixed query.',
    buggyQuery: 'SELECT publishers.name FROM publishers JOIN books ON publishers.id = books.publisher_id WHERE books.id IS NULL;',
    fixedQuery: 'SELECT publishers.name FROM publishers LEFT JOIN books ON publishers.id = books.publisher_id WHERE books.id IS NULL;',
    schema: {
      'publishers': {
        columns: ['id', 'name'],
        rows: [
          [1, 'OneBook'],
          [2, 'NoBooks'],
          [3, 'Third'],
        ],
      },
      'books': {
        columns: ['id', 'title', 'publisher_id'],
        rows: [
          [1, 'X', 1],
          [2, 'Y', 1],
          [3, 'Z', 3],
        ],
      },
    },
    expected: {
      columns: ['name'],
      rows: [
        ['NoBooks'],
      ],
      orderMatters: false,
    },
    hint: 'Use LEFT JOIN so unmatched publishers get NULL book rows.',
    explanation:
      'SELECT publishers.name FROM publishers LEFT JOIN books ON publishers.id = books.publisher_id WHERE books.id IS NULL; returns NoBooks. With an INNER JOIN, rows with NULL book ids never exist.',
  },
  {
    id: 'bug_h14',
    type: 'bug',
    topic: 'Window · OVER () vs ORDER BY',
    difficulty: 'hard',
    question:
      'The goal is each product with the overall average price repeated on every row, but this computes a running average. Write the fixed query.',
    buggyQuery: 'SELECT name, price, AVG(price) OVER (ORDER BY id) AS avg FROM products;',
    fixedQuery: 'SELECT name, price, AVG(price) OVER () AS avg FROM products;',
    schema: {
      'products': {
        columns: ['id', 'name', 'price'],
        rows: [
          [1, 'Pen', 5],
          [2, 'Desk', 300],
          [3, 'Cup', 15],
          [4, 'Lamp', 80],
        ],
      },
    },
    expected: {
      columns: ['name', 'price', 'avg'],
      rows: [
        ['Pen', 5, 100],
        ['Desk', 300, 100],
        ['Cup', 15, 100],
        ['Lamp', 80, 100],
      ],
      orderMatters: false,
    },
    hint: 'AVG(price) OVER () uses the whole table; adding ORDER BY makes it cumulative.',
    explanation:
      'SELECT name, price, AVG(price) OVER () AS avg FROM products; shows 100 on every row. With ORDER BY id, the frame grows row by row, producing a running average.',
  },
  {
    id: 'bug_h15',
    type: 'bug',
    topic: 'Correlated MAX',
    difficulty: 'hard',
    question:
      'The goal is the name and salary of the highest earner in each department, but this only returns the max salary per department. Write the fixed query.',
    buggyQuery: 'SELECT dept, MAX(salary) FROM employees GROUP BY dept;',
    fixedQuery: 'SELECT name, salary FROM employees e WHERE salary = (SELECT MAX(salary) FROM employees WHERE dept = e.dept);',
    schema: {
      'employees': {
        columns: ['id', 'name', 'dept', 'salary'],
        rows: [
          [1, 'Ada', 'Eng', 80000],
          [2, 'Bo', 'Eng', 90000],
          [3, 'Ci', 'Sales', 50000],
          [4, 'Dex', 'Sales', 60000],
        ],
      },
    },
    expected: {
      columns: ['name', 'salary'],
      rows: [
        ['Bo', 90000],
        ['Dex', 60000],
      ],
      orderMatters: false,
    },
    hint: 'Compare each row against its own department max using a correlated subquery.',
    explanation:
      'SELECT name, salary FROM employees e WHERE salary = (SELECT MAX(salary) FROM employees WHERE dept = e.dept); returns Bo (90000) and Dex (60000). The GROUP BY version returned departments, not people.',
  },
  {
    id: 'bug_h16',
    type: 'bug',
    topic: 'LAG · missing PARTITION',
    difficulty: 'hard',
    question:
      'The goal is each sale with the previous amount for the same product, but this takes the previous row across all products. Write the fixed query.',
    buggyQuery: 'SELECT product, day, amount, LAG(amount) OVER (ORDER BY day) AS prev FROM sales;',
    fixedQuery: 'SELECT product, day, amount, LAG(amount) OVER (PARTITION BY product ORDER BY day) AS prev FROM sales;',
    schema: {
      'sales': {
        columns: ['id', 'product', 'day', 'amount'],
        rows: [
          [1, 'Pen', 1, 10],
          [2, 'Desk', 1, 5],
          [3, 'Pen', 2, 7],
          [4, 'Desk', 2, 8],
        ],
      },
    },
    expected: {
      columns: ['product', 'day', 'amount', 'prev'],
      rows: [
        ['Desk', 1, 5, null],
        ['Desk', 2, 8, 5],
        ['Pen', 1, 10, null],
        ['Pen', 2, 7, 10],
      ],
      orderMatters: false,
    },
    hint: 'Add PARTITION BY product so LAG looks within each product.',
    explanation:
      'SELECT product, day, amount, LAG(amount) OVER (PARTITION BY product ORDER BY day) AS prev FROM sales;. Without PARTITION BY, the previous amount could come from a different product.',
  },
  {
    id: 'bug_h17',
    type: 'bug',
    topic: 'COUNT DISTINCT',
    difficulty: 'hard',
    question:
      'The goal is each buyer with the number of distinct products they bought, but this counts duplicate purchases separately. Write the fixed query.',
    buggyQuery: 'SELECT buyers.name, COUNT(purchases.product_id) AS count FROM buyers JOIN purchases ON buyers.id = purchases.buyer_id GROUP BY buyers.name;',
    fixedQuery: 'SELECT buyers.name, COUNT(DISTINCT purchases.product_id) AS count FROM buyers JOIN purchases ON buyers.id = purchases.buyer_id GROUP BY buyers.name;',
    schema: {
      'buyers': {
        columns: ['id', 'name'],
        rows: [
          [1, 'Ada'],
          [2, 'Bo'],
          [3, 'Ci'],
        ],
      },
      'purchases': {
        columns: ['id', 'buyer_id', 'product_id'],
        rows: [
          [1, 1, 10],
          [2, 1, 10],
          [3, 2, 20],
          [4, 1, 30],
          [5, 3, 20],
        ],
      },
    },
    expected: {
      columns: ['name', 'count'],
      rows: [
        ['Ada', 2],
        ['Bo', 1],
        ['Ci', 1],
      ],
      orderMatters: false,
    },
    hint: 'Use COUNT(DISTINCT product_id).',
    explanation:
      'SELECT buyers.name, COUNT(DISTINCT purchases.product_id) AS count FROM buyers JOIN purchases ON buyers.id = purchases.buyer_id GROUP BY buyers.name; gives Ada 2, Bo 1, Ci 1. Plain COUNT counted Ada\'s repeated product twice.',
  },
  {
    id: 'bug_h18',
    type: 'bug',
    topic: 'HAVING vs WHERE',
    difficulty: 'hard',
    question:
      'This query raises "misuse of aggregate" because WHERE cannot hold AVG. Write the fixed query listing departments whose average salary is above 60000.',
    buggyQuery: 'SELECT dept FROM employees WHERE AVG(salary) > 60000 GROUP BY dept;',
    fixedQuery: 'SELECT dept FROM employees GROUP BY dept HAVING AVG(salary) > 60000;',
    schema: {
      'employees': {
        columns: ['id', 'name', 'dept', 'salary'],
        rows: [
          [1, 'Ada', 'Eng', 80000],
          [2, 'Bo', 'Eng', 90000],
          [3, 'Ci', 'Sales', 50000],
          [4, 'Dex', 'Sales', 60000],
          [5, 'Eve', 'HR', 55000],
        ],
      },
    },
    expected: {
      columns: ['dept'],
      rows: [
        ['Eng'],
      ],
      orderMatters: false,
    },
    hint: 'Filter aggregates in HAVING, after GROUP BY.',
    explanation:
      'SELECT dept FROM employees GROUP BY dept HAVING AVG(salary) > 60000; returns Eng (85000). WHERE runs before grouping and cannot use AVG.',
  },
]

export default fixBug
