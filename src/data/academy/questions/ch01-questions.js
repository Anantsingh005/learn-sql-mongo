export default {
  'what-is-a-table': [
    {
      id: 'q1.1.1',
      prompt: 'What makes `customers.id` a **primary key**?',
      options: [
        'It is the first column in the table',
        'It is the only column that holds a number',
        'Every value in it is different, and no value is ever reused',
        'It was declared with the PRIMARY KEY keyword',
      ],
      answerIndex: 2,
      explanation:
        'Uniqueness is the whole idea. A primary key is the handle SQL uses to point at exactly one row, so no two rows may share a value and a value is never reused once it is gone.',
    },
    {
      id: 'q1.1.2',
      prompt: 'You want every column of every customer. Which query is right?',
      options: [
        'SELECT FROM customers;',
        'SELECT customers;',
        'SELECT name FROM *;',
        'SELECT * FROM customers;',
      ],
      answerIndex: 3,
      explanation:
        'The star stands in for every column, and it comes after SELECT and before FROM. The other three are syntax errors.',
      check: {
        code: 'SELECT * FROM customers;',
        columns: ['id', 'name', 'city', 'signup_date'],
        rows: [
          [1, 'Alice', 'London', '2022-08-01'],
          [2, 'Bob', 'New York', '2022-10-12'],
          [3, 'Carol', 'London', '2023-01-15'],
          [4, 'Dave', 'Paris', '2023-02-20'],
          [5, 'Eve', 'Berlin', '2023-03-05'],
          [6, 'Frank', 'London', '2023-06-30'],
        ],
      },
    },
  ],

  'select-basics': [
    {
      id: 'q1.2.1',
      prompt: 'Why does `SELECT name city FROM customers;` return one column called `city` full of names?',
      options: [
        'SQL treats the space as a comma and returns both columns anyway',
        'It is a syntax error, because two columns always need a comma',
        'SQL reads `city` as an alias for `name`, so you get names under the heading `city`',
        'It returns a column called `name` containing the city values',
      ],
      answerIndex: 2,
      explanation:
        'This is the dangerous one, because it does not fail. SQLite reads `city` as an alias for `name`. Two columns always need a comma between them.',
    },
    {
      id: 'q1.2.2',
      prompt: 'Pick the query that returns the `name` and `city` of every customer.',
      options: [
        'SELECT name, city FROM customers;',
        'SELECT name city FROM customers;',
        'SELECT name FROM customers, city;',
        'SELECT name, city;',
      ],
      answerIndex: 0,
      explanation:
        'Name the columns you want, separated by commas, then FROM the table they live in.',
      check: {
        code: 'SELECT name, city FROM customers;',
        columns: ['name', 'city'],
        rows: [
          ['Alice', 'London'],
          ['Bob', 'New York'],
          ['Carol', 'London'],
          ['Dave', 'Paris'],
          ['Eve', 'Berlin'],
          ['Frank', 'London'],
        ],
      },
    },
    {
      id: 'q1.2.3',
      prompt: 'How many columns does `SELECT * FROM customers;` return?',
      options: ['1', '4', '6', '7'],
      answerIndex: 1,
      explanation:
        'Six rows, four columns: `id`, `name`, `city`, `signup_date`. Six is the row count, which is the number people reach for by mistake.',
      check: {
        code: 'SELECT * FROM customers;',
        columns: ['id', 'name', 'city', 'signup_date'],
        rows: [
          [1, 'Alice', 'London', '2022-08-01'],
          [2, 'Bob', 'New York', '2022-10-12'],
          [3, 'Carol', 'London', '2023-01-15'],
          [4, 'Dave', 'Paris', '2023-02-20'],
          [5, 'Eve', 'Berlin', '2023-03-05'],
          [6, 'Frank', 'London', '2023-06-30'],
        ],
      },
    },
  ],

  'aliases-and-computed': [
    {
      id: 'q1.3.1',
      prompt:
        'The Laptop has a `stock` of 25. What does `SELECT name, stock * 2 AS double_stock FROM products;` show in `double_stock` for that row?',
      options: ['25', '50', '12.5', 'NULL, because stock is not a number'],
      answerIndex: 1,
      explanation:
        'The arithmetic happens in the SELECT list. `double_stock` is a new value that exists only in this result — the stored `stock` is untouched.',
      check: {
        code: "SELECT name, stock * 2 AS double_stock FROM products WHERE name = 'Laptop';",
        columns: ['name', 'double_stock'],
        rows: [['Laptop', 50]],
      },
    },
    {
      id: 'q1.3.2',
      prompt: 'What is the column heading in the result of `SELECT name AS "Product Name" FROM products;`?',
      options: ['name', 'Product Name', 'name AS "Product Name"', 'AS "Product Name"'],
      answerIndex: 1,
      explanation:
        'SQL uses your alias as the heading. An alias containing a space needs double quotes around the alias only — not around the whole expression.',
      check: {
        code: 'SELECT name AS "Product Name" FROM products;',
        columns: ['Product Name'],
        rows: [
          ['Laptop'],
          ['Mouse'],
          ['Keyboard'],
          ['Monitor'],
          ['Desk'],
          ['Chair'],
          ['Mouse Pad'],
        ],
      },
    },
    {
      id: 'q1.3.3',
      prompt: 'After running `SELECT price AS cost FROM products;`, what has happened to the `products` table?',
      options: [
        'The `price` column has been renamed to `cost` in the table',
        'Nothing — `cost` exists only in that result set, and `products` still has `price`',
        'The query is rejected, because `cost` is not a real column',
        'The table now has both a `price` and a `cost` column',
      ],
      answerIndex: 1,
      explanation:
        'An alias renames the result, not the table. Every other query still sees the column under its real name.',
    },
  ],

  distinct: [
    {
      id: 'q1.4.1',
      prompt: 'How many rows does `SELECT DISTINCT city FROM customers;` return?',
      options: ['3', '4', '6', '7'],
      answerIndex: 1,
      explanation:
        'Six customers, four cities. London appears three times — Alice, Carol and Frank — and DISTINCT keeps one of them.',
      check: {
        code: 'SELECT DISTINCT city FROM customers ORDER BY city;',
        columns: ['city'],
        rows: [['Berlin'], ['London'], ['New York'], ['Paris']],
      },
    },
    {
      id: 'q1.4.2',
      prompt:
        'Why does `SELECT DISTINCT category, stock FROM products;` return all seven rows instead of fewer?',
      options: [
        'DISTINCT only works on a single column',
        'DISTINCT needs an ORDER BY to do anything',
        'Every category/stock pair in the table is already unique',
        'The query needs a WHERE clause to find the duplicates',
      ],
      answerIndex: 2,
      explanation:
        'DISTINCT compares whole rows. Selecting more columns gives it more to compare, so it finds fewer duplicates and keeps more rows.',
    },
  ],

  'reading-the-result': [
    {
      id: 'q1.5.1',
      prompt: 'Which statement about a result set is true?',
      options: [
        'Column order is the table\'s own order, not the order you typed the columns',
        'Column order is the order you typed the columns, and row order is not guaranteed without ORDER BY',
        'SQL guarantees both column order and row order in every query',
        'Row order is guaranteed as long as the query has no LIMIT',
      ],
      answerIndex: 1,
      explanation:
        'Columns come back in the order you typed them. Rows come back in whatever order is cheapest for the database unless you ask for a specific one.',
    },
    {
      id: 'q1.5.2',
      prompt: 'Pick the query whose **row order** you are allowed to rely on.',
      options: [
        'SELECT DISTINCT category, stock FROM products;',
        'SELECT name FROM products WHERE price > 100;',
        'SELECT * FROM customers;',
        'SELECT DISTINCT category, stock FROM products ORDER BY category, stock;',
      ],
      answerIndex: 3,
      explanation:
        'Only ORDER BY makes a promise about order. The other three return the same seven rows in an order the database was free to choose.',
      check: {
        code: 'SELECT DISTINCT category, stock FROM products ORDER BY category, stock;',
        columns: ['category', 'stock'],
        rows: [
          ['Accessories', 80],
          ['Accessories', 200],
          ['Electronics', 25],
          ['Electronics', 40],
          ['Electronics', 120],
          ['Furniture', 15],
          ['Furniture', 60],
        ],
      },
    },
  ],
}
