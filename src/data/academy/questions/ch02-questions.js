export default {
  'where-basics': [
    {
      id: 'q2.1.1',
      prompt: 'The Mouse is priced at 19.99. Which of these conditions is **true** for that row?',
      options: ['price < 19.99', 'price <> 19.99', 'price >= 19.99', 'price > 19.99'],
      answerIndex: 2,
      explanation:
        '`>=` means greater than **or equal**, so a price of exactly 19.99 passes it. `<` and `>` are strict and both fail, and `<>` is the not-equals operator.',
      check: {
        code: 'SELECT name, price FROM products WHERE price >= 19.99;',
        columns: ['name', 'price'],
        rows: [
          ['Laptop', 999.99],
          ['Mouse', 19.99],
          ['Keyboard', 49.99],
          ['Monitor', 199.99],
          ['Desk', 299.99],
          ['Chair', 149.99],
        ],
      },
    },
    {
      id: 'q2.1.2',
      prompt:
        'Why does `WHERE city = London` fail when `WHERE city = \'London\'` works?',
      options: [
        'SQL requires double quotes around text',
        'Without the quotes, `London` is read as a column name rather than as a value',
        'Text values must be written in UPPERCASE',
        'It does not fail — both forms are accepted',
      ],
      answerIndex: 1,
      explanation:
        'Single quotes are part of the syntax, not decoration. Unquoted, `London` is looked up as a column, and there is no column by that name. Numbers are the opposite: write `price > 100`, never `price > \'100\'`.',
    },
    {
      id: 'q2.1.3',
      prompt: 'How many rows does `SELECT name, price FROM products WHERE price > 100;` return?',
      options: ['2', '3', '4', '7'],
      answerIndex: 2,
      explanation:
        'Four products cost more than 100: the Laptop, Monitor, Desk and Chair.',
      check: {
        code: 'SELECT name, price FROM products WHERE price > 100;',
        columns: ['name', 'price'],
        rows: [
          ['Laptop', 999.99],
          ['Monitor', 199.99],
          ['Desk', 299.99],
          ['Chair', 149.99],
        ],
      },
    },
  ],

  'and-or-not': [
    {
      id: 'q2.2.1',
      prompt:
        'How many rows does `SELECT name FROM products WHERE category = \'Furniture\' OR price > 200;` return?',
      options: ['2', '3', '4', '5'],
      answerIndex: 1,
      explanation:
        'OR keeps a row when **either** test passes. The Desk and Chair are Furniture, and the Laptop clears 200. Nobody is counted twice.',
      check: {
        code: "SELECT name FROM products WHERE category = 'Furniture' OR price > 200;",
        columns: ['name'],
        rows: [['Laptop'], ['Desk'], ['Chair']],
      },
    },
    {
      id: 'q2.2.2',
      prompt:
        'In `WHERE category = \'Furniture\' OR price > 200 AND stock < 20`, the Laptop is missing from the result. Why?',
      options: [
        'AND binds tighter, so the Laptop is tested on `price > 200 AND stock < 20` alone — and its stock of 25 fails',
        'The Laptop costs less than 200',
        'AND cancels out anything that also matches OR',
        'The Laptop has no category',
      ],
      answerIndex: 0,
      explanation:
        'AND is evaluated first, exactly as multiplication beats addition. So the Laptop must satisfy `price > 200 AND stock < 20`; it passes the price test but fails the stock test, and it is not Furniture either, so both branches reject it.',
    },
    {
      id: 'q2.2.3',
      prompt:
        'How many of the seven products are **not** Accessories? Use `NOT category = \'Accessories\'`.',
      options: ['2', '3', '5', '6'],
      answerIndex: 2,
      explanation:
        'Only the Mouse Pad is an Accessory, so five products survive `NOT category = \'Accessories\'`.',
      check: {
        code: "SELECT name FROM products WHERE NOT category = 'Accessories';",
        columns: ['name'],
        rows: [['Laptop'], ['Mouse'], ['Monitor'], ['Desk'], ['Chair']],
      },
    },
  ],

  null: [
    {
      id: 'q2.3.1',
      prompt: 'Why does `SELECT id FROM reviews WHERE rating = NULL;` return zero rows?',
      options: [
        'No review has ever been left unrated',
        'A comparison against NULL can never be true, so the condition can never be satisfied',
        '`=` is the wrong operator for numbers',
        'It does return the two unrated reviews, but hides them from the result',
      ],
      answerIndex: 1,
      explanation:
        'SQL cannot know what a missing value might have been, so it refuses to guess. A rating of NULL is not "not greater than 3" — nobody knows, and unknown is not true.',
    },
    {
      id: 'q2.3.2',
      prompt: 'Pick the query that finds the reviews that have **no rating**.',
      options: [
        'SELECT id FROM reviews WHERE rating = NULL;',
        'SELECT id FROM reviews WHERE NOT rating;',
        'SELECT id FROM reviews WHERE rating IS NULL;',
        'SELECT id FROM reviews WHERE rating IS NOT NULL;',
      ],
      answerIndex: 2,
      explanation:
        '`IS NULL` is the only way to ask for a missing value. It is not an operator that can be combined with `=` or `!=`.',
      check: {
        code: 'SELECT id FROM reviews WHERE rating IS NULL;',
        columns: ['id'],
        rows: [[2], [4]],
      },
    },
    {
      id: 'q2.3.3',
      prompt:
        'Review 3 has a rating of 4. What does `rating IS NULL AS is_missing` report for it?',
      options: ['0', '1', 'NULL', '4'],
      answerIndex: 0,
      explanation:
        '`IS NULL` is a test that answers yes or no, and SQLite reports it as 1 for true and 0 for false. Review 3 has a real rating, so the answer is 0.',
      check: {
        code: 'SELECT id, rating IS NULL AS is_missing FROM reviews;',
        columns: ['id', 'is_missing'],
        rows: [[1, 0], [2, 1], [3, 0], [4, 1], [5, 0]],
      },
    },
  ],

  'in-between': [
    {
      id: 'q2.4.1',
      prompt: 'Why does `WHERE price BETWEEN 20 AND 200` return the Monitor at 199.99 but not the Mouse at 19.99?',
      options: [
        'BETWEEN excludes both ends, so only values strictly between 20 and 200 qualify',
        'BETWEEN includes both ends, so 199.99 is inside the range and 19.99 is below it',
        'BETWEEN only works on whole numbers, so 19.99 is discarded',
        'The Mouse was removed by an earlier DISTINCT',
      ],
      answerIndex: 1,
      explanation:
        'BETWEEN is inclusive at both ends. There is no separate "exclusive between" in standard SQL.',
    },
    {
      id: 'q2.4.2',
      prompt: 'How many rows does `SELECT name FROM products WHERE id NOT IN (1, 2, 3);` return?',
      options: ['3', '4', '5', '7'],
      answerIndex: 1,
      explanation:
        'Four products sit outside the first three ids: the Monitor, Desk, Chair and Mouse Pad.',
      check: {
        code: 'SELECT name FROM products WHERE id NOT IN (1, 2, 3);',
        columns: ['name'],
        rows: [['Monitor'], ['Desk'], ['Chair'], ['Mouse Pad']],
      },
    },
    {
      id: 'q2.4.3',
      prompt:
        '`WHERE product_id NOT IN (1, NULL)` returns nothing at all, even though review 3 has a `product_id` of 4. Why?',
      options: [
        'The query is buggy, because 4 is not in the list and should have been returned',
        'A NULL anywhere inside a NOT IN list makes every comparison unknown, so no row can ever be returned',
        'NOT IN cannot be used with numbers',
        'The list has to be sorted before NOT IN will work',
      ],
      answerIndex: 1,
      explanation:
        'This is the nastiest trap in the chapter. One NULL in the list poisons every comparison, so the result is always empty. If your list can contain missing values, use NOT EXISTS instead.',
    },
  ],

  like: [
    {
      id: 'q2.5.1',
      prompt: 'What does the pattern `LIKE \'M%\'` match?',
      options: [
        'Names that start with M',
        'Names that end with M',
        'Names containing exactly one M',
        'Names starting with M followed by a space',
      ],
      answerIndex: 0,
      explanation:
        '`%` stands in for any run of characters, including none at all. At the start of the pattern it means "then anything follows", which is how you ask for starts-with.',
    },
    {
      id: 'q2.5.2',
      prompt: 'Why does `WHERE name LIKE \'M_use\'` match Mouse but not Monitor?',
      options: [
        '`_` is exactly one character, and Monitor has an n where the pattern wants a u',
        '`_` matches any run of characters, so Monitor should match too',
        'Monitor is not in the products table',
        'LIKE only ever matches the first word of a name',
      ],
      answerIndex: 0,
      explanation:
        'The underscore is a single-character wildcard, not a wildcard run. That is the whole difference between `M_use` and `M%use`.',
      check: {
        code: "SELECT name FROM products WHERE name LIKE 'M_use';",
        columns: ['name'],
        rows: [['Mouse']],
      },
    },
    {
      id: 'q2.5.3',
      prompt: 'Which two product names are **missing** from `WHERE name LIKE \'%o%\'`?',
      options: [
        'Desk and Chair — neither name contains the letter o',
        'Laptop and Desk — the pattern only matches lowercase o',
        'Desk and Chair — LIKE cannot match the last row of a table',
        'None are missing; all seven names contain an o',
      ],
      answerIndex: 0,
      explanation:
        'Five of the seven names qualify. The Desk and the Chair are the two with no letter o anywhere in them.',
      check: {
        code: "SELECT name FROM products WHERE name LIKE '%o%';",
        columns: ['name'],
        rows: [['Laptop'], ['Mouse'], ['Keyboard'], ['Monitor'], ['Mouse Pad']],
      },
    },
  ],
}
