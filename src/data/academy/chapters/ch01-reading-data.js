export default {
  slug: 'reading-data',
  number: 1,
  title: 'Reading Data',
  subtitle: 'SELECT, aliases, and DISTINCT',
  accent: '#1554c7',
  accentInk: '#1449a3',
  icon: '{ }',
  practiceTopic: 'table-query',
  objectives: [
    'Read a table: columns, rows, and the primary key',
    'Ask for specific columns with SELECT',
    'Rename and calculate columns with AS',
    'Remove duplicate rows with DISTINCT',
    'Explain why row order is never guaranteed',
  ],
  sections: [
    {
      id: 'what-is-a-table',
      number: '1.1',
      title: 'What is a table?',
      blocks: [
        {
          type: 'theory',
          body: [
            'A table is a grid. Columns have names and each one holds a single kind of value. Rows are the individual records, and every row is one whole thing — one customer, one product, one order.',
            'The three tables in this book are a tiny online shop. `customers` records who signed up, `products` records what is for sale, and `orders` links the two together.',
          ],
        },
        {
          type: 'result',
          label: 'customers',
          caption: 'Six rows, four columns. This is the grid every query in this chapter starts from.',
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
        {
          type: 'theory',
          body: [
            'Look at the `id` column. Every value is different, and no value is ever reused. A column like that is called a **primary key**, and it is the handle SQL uses when it needs to point at exactly one row.',
            'You will meet one more table in this book, in section 2.3. It follows the same two rules: every table has a primary key, and every column holds one type of value only.',
          ],
        },
        {
          type: 'code',
          caption: 'The shortest useful query there is.',
          code: 'SELECT * FROM customers;',
          expect: {
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
        {
          type: 'note',
          tone: 'tip',
          title: 'This is not a toy database',
          body:
            'Every example in this book runs against a real SQLite database inside your browser — the same one SQL Quiz uses. Nothing is mocked up, so what you read here is exactly what the engine does.',
        },
      ],
    },
    {
      id: 'select-basics',
      number: '1.2',
      title: 'SELECT basics',
      blocks: [
        {
          type: 'theory',
          body: [
            '`SELECT` is how you ask a question. It always comes first, it is followed by the columns you want, and then `FROM` names the table those columns live in.',
            'The star in `SELECT *` means "every column". It is the fastest way to look around, and the worst way to write a query you intend to keep. Name the columns you need: the result is smaller, the query reads like a sentence, and you are not affected when somebody adds a column to the table next year.',
          ],
        },
        { type: 'visual', name: 'clause-order', highlight: ['select', 'from'] },
        {
          type: 'flow',
          caption: 'A projection: same rows, fewer columns.',
          steps: [
            {
              label: 'SELECT * FROM customers',
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
            {
              label: 'SELECT name, city',
              note: 'Four columns become two. The rows are untouched — only the columns changed.',
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
          ],
        },
        {
          type: 'code',
          code: 'SELECT name, city FROM customers;',
          expect: {
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
          type: 'code',
          tone: 'bad',
          caption:
            'This one does not fail, which is what makes it dangerous. SQLite reads `city` as an alias for `name`, so you get back a column *called* `city` full of names. Two columns always need a comma between them.',
          code: 'SELECT name city FROM customers;',
          expect: {
            columns: ['city'],
            rows: [
              ['Alice'],
              ['Bob'],
              ['Carol'],
              ['Dave'],
              ['Eve'],
              ['Frank'],
            ],
          },
        },
        {
          type: 'note',
          tone: 'info',
          title: 'Semicolons are optional',
          body:
            'A semicolon ends a statement. SQL Quiz lets you leave it off, so write your queries however you like — but add it when you run more than one statement in a row.',
        },
      ],
    },
    {
      id: 'aliases-and-computed',
      number: '1.3',
      title: 'Aliases and computed columns',
      blocks: [
        {
          type: 'theory',
          body: [
            'An alias gives a column a different name for the length of one query. Write `AS` and then a single word. SQL then uses your alias in the column heading of the result instead of the real column name.',
            'You can go further and calculate a value that is not in the table at all. Any arithmetic you write in the `SELECT` list is evaluated row by row, and if you give it an alias the result arrives with a readable name.',
          ],
        },
        {
          type: 'code',
          code: 'SELECT name AS product, price FROM products;',
          expect: {
            columns: ['product', 'price'],
            rows: [
              ['Laptop', 999.99],
              ['Mouse', 19.99],
              ['Keyboard', 49.99],
              ['Monitor', 199.99],
              ['Desk', 299.99],
              ['Chair', 149.99],
              ['Mouse Pad', 9.99],
            ],
          },
        },
        {
          type: 'code',
          caption: 'The `stock` column is still just a number in the table. `double_stock` exists only here.',
          code: 'SELECT name, stock * 2 AS double_stock FROM products;',
          expect: {
            columns: ['name', 'double_stock'],
            rows: [
              ['Laptop', 50],
              ['Mouse', 240],
              ['Keyboard', 160],
              ['Monitor', 80],
              ['Desk', 30],
              ['Chair', 120],
              ['Mouse Pad', 400],
            ],
          },
        },
        {
          type: 'code',
          caption: 'An alias with a space in it needs double quotes around the alias only.',
          code: 'SELECT name AS "Product Name", price FROM products;',
          expect: {
            columns: ['Product Name', 'price'],
            rows: [
              ['Laptop', 999.99],
              ['Mouse', 19.99],
              ['Keyboard', 49.99],
              ['Monitor', 199.99],
              ['Desk', 299.99],
              ['Chair', 149.99],
              ['Mouse Pad', 9.99],
            ],
          },
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'An alias renames the result, not the table',
          body:
            'After `SELECT price AS cost`, the column `cost` exists in that result set and nowhere else. `products` still has a column called `price`, and every other query still sees it under that name.',
        },
      ],
    },
    {
      id: 'distinct',
      number: '1.4',
      title: 'DISTINCT',
      blocks: [
        {
          type: 'theory',
          body: [
            'Tables happily hold the same value more than once. Three of our six customers live in London, and asking "which cities do we have?" should not hand back London three times.',
            '`DISTINCT` throws duplicate rows away and keeps one of each. It goes immediately after `SELECT`, before the column list.',
          ],
        },
        {
          type: 'flow',
          caption: 'Seven rows collapse to three.',
          steps: [
            {
              label: 'SELECT category FROM products',
              columns: ['category'],
              rows: [
                ['Electronics'],
                ['Electronics'],
                ['Accessories'],
                ['Electronics'],
                ['Furniture'],
                ['Furniture'],
                ['Accessories'],
              ],
            },
            {
              label: 'SELECT DISTINCT category FROM products',
              note: 'Three distinct values. One row each.',
              columns: ['category'],
              rows: [['Accessories'], ['Electronics'], ['Furniture']],
            },
          ],
        },
        {
          type: 'code',
          code: 'SELECT DISTINCT city FROM customers ORDER BY city;',
          expect: {
            columns: ['city'],
            rows: [['Berlin'], ['London'], ['New York'], ['Paris']],
          },
        },
        {
          type: 'theory',
          body: [
            'Here is the part that catches people out. `DISTINCT` compares whole rows. It only removes something when the *entire* row is a duplicate, so selecting more columns gives `DISTINCT` more to compare and it keeps more rows.',
          ],
        },
        {
          type: 'code',
          caption: 'Seven rows in, seven rows out — every category/stock pair is unique.',
          code: 'SELECT DISTINCT category, stock FROM products ORDER BY category, stock;',
          expect: {
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
        {
          type: 'note',
          tone: 'tip',
          title: 'DISTINCT promises nothing about order',
          body:
            'Which of the duplicate rows survives is undefined, and so is the order the survivors come back in. Whenever the order matters to you, add `ORDER BY`.',
        },
      ],
    },
    {
      id: 'reading-the-result',
      number: '1.5',
      title: 'Reading the result set',
      blocks: [
        {
          type: 'theory',
          body: [
            'A query hands you back a table, and it follows two rules that catch out almost everyone at first.',
            'Column order is exactly the order you typed the columns. And the order of the rows is **not guaranteed** — unless you ask for it with `ORDER BY`, the database is free to return the rows in whatever order is cheapest to produce, and that can change between runs.',
          ],
        },
        {
          type: 'result',
          label: 'Seven rows, no ORDER BY',
          caption: 'Same data as below. The difference is that nothing promised an order.',
          columns: ['category', 'stock'],
          rows: [
            ['Electronics', 25],
            ['Electronics', 120],
            ['Accessories', 80],
            ['Electronics', 40],
            ['Furniture', 15],
            ['Furniture', 60],
            ['Accessories', 200],
          ],
        },
        {
          type: 'code',
          caption: 'Now the order is fixed, and you can rely on it.',
          code: 'SELECT DISTINCT category, stock FROM products ORDER BY category, stock;',
          expect: {
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
        {
          type: 'theory',
          body: [
            'That is the whole of Chapter 1. You can now name the columns you want, rename them, calculate new values from them, and throw away duplicates — and you know which of your results you are allowed to trust.',
            'Chapter 2 puts the `WHERE` clause in front of all of this and teaches you to pick out the rows you actually want.',
          ],
        },
      ],
    },
  ],
  commonMistakes: [
    '`SELECT name, FROM products;` — a trailing comma just before `FROM` is a syntax error.',
    '`SELECT name city FROM products;` — two columns need a comma between them.',
    '`SELECT count FROM products;` — `count` is a function, so it needs brackets: `COUNT(*)`. On its own, SQL looks for a column called `count` and finds none.',
    'Leaving `SELECT *` in code you intend to keep. It pulls columns you did not ask for and breaks quietly the day somebody adds one.',
    'Renaming a column with `AS` and expecting the table to change. The alias lives in the result set only.',
  ],
  cheatsheet: {
    title: 'SELECT cheat sheet',
    columns: ['You want to…', 'Write'],
    rows: [
      ['Every column, all rows', 'SELECT * FROM products;'],
      ['Specific columns', 'SELECT name, price FROM products;'],
      ['Rename a column', 'SELECT price AS cost FROM products;'],
      ['Use a name with a space', 'SELECT price AS "Unit Cost" FROM products;'],
      ['Calculate a value', 'SELECT stock * 2 FROM products;'],
      ['Drop duplicate rows', 'SELECT DISTINCT category FROM products;'],
    ],
  },
}
