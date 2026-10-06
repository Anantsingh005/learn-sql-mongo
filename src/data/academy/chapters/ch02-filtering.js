export default {
  slug: 'filtering',
  number: 2,
  title: 'Filtering',
  subtitle: 'WHERE, AND/OR/NOT, NULL, IN, BETWEEN, LIKE',
  accent: '#3d7f55',
  accentInk: '#316644',
  icon: '⌕',
  practiceTopic: 'table-query',
  objectives: [
    'Keep only the rows you want with WHERE',
    'Compare values with the six operators',
    'Combine conditions with AND, OR, and NOT',
    'Handle NULL correctly with IS NULL',
    'Match lists with IN, ranges with BETWEEN, text with LIKE',
  ],
  sections: [
    {
      id: 'where-basics',
      number: '2.1',
      title: 'WHERE and comparison operators',
      blocks: [
        {
          type: 'theory',
          body: [
            '`SELECT` chooses columns. `WHERE` chooses rows. It goes after the table name and keeps a row only when the condition is true for it.',
            'The condition is a comparison, and there are six comparison operators. Two of them mean "equals" and "not equals", and the other four are the ordinary greater-than and less-than signs.',
          ],
        },
        {
          type: 'result',
          label: 'The six operators',
          columns: ['Operator', 'Means', 'Example with price = 19.99'],
          rows: [
            ['=', 'equals', 'true'],
            ['<> or !=', 'not equals', 'false'],
            ['>', 'greater than', 'false'],
            ['>=', 'greater than or equal', 'true'],
            ['<', 'less than', 'false'],
            ['<=', 'less than or equal', 'true'],
          ],
        },
        {
          type: 'code',
          code: "SELECT name, city FROM customers WHERE city = 'London';",
          expect: {
            columns: ['name', 'city'],
            rows: [
              ['Alice', 'London'],
              ['Carol', 'London'],
              ['Frank', 'London'],
            ],
          },
        },
        {
          type: 'flow',
          caption: 'Six rows in, three out.',
          steps: [
            {
              label: 'customers',
              columns: ['id', 'name', 'city'],
              rows: [
                [1, 'Alice', 'London'],
                [2, 'Bob', 'New York'],
                [3, 'Carol', 'London'],
                [4, 'Dave', 'Paris'],
                [5, 'Eve', 'Berlin'],
                [6, 'Frank', 'London'],
              ],
            },
            {
              label: "WHERE city = 'London'",
              note: 'London appears three times in the table, so three rows survive.',
              columns: ['id', 'name', 'city'],
              rows: [
                [1, 'Alice', 'London'],
                [3, 'Carol', 'London'],
                [6, 'Frank', 'London'],
              ],
            },
          ],
        },
        {
          type: 'code',
          code: 'SELECT name, price FROM products WHERE price > 100;',
          expect: {
            columns: ['name', 'price'],
            rows: [
              ['Laptop', 999.99],
              ['Monitor', 199.99],
              ['Desk', 299.99],
              ['Chair', 149.99],
            ],
          },
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'Text needs single quotes, numbers do not',
          body:
            "`city = 'London'` compares text and the quotes are part of the syntax. `city = London` is read as a column name, not a value, and fails. Numbers are the opposite: write `price > 100`, never `price > '100'`.",
        },
      ],
    },
    {
      id: 'and-or-not',
      number: '2.2',
      title: 'AND, OR, NOT',
      blocks: [
        {
          type: 'theory',
          body: [
            'One condition is rarely enough. `AND` keeps a row only when every condition is true. `OR` keeps a row when at least one is true. `NOT` flips a single condition.',
            'Write them with `WHERE a AND b`, not with separate `WHERE` keywords. `AND` and `OR` can be chained as many times as you like.',
          ],
        },
        {
          type: 'code',
          code: "SELECT name, price FROM products WHERE category = 'Electronics' AND price > 100;",
          expect: {
            columns: ['name', 'price'],
            rows: [
              ['Laptop', 999.99],
              ['Monitor', 199.99],
            ],
          },
        },
        {
          type: 'code',
          code: 'SELECT name, category FROM products WHERE category = \'Furniture\' OR price > 200;',
          expect: {
            columns: ['name', 'category'],
            rows: [
              ['Laptop', 'Electronics'],
              ['Desk', 'Furniture'],
              ['Chair', 'Furniture'],
            ],
          },
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'AND binds tighter than OR',
          body:
            'This is the single most common logic bug in SQL, and it is worth internalising now. `AND` is evaluated first, exactly like multiplication beats addition. So a chain with both is read in the order `a AND b OR c`, which is *not* how it looks.',
        },
        {
          type: 'code',
          tone: 'bad',
          caption:
            'Read this as `price > 200 AND stock < 20`, then `OR category = \'Furniture\'`. The Laptop is not Furniture and fails the stock test, so it is dropped.',
          code: "SELECT name, price, stock FROM products WHERE category = 'Furniture' OR price > 200 AND stock < 20;",
          expect: {
            columns: ['name', 'price', 'stock'],
            rows: [
              ['Desk', 299.99, 15],
              ['Chair', 149.99, 60],
            ],
          },
        },
        {
          type: 'code',
          caption: 'Parentheses say what you mean. The Desk now survives, because both Furniture chairs do.',
          code: "SELECT name, price, stock FROM products WHERE (category = 'Furniture' OR price > 200) AND stock < 20;",
          expect: {
            columns: ['name', 'price', 'stock'],
            rows: [
              ['Desk', 299.99, 15],
            ],
          },
        },
        {
          type: 'code',
          code: "SELECT name FROM products WHERE NOT category = 'Accessories';",
          expect: {
            columns: ['name'],
            rows: [['Laptop'], ['Mouse'], ['Monitor'], ['Desk'], ['Chair']],
          },
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'Bracket every group',
          body:
            'Even when you are sure of the precedence, add the brackets. `(a OR b) AND c` costs nothing and the next person to read it will not have to think about it.',
        },
      ],
    },
    {
      id: 'null',
      number: '2.3',
      title: 'NULL and three-valued logic',
      blocks: [
        {
          type: 'theory',
          body: [
            'So far every cell in the shop had a value. Real data does not work that way, so we add a fourth table to the same shop: `reviews`. Two of its ratings and one of its comments are empty.',
            'SQL calls that emptiness `NULL`, and `NULL` means "no value here" — not zero, not an empty string, not false. It means the value is *unknown*, and that changes how every comparison behaves.',
          ],
        },
        {
          type: 'result',
          label: 'reviews',
          caption: 'Ratings 2 and 4 are NULL, and so is the comment on review 3.',
          columns: ['id', 'product_id', 'rating', 'comment'],
          rows: [
            [1, 1, 5, 'Fast and quiet'],
            [2, 1, null, 'Arrived late'],
            [3, 4, 4, null],
            [4, 7, null, 'Good value'],
            [5, 3, 3, 'Keys feel cheap'],
          ],
        },
        {
          type: 'theory',
          body: [
            'A comparison against `NULL` can never be true, because SQL has no way of knowing what the missing value might have been. A rating of `NULL` is not "not greater than 3" — nobody knows.',
            'So every comparison involving `NULL` returns a third answer that is neither true nor false. SQL calls this **three-valued logic**, and it is why `NULL` rows quietly disappear from your results instead of showing up as a surprise.',
          ],
        },
        {
          type: 'code',
          tone: 'bad',
          caption:
            'Zero rows. `=` can never be true against a missing value, so this asks for something impossible.',
          code: 'SELECT id, rating FROM reviews WHERE rating = NULL;',
          expect: {
            columns: ['id', 'rating'],
            rows: [],
          },
        },
        {
          type: 'code',
          caption: 'This is the correct way to ask for missing values.',
          code: 'SELECT id, rating FROM reviews WHERE rating IS NULL;',
          expect: {
            columns: ['id', 'rating'],
            rows: [
              [2, null],
              [4, null],
            ],
          },
        },
        {
          type: 'flow',
          caption:
            'The dangerous one. Three reviews scored above 3 — but only two of them come back.',
          steps: [
            {
              label: 'reviews',
              columns: ['id', 'product_id', 'rating'],
              rows: [
                [1, 1, 5],
                [2, 1, null],
                [3, 4, 4],
                [4, 7, null],
                [5, 3, 3],
              ],
            },
            {
              label: 'WHERE rating > 3',
              note:
                'Reviews 2 and 4 vanished, because comparing a missing value can never be true. They are neither greater nor less than 3 — they are unknown.',
              columns: ['id', 'product_id', 'rating'],
              rows: [
                [1, 1, 5],
                [3, 4, 4],
              ],
            },
          ],
        },
        {
          type: 'code',
          code: 'SELECT id, rating IS NULL AS is_missing FROM reviews;',
          expect: {
            columns: ['id', 'is_missing'],
            rows: [
              [1, 0],
              [2, 1],
              [3, 0],
              [4, 1],
              [5, 0],
            ],
          },
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'NULL is contagious',
          body:
            'Once a `NULL` gets into a `WHERE` clause it poisons that row and the row disappears. This is not a bug to work around — it is SQL correctly refusing to guess. If a missing value should count as zero, you have to say so explicitly, and Chapter 6 shows you how.',
        },
        {
          type: 'note',
          tone: 'info',
          title: 'NULL is not the same as an empty string',
          body:
            "`''` is a real value: the text with nothing in it. `NULL` is the absence of a value. `comment = ''` finds genuinely empty comments; `comment IS NULL` finds missing ones. They are different questions.",
        },
      ],
    },
    {
      id: 'in-between',
      number: '2.4',
      title: 'IN and BETWEEN',
      blocks: [
        {
          type: 'theory',
          body: [
            'Chains of `OR` get ugly fast. To say "is one of these four values", use `IN` with a bracketed list. To say "is between this low and this high", use `BETWEEN` with the two ends.',
            'Both work with numbers and with text, and both have a negated form: `NOT IN` and `NOT BETWEEN`.',
          ],
        },
        {
          type: 'code',
          code: "SELECT name, city FROM customers WHERE city IN ('London', 'Paris') ORDER BY id;",
          expect: {
            columns: ['name', 'city'],
            rows: [
              ['Alice', 'London'],
              ['Carol', 'London'],
              ['Dave', 'Paris'],
              ['Frank', 'London'],
            ],
          },
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'BETWEEN includes both ends',
          body:
            '`BETWEEN 20 AND 200` means 20 or 200, not just what is strictly between them. There is no separate "exclusive between" in standard SQL.',
        },
        {
          type: 'code',
          code: 'SELECT name, price FROM products WHERE price BETWEEN 20 AND 200;',
          expect: {
            columns: ['name', 'price'],
            rows: [
              ['Keyboard', 49.99],
              ['Monitor', 199.99],
              ['Chair', 149.99],
            ],
          },
        },
        {
          type: 'code',
          code: 'SELECT name FROM products WHERE id NOT IN (1, 2, 3);',
          expect: {
            columns: ['name'],
            rows: [['Monitor'], ['Desk'], ['Chair'], ['Mouse Pad']],
          },
        },
        {
          type: 'code',
          tone: 'bad',
          caption:
            'Zero rows, and the reason is nastier than it looks. A `NULL` anywhere inside a `NOT IN` list makes every comparison unknown, so nothing can ever be returned.',
          code: 'SELECT id FROM reviews WHERE product_id NOT IN (1, NULL);',
          expect: {
            columns: ['id'],
            rows: [],
          },
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'NOT IN plus NULL equals nothing',
          body:
            'Review 3 has `product_id` 4, which is not 1, so you would expect it back. It is not, because the list also contains `NULL` and the comparison against `NULL` is never true. If your list can contain missing values, reach for `NOT EXISTS` instead — you will meet it in Chapter 5.',
        },
      ],
    },
    {
      id: 'like',
      number: '2.5',
      title: 'LIKE patterns',
      blocks: [
        {
          type: 'theory',
          body: [
            '`=` asks for an exact match. `LIKE` asks for a *shape*. You write the pattern as text, with two wildcards: `%` stands in for any run of characters, including none at all, and `_` stands in for exactly one character.',
            'This is the tool for "starts with", "ends with", and "contains" — the three things you cannot express with `=` at all.',
          ],
        },
        {
          type: 'result',
          label: 'The products table',
          caption: 'We will match against these seven names.',
          columns: ['id', 'name'],
          rows: [
            [1, 'Laptop'],
            [2, 'Mouse'],
            [3, 'Keyboard'],
            [4, 'Monitor'],
            [5, 'Desk'],
            [6, 'Chair'],
            [7, 'Mouse Pad'],
          ],
        },
        {
          type: 'code',
          caption: 'Starts with M — three matches, including the two-word one.',
          code: "SELECT name FROM products WHERE name LIKE 'M%';",
          expect: {
            columns: ['name'],
            rows: [['Mouse'], ['Monitor'], ['Mouse Pad']],
          },
        },
        {
          type: 'code',
          caption: 'Ends with Pad.',
          code: "SELECT name FROM products WHERE name LIKE '%Pad';",
          expect: { columns: ['name'], rows: [['Mouse Pad']] },
        },
        {
          type: 'code',
          caption: 'Contains an o anywhere. Five of the seven names qualify.',
          code: "SELECT name FROM products WHERE name LIKE '%o%';",
          expect: {
            columns: ['name'],
            rows: [['Laptop'], ['Mouse'], ['Keyboard'], ['Monitor'], ['Mouse Pad']],
          },
        },
        {
          type: 'code',
          caption:
            'The underscore is exactly one character, so this matches Mouse and nothing else. Monitor has an n where the pattern wants a u.',
          code: "SELECT name FROM products WHERE name LIKE 'M_use';",
          expect: { columns: ['name'], rows: [['Mouse']] },
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'Case is ignored, and numbers are not for LIKE',
          body:
            'SQLite compares text case-insensitively, so `LIKE \'mouse%\'` finds `Mouse`. Also, `LIKE` only works on text — to find prices in a range, reach for `BETWEEN`.',
        },
        {
          type: 'theory',
          body: [
            'Chapter 2 is done. You can now keep exactly the rows you want, combine the conditions correctly, handle missing values honestly, and match text by shape.',
            'Chapter 3 puts the rows in order and cuts the list down to the handful you actually need.',
          ],
        },
      ],
    },
  ],
  commonMistakes: [
    '`WHERE city = London` — text values need single quotes around them.',
    '`WHERE rating = NULL` — use `IS NULL`. A comparison against `NULL` is never true, so you get zero rows.',
    '`WHERE a OR b AND c` — `AND` is evaluated first. Write the brackets you mean.',
    '`WHERE id NOT IN (1, 2, NULL)` — one `NULL` in the list makes the whole query return nothing.',
    '`WHERE price LIKE \'100\'` — `LIKE` is for text. Use `BETWEEN` or `>` for numbers.',
  ],
  cheatsheet: {
    title: 'WHERE cheat sheet',
    columns: ['You want to…', 'Write'],
    rows: [
      ['Rows where a column equals a value', "WHERE city = 'London'"],
      ['Not equal', "WHERE city <> 'London'"],
      ['Both conditions true', "WHERE a = 1 AND b = 2"],
      ['Either condition true', "WHERE a = 1 OR b = 2"],
      ['The opposite of a condition', 'WHERE NOT status = \'closed\''],
      ['One of several values', "WHERE city IN ('London', 'Paris')"],
      ['Inside a range, both ends included', 'WHERE price BETWEEN 20 AND 200'],
      ['Starts with / ends with / contains', "WHERE name LIKE 'M%' / '%Pad' / '%o%'"],
      ['Exactly one character', "WHERE name LIKE 'M_use'"],
      ['Missing values', 'WHERE rating IS NULL'],
      ['Values that exist', 'WHERE rating IS NOT NULL'],
    ],
  },
}
