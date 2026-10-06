export default {
  slug: 'sorting-limiting',
  number: 3,
  title: 'Sorting & Limiting',
  subtitle: 'ORDER BY, LIMIT, OFFSET, and clause order',
  accent: '#a5680f',
  accentInk: '#8a550b',
  icon: '↕',
  practiceTopic: 'table-query',
  objectives: [
    'Sort results with ORDER BY, ascending and descending',
    'Sort by more than one column',
    'Always add a tiebreaker to a sort',
    'Cut results down with LIMIT and page through with OFFSET',
    'Write every clause in the order the grammar demands',
  ],
  sections: [
    {
      id: 'order-by',
      number: '3.1',
      title: 'ORDER BY',
      blocks: [
        {
          type: 'theory',
          body: [
            'Recall from section 1.5 that a query gives you no ordering at all unless you ask for one. `ORDER BY` is how you ask, and it goes at the very end of the query.',
            'It sorts smallest first by default. Add `DESC` to flip it, and `ASC` if you want to be explicit about the default.',
          ],
        },
        {
          type: 'code',
          code: 'SELECT name, price FROM products ORDER BY price;',
          expect: {
            columns: ['name', 'price'],
            rows: [
              ['Mouse Pad', 9.99],
              ['Mouse', 19.99],
              ['Keyboard', 49.99],
              ['Chair', 149.99],
              ['Monitor', 199.99],
              ['Desk', 299.99],
              ['Laptop', 999.99],
            ],
          },
        },
        {
          type: 'code',
          code: 'SELECT name, price FROM products ORDER BY price DESC;',
          expect: {
            columns: ['name', 'price'],
            rows: [
              ['Laptop', 999.99],
              ['Desk', 299.99],
              ['Monitor', 199.99],
              ['Chair', 149.99],
              ['Keyboard', 49.99],
              ['Mouse', 19.99],
              ['Mouse Pad', 9.99],
            ],
          },
        },
        {
          type: 'flow',
          caption: 'Same seven rows, arranged.',
          steps: [
            {
              label: 'Unsorted',
              note: 'This is the order the rows happen to sit in the table.',
              columns: ['name', 'price'],
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
            {
              label: 'ORDER BY price',
              note: 'Cheapest first.',
              columns: ['name', 'price'],
              rows: [
                ['Mouse Pad', 9.99],
                ['Mouse', 19.99],
                ['Keyboard', 49.99],
                ['Chair', 149.99],
                ['Monitor', 199.99],
                ['Desk', 299.99],
                ['Laptop', 999.99],
              ],
            },
          ],
        },
        {
          type: 'code',
          caption:
            'Our dates are stored as text in the `YYYY-MM-DD` format, and that format sorts correctly as plain text. This is exactly why you should always write dates that way.',
          code: 'SELECT name, signup_date FROM customers ORDER BY signup_date;',
          expect: {
            columns: ['name', 'signup_date'],
            rows: [
              ['Alice', '2022-08-01'],
              ['Bob', '2022-10-12'],
              ['Carol', '2023-01-15'],
              ['Dave', '2023-02-20'],
              ['Eve', '2023-03-05'],
              ['Frank', '2023-06-30'],
            ],
          },
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'Text sorts alphabetically, not by meaning',
          body:
            'Sorting by `name` gives you Alice, Bob, Carol, Chair — because "Carol" comes before "Chair" letter by letter. That is alphabetical order, and it is the only order `ORDER BY` knows how to do for text.',
        },
      ],
    },
    {
      id: 'multiple-keys',
      number: '3.2',
      title: 'Multiple sort keys',
      blocks: [
        {
          type: 'theory',
          body: [
            '`ORDER BY` takes as many columns as you like, separated by commas. SQL sorts by the first one, then breaks ties with the second, then the third, and so on.',
            'You can also set a direction per key. `ORDER BY category, price DESC` groups by category first, and sorts each group by price from most expensive down.',
          ],
        },
        {
          type: 'code',
          code: 'SELECT name, category, price FROM products ORDER BY category, price;',
          expect: {
            columns: ['name', 'category', 'price'],
            rows: [
              ['Mouse Pad', 'Accessories', 9.99],
              ['Keyboard', 'Accessories', 49.99],
              ['Mouse', 'Electronics', 19.99],
              ['Monitor', 'Electronics', 199.99],
              ['Laptop', 'Electronics', 999.99],
              ['Chair', 'Furniture', 149.99],
              ['Desk', 'Furniture', 299.99],
            ],
          },
        },
        {
          type: 'code',
          caption: 'Same grouping, but each group runs from expensive to cheap.',
          code: 'SELECT name, category, price FROM products ORDER BY category, price DESC;',
          expect: {
            columns: ['name', 'category', 'price'],
            rows: [
              ['Keyboard', 'Accessories', 49.99],
              ['Mouse Pad', 'Accessories', 9.99],
              ['Laptop', 'Electronics', 999.99],
              ['Monitor', 'Electronics', 199.99],
              ['Mouse', 'Electronics', 19.99],
              ['Desk', 'Furniture', 299.99],
              ['Chair', 'Furniture', 149.99],
            ],
          },
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'Always finish with a unique column',
          body:
            'When several rows share the value you sorted on, SQL is free to return those rows in any order. Add `id` as a final key and the whole ordering becomes deterministic. See the next section for why this matters.',
        },
      ],
    },
    {
      id: 'ties',
      number: '3.3',
      title: 'Ties need a tiebreaker',
      blocks: [
        {
          type: 'theory',
          body: [
            'Three customers are in London. Sort by `city` and all three tie, so SQL gives you no promise about which of Alice, Carol and Frank appears first. It may be stable today and different tomorrow.',
            'The fix costs one word: add a second key that breaks the tie. `ORDER BY city, name` is completely fixed, because no two customers share a name.',
          ],
        },
        {
          type: 'code',
          tone: 'bad',
          caption:
            'The three London rows are in no particular order. This query is not wrong exactly — it is just not a promise you can rely on.',
          code: 'SELECT name, city FROM customers ORDER BY city;',
          expect: {
            columns: ['name', 'city'],
            rows: [
              ['Eve', 'Berlin'],
              ['Alice', 'London'],
              ['Carol', 'London'],
              ['Frank', 'London'],
              ['Bob', 'New York'],
              ['Dave', 'Paris'],
            ],
          },
        },
        {
          type: 'code',
          caption: 'Now every row has a defined place.',
          code: 'SELECT name, city FROM customers ORDER BY city, name;',
          expect: {
            columns: ['name', 'city'],
            rows: [
              ['Eve', 'Berlin'],
              ['Alice', 'London'],
              ['Carol', 'London'],
              ['Frank', 'London'],
              ['Bob', 'New York'],
              ['Dave', 'Paris'],
            ],
          },
        },
        {
          type: 'note',
          tone: 'info',
          title: 'When the row set itself is fixed, you are safe',
          body:
            'This only bites you when rows can tie. If your `WHERE` clause has already narrowed things down to one row per value, an `ORDER BY` on its own is perfectly reliable.',
        },
      ],
    },
    {
      id: 'limit-offset',
      number: '3.4',
      title: 'LIMIT and OFFSET',
      blocks: [
        {
          type: 'theory',
          body: [
            'A "top 5" page does not need all 646 rows. `LIMIT` tells the database to stop after a number of rows, and it is the last clause in the query.',
            '`OFFSET` skips that many rows first, which is how you build a paginated list. The two go together, and counting starts at zero.',
          ],
        },
        {
          type: 'code',
          caption: 'Page 1 — the three most expensive products.',
          code: 'SELECT name, price FROM products ORDER BY price DESC LIMIT 3;',
          expect: {
            columns: ['name', 'price'],
            rows: [
              ['Laptop', 999.99],
              ['Desk', 299.99],
              ['Monitor', 199.99],
            ],
          },
        },
        {
          type: 'code',
          caption: 'Page 2 — skip the first three, then take three.',
          code: 'SELECT name, price FROM products ORDER BY price DESC LIMIT 3 OFFSET 3;',
          expect: {
            columns: ['name', 'price'],
            rows: [
              ['Chair', 149.99],
              ['Keyboard', 49.99],
              ['Mouse', 19.99],
            ],
          },
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'LIMIT without ORDER BY is a lottery',
          body:
            '`SELECT name FROM products LIMIT 3;` returns *some* three rows and gives you no say in which. The database is free to choose whichever three are cheapest to fetch. If you want a specific three, you have to say how to pick them.',
        },
        {
          type: 'note',
          tone: 'info',
          title: 'OFFSET is slow on big tables',
          body:
            'The database still has to walk past every skipped row to find where to start. On the small tables in this book that costs nothing, but on a table with millions of rows, deep pagination gets slow. Keyset pagination — remember the last value you saw and filter on it — avoids the problem entirely.',
        },
      ],
    },
    {
      id: 'clause-order',
      number: '3.5',
      title: 'The order of the clauses',
      blocks: [
        {
          type: 'theory',
          body: [
            'One last thing, and it is the bug that costs the most marks. A `SELECT` query is not a free-form bag of clauses — the grammar has a fixed slot for each one, and you must fill the slots in order.',
            'You may leave a slot out. You may never move one backwards.',
          ],
        },
        { type: 'visual', name: 'clause-order' },
        {
          type: 'code',
          tone: 'bad',
          caption:
            'This does not run at all. `WHERE` cannot come after `ORDER BY` — by the time the query reaches the `WHERE`, the ordering is already finished.',
          code: 'SELECT name FROM products ORDER BY price WHERE price > 50;',
          expectError: true,
        },
        {
          type: 'code',
          tone: 'bad',
          caption: 'Same mistake, other way round. `ORDER BY` after `LIMIT` is a syntax error too.',
          code: 'SELECT name FROM products LIMIT 3 ORDER BY price DESC;',
          expectError: true,
        },
        {
          type: 'code',
          caption: 'The same query written correctly. Four products cost more than 50.',
          code: 'SELECT name, price FROM products WHERE price > 50 ORDER BY price;',
          expect: {
            columns: ['name', 'price'],
            rows: [
              ['Chair', 149.99],
              ['Monitor', 199.99],
              ['Desk', 299.99],
              ['Laptop', 999.99],
            ],
          },
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'The order you read is the order the engine runs',
          body:
            'The database filters with `WHERE` first, then groups, then filters the groups, then sorts, and only then takes the first `LIMIT` rows. That is why you cannot use `WHERE` to filter after a `GROUP BY` — Chapter 6 introduces `HAVING` for exactly that.',
        },
        {
          type: 'note',
          tone: 'info',
          title: 'Keywords do not care about capitals',
          body:
            '`select name from products;` and `SELECT name FROM products;` are the same query. SQL keywords are case-insensitive; your table and column names are not.',
        },
        {
          type: 'theory',
          body: [
            'That is the end of Part One. You can read data, filter it, and put it in order — which is the whole vocabulary behind most of the questions in SQL Quiz.',
            'Part Two joins things together: Chapter 4 combines two tables side by side with `JOIN`, and Chapter 5 nests one query inside another and stacks two result sets with `UNION`.',
          ],
        },
      ],
    },
  ],
  commonMistakes: [
    '`SELECT name FROM products LIMIT 3;` with no `ORDER BY` — you have asked for three rows, not for *these* three rows.',
    '`ORDER BY city` where several rows share that city — add a second key so the order is actually fixed.',
    '`ORDER BY price WHERE price > 50;` — `WHERE` must come before `ORDER BY`. The grammar does not allow it the other way round.',
    '`SELECT name FROM customers ORDER BY name;` expecting newest first — `ORDER BY` sorts alphabetically unless you point it at a different column.',
    'Forgetting `ORDER BY` inside a `LIMIT` subquery — the outer query then sorts an arbitrary handful of rows.',
  ],
  cheatsheet: {
    title: 'ORDER BY & LIMIT cheat sheet',
    columns: ['You want to…', 'Write'],
    rows: [
      ['Sort smallest to largest', 'ORDER BY price'],
      ['Sort largest to smallest', 'ORDER BY price DESC'],
      ['Sort by text A to Z', 'ORDER BY name ASC'],
      ['Group, then sort inside each group', 'ORDER BY category, price DESC'],
      ['Break ties deterministically', 'ORDER BY city, name'],
      ['First 10 rows', 'LIMIT 10'],
      ['Rows 11 to 20', 'LIMIT 10 OFFSET 10'],
      ['Every clause in order', 'SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT'],
    ],
  },
}
