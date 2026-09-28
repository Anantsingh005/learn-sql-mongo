export default {
  'order-by': [
    {
      id: 'q3.1.1',
      prompt: 'Pick the query that lists the products from **most expensive to cheapest**.',
      options: [
        'SELECT name, price FROM products ORDER BY price;',
        'SELECT name, price FROM products ORDER BY price DESC;',
        'SELECT name, price FROM products ORDER BY price ASC;',
        'SELECT name, price FROM products WHERE price > 50;',
      ],
      answerIndex: 1,
      explanation:
        '`ORDER BY` sorts smallest first, so ascending is the direction you get for free. `DESC` is what flips it, and `ASC` only spells out the default. The last option filters but never reorders, so it returns four rows in whatever order the database feels like.',
      check: {
        code: 'SELECT name, price FROM products ORDER BY price DESC;',
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
      id: 'q3.1.2',
      prompt:
        'A plain `SELECT name, price FROM products;` gives you no ordering at all — in this database it happens to come back starting with the Laptop. What do you add to make the **Mouse Pad** lead instead?',
      options: [
        '`ORDER BY price ASC;` — cheapest first, and ascending is already the default direction',
        '`WHERE price < 100;` — the expensive rows never reach the result',
        '`ORDER BY name;` — alphabetical order puts the Mouse Pad first',
        '`LIMIT 1;` — the database returns its smallest row',
      ],
      answerIndex: 0,
      explanation:
        'The Laptop is simply the first row in the table, and nothing in that query asked for a sort. `ORDER BY price` is the only thing that puts the cheapest product on top, and `ASC` adds nothing because it is already the default — writing it makes the query clearer, not different.',
      check: {
        code: 'SELECT name, price FROM products ORDER BY price;',
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
  ],

  'multiple-keys': [
    {
      id: 'q3.2.1',
      prompt:
        'Pick the query that lists products **grouped by category, cheapest first inside each group**.',
      options: [
        'SELECT name, category, price FROM products ORDER BY price, category;',
        'SELECT name, category, price FROM products ORDER BY category, price;',
        'SELECT name, category, price FROM products ORDER BY category, price DESC;',
        'SELECT name, category, price FROM products GROUP BY category;',
      ],
      answerIndex: 1,
      explanation:
        'The **first** key does the grouping, so `category` has to come first. The second key only settles rows that tie on the first, and `price` ascending puts the cheapest of each group at the top. The first option reverses the two, which gives you one global price sort with the categories in scattered blocks — and since no two products share a price, that second key never even gets used.',
      check: {
        code: 'SELECT name, category, price FROM products ORDER BY category, price;',
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
      id: 'q3.2.2',
      prompt:
        'Run `SELECT name, category, price FROM products ORDER BY category, price DESC;`. What is the **very first row**?',
      options: [
        'Keyboard, Accessories, 49.99',
        'Laptop, Electronics, 999.99',
        'Keyboard, Electronics, 49.99',
        'Mouse Pad, Accessories, 9.99',
      ],
      answerIndex: 0,
      explanation:
        'Categories sort alphabetically, and Accessories comes before both Electronics and Furniture. Inside that group the prices run high to low, so the Keyboard at 49.99 leads the Mouse Pad at 9.99. The Laptop is the most expensive row in the whole table, but it lives in the second group, so it cannot reach the top.',
      check: {
        code: 'SELECT name, category, price FROM products ORDER BY category, price DESC LIMIT 1;',
        columns: ['name', 'category', 'price'],
        rows: [['Keyboard', 'Accessories', 49.99]],
      },
    },
  ],

  ties: [
    {
      id: 'q3.3.1',
      prompt:
        'Three customers live in London. You run `SELECT name, city FROM customers ORDER BY city;`. What can you rely on about the order of **Alice, Carol and Frank**?',
      options: [
        'Nothing — all three share the value `London`, so SQL makes no promise about their order',
        'They come back in the order they were inserted, because SQLite never reorders equal values',
        'They come back alphabetically, because `ORDER BY` always falls back to the first column',
        'The query is invalid, because `ORDER BY` requires a unique column',
      ],
      answerIndex: 0,
      explanation:
        'Equal keys mean the language has declined to promise anything. The order may be stable today and different after a reindex, a different SQLite build, or a different query plan. This is not a bug in your query — it is a guarantee the language will not give you.',
    },
    {
      id: 'q3.3.2',
      prompt:
        'What is the smallest change that makes `ORDER BY city` fully deterministic, while keeping cities grouped and alphabetical inside each city?',
      options: [
        'Add a second key: `ORDER BY city, name`',
        'Add `DISTINCT` so each city appears only once',
        'Make the direction explicit: `ORDER BY city ASC`',
        'Wrap the query in a subquery and add `LIMIT 6`',
      ],
      answerIndex: 0,
      explanation:
        'A second key settles the three-way London tie, and because no two customers share a name the order is now completely determined. `ASC` only spells out the default, `DISTINCT` would collapse the three London rows into a single row, and a `LIMIT` with no sort is still a lottery over six rows.',
      check: {
        code: 'SELECT name, city FROM customers ORDER BY city, name;',
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
  ],

  'limit-offset': [
    {
      id: 'q3.4.1',
      prompt:
        '`SELECT name, price FROM products ORDER BY price DESC LIMIT 3 OFFSET 3;` is page 2 of the price list. Which rows does it return?',
      options: [
        'Laptop, Desk, Monitor — `OFFSET` is ignored unless the query is also filtered',
        'Chair, Keyboard, Mouse — rows four to six',
        'Chair, Keyboard, Mouse — rows one to three',
        'Mouse Pad, Mouse, Keyboard — the three cheapest products',
      ],
      answerIndex: 1,
      explanation:
        'Page 1 is Laptop, Desk, Monitor. `OFFSET 3` skips exactly those three, so page 2 is the next three down: the Chair at 149.99, the Keyboard at 49.99 and the Mouse at 19.99. Counting starts at zero, so the first page is `OFFSET 0` — and `OFFSET` only ever follows a sort, or it is skipping rows in an order nobody defined.',
      check: {
        code: 'SELECT name, price FROM products ORDER BY price DESC LIMIT 3 OFFSET 3;',
        columns: ['name', 'price'],
        rows: [
          ['Chair', 149.99],
          ['Keyboard', 49.99],
          ['Mouse', 19.99],
        ],
      },
    },
    {
      id: 'q3.4.2',
      prompt: 'Why does the chapter call `SELECT name FROM products LIMIT 3;` a lottery?',
      options: [
        'Because `LIMIT` is ignored unless it comes after a `GROUP BY`',
        'Because with no `ORDER BY` the three rows are whichever the database was quickest to fetch, and that can change',
        'Because `LIMIT 3` only works on a table that holds exactly three rows',
        'Because `LIMIT` needs an explicit `OFFSET 0` before it is valid',
      ],
      answerIndex: 1,
      explanation:
        '`LIMIT` counts rows; it does not choose them. Without a sort the query has said nothing about which rows it wants, so the database hands back the three it can produce most cheaply. You have asked for *three* rows, not for *these* three — and "cheap to fetch" is an implementation detail you do not control.',
    },
  ],

  'clause-order': [
    {
      id: 'q3.5.1',
      prompt: 'Exactly one of these four runs. Which one?',
      options: [
        'SELECT name FROM products ORDER BY price WHERE price > 50;',
        'SELECT name, price FROM products WHERE price > 50 ORDER BY price;',
        'SELECT name FROM products LIMIT 3 ORDER BY price DESC;',
        'SELECT FROM products WHERE price > 50 ORDER BY price;',
      ],
      answerIndex: 1,
      explanation:
        'The grammar gives every clause one fixed slot. You may leave a slot empty, but you may never move one backwards: `WHERE` must precede `ORDER BY`, and `ORDER BY` must precede `LIMIT`. The last option is a different mistake — `SELECT` with no column list, which is not allowed. Filtering with `WHERE` first is also what makes the sort worth having, because you are sorting the rows that survived.',
      check: {
        code: 'SELECT name, price FROM products WHERE price > 50 ORDER BY price;',
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
      id: 'q3.5.2',
      prompt:
        'You want the **three cheapest products that cost more than 50**. Which query does it?',
      options: [
        'SELECT name, price FROM products WHERE price > 50 ORDER BY price LIMIT 3;',
        'SELECT name, price FROM products ORDER BY price LIMIT 3 WHERE price > 50;',
        'SELECT name, price FROM products WHERE price > 50 LIMIT 3 ORDER BY price;',
        'SELECT name, price FROM products WHERE price > 50 ORDER BY price DESC LIMIT 3;',
      ],
      answerIndex: 0,
      explanation:
        'All three clauses are present, in the only order the grammar allows. `WHERE` narrows the table to the four products over 50, `ORDER BY price` sorts what is left cheapest first, and `LIMIT 3` keeps the first three: Chair, Monitor, Desk. The last option is written in the right order and it does run — which is what makes it the trap. Only the direction is wrong, so you get the three *most* expensive instead: Laptop, Desk, Monitor.',
      check: {
        code: 'SELECT name, price FROM products WHERE price > 50 ORDER BY price LIMIT 3;',
        columns: ['name', 'price'],
        rows: [
          ['Chair', 149.99],
          ['Monitor', 199.99],
          ['Desk', 299.99],
        ],
      },
    },
  ],
}
