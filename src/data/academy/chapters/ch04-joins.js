export default {
  slug: 'joins',
  number: 4,
  title: 'Joins',
  subtitle: 'Putting two tables side by side, and losing rows without noticing',
  accent: '#2f6ad0',
  accentInk: '#1449a3',
  icon: '⋈',
  practiceTopic: 'joins',
  objectives: [
    'Join two tables on a shared key with INNER JOIN',
    'Read the ON clause as a rule, not a formula',
    'Chain a third table onto a join',
    'Choose INNER or LEFT and know which rows you are dropping',
    'Spot a join with no condition, and a join on the wrong key',
    'Compare rows within one table using a self join',
  ],
  sections: [
    {
      id: 'inner-join',
      number: '4.1',
      title: 'Joining on a foreign key',
      blocks: [
        {
          type: 'theory',
          body: [
            'So far every query has read one table. But the shop is split across four of them, and the interesting questions — who bought what, which products are unrated — need more than one at a time.',
            'You cannot put two tables in a single `FROM` and hope for the best. You have to tell SQL how the rows line up, and that instruction is called a **join**. The rule is always the same: match a column in one table to the matching column in the other.',
            'In our shop `orders.customer_id` holds the `id` of the customer who placed the order. That is a **foreign key** — a column that points at another table’s primary key. Matching them is the whole trick.',
          ],
        },
        {
          type: 'result',
          label: 'orders · the starting point',
          caption: 'Nine orders. `customer_id` is just a number here — nothing on this row says who the customer is.',
          columns: ['id', 'customer_id', 'order_date'],
          rows: [
            [1, 1, '2023-01-20'],
            [2, 1, '2023-02-01'],
            [3, 2, '2023-02-25'],
            [4, 3, '2023-03-10'],
            [5, 3, '2023-03-15'],
            [6, 4, '2023-04-20'],
            [7, 5, '2023-06-01'],
            [8, 5, '2023-06-10'],
            [9, 6, '2023-07-12'],
          ],
        },
        {
          type: 'theory',
          body: [
            'The join copies the matching `customers` row alongside each order, so the name is simply there to be selected. Notice what it does **not** do: it does not add rows. Nine orders in, nine rows out.',
          ],
        },
        {
          type: 'code',
          code: 'SELECT c.name AS customer, o.order_date\nFROM orders o\nJOIN customers c ON o.customer_id = c.id\nORDER BY o.id;',
          expect: {
            columns: ['customer', 'order_date'],
            rows: [
              ['Alice', '2023-01-20'],
              ['Alice', '2023-02-01'],
              ['Bob', '2023-02-25'],
              ['Carol', '2023-03-10'],
              ['Carol', '2023-03-15'],
              ['Dave', '2023-04-20'],
              ['Eve', '2023-06-01'],
              ['Eve', '2023-06-10'],
              ['Frank', '2023-07-12'],
            ],
          },
        },
        {
          type: 'flow',
          caption: 'The same nine rows, with a name filled in beside each one.',
          steps: [
            {
              label: 'FROM orders o',
              note: 'The nine rows we start with. `customer_id` is a number with no meaning on its own.',
              columns: ['o.id', 'o.customer_id', 'o.order_date'],
              rows: [
                [1, 1, '2023-01-20'],
                [2, 1, '2023-02-01'],
                [3, 2, '2023-02-25'],
                [4, 3, '2023-03-10'],
                [5, 3, '2023-03-15'],
                [6, 4, '2023-04-20'],
                [7, 5, '2023-06-01'],
                [8, 5, '2023-06-10'],
                [9, 6, '2023-07-12'],
              ],
            },
            {
              label: 'JOIN customers c ON o.customer_id = c.id',
              note: 'Each order picks up the customer whose id matches. Row count is unchanged: still nine.',
              columns: ['o.id', 'c.name', 'o.order_date'],
              rows: [
                [1, 'Alice', '2023-01-20'],
                [2, 'Alice', '2023-02-01'],
                [3, 'Bob', '2023-02-25'],
                [4, 'Carol', '2023-03-10'],
                [5, 'Carol', '2023-03-15'],
                [6, 'Dave', '2023-04-20'],
                [7, 'Eve', '2023-06-01'],
                [8, 'Eve', '2023-06-10'],
                [9, 'Frank', '2023-07-12'],
              ],
            },
          ],
        },
        {
          type: 'note',
          tone: 'info',
          title: 'The letters are aliases, and you should always use them',
          body:
            '`orders o` gives the table the short name `o`, so `o.customer_id` is unambiguous. Write `orders.customer_id` instead and it still works — until the day you join a second table that also has a `customer_id`. Aliases are the cheapest insurance in SQL.',
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'The order of the two tables does not matter',
          body:
            '`FROM orders o JOIN customers c` and `FROM customers c JOIN orders o` produce the same nine rows, as long as the `ON` condition is written to match. The `ON` clause is a statement about both sides, not an instruction to run left to right.',
        },
      ],
    },
    {
      id: 'three-way',
      number: '4.2',
      title: 'Three tables and a computed column',
      blocks: [
        {
          type: 'theory',
          body: [
            'A join is not limited to two tables. To answer "who bought what" you need three: the order, the customer who placed it, and the product that was bought. Add a second `JOIN` and the rule from 4.1 applies again.',
            'Once the rows are joined you can do arithmetic on them, because now `quantity` and `price` sit on the same row.',
          ],
        },
        {
          type: 'code',
          tone: 'bad',
          caption:
            'Both `customers` and `products` have a column called `name`, and the database cannot tell which one you meant. This is the error you get for being vague — and the fix is to say which you meant.',
          code: 'SELECT name\nFROM orders o\nJOIN customers c ON o.customer_id = c.id\nJOIN products p ON p.id = o.product_id;',
          expectError: true,
        },
        {
          type: 'code',
          caption:
            'Renaming with `AS` is not decoration. It is how you say "this `name` is the customer, that one is the product".',
          code: 'SELECT c.name AS customer, p.name AS product, o.quantity, o.quantity * p.price AS line_total\nFROM orders o\nJOIN customers c ON o.customer_id = c.id\nJOIN products p ON o.product_id = p.id\nORDER BY o.id;',
          expect: {
            label: 'line_total — what each order was worth',
            columns: ['customer', 'product', 'quantity', 'line_total'],
            rows: [
              ['Alice', 'Laptop', 1, 999.99],
              ['Alice', 'Keyboard', 2, 99.98],
              ['Bob', 'Monitor', 1, 199.99],
              ['Carol', 'Mouse', 5, 99.95],
              ['Carol', 'Desk', 1, 299.99],
              ['Dave', 'Chair', 4, 599.96],
              ['Eve', 'Mouse Pad', 3, 29.97],
              ['Eve', 'Mouse', 2, 39.98],
              ['Frank', 'Laptop', 1, 999.99],
            ],
          },
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'Money arithmetic is never quite what you typed',
          body:
            'Carol bought five Mice. `5 * 19.99` is `99.94999999999999` in binary floating point, not `99.95`. The database stores and shows you the long version. This is not a bug in your query — it is how decimal fractions are represented — and it is why a column meant to hold money is normally declared with fixed decimal precision rather than as a float.',
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'Add one table at a time',
          body:
            'When a three-way join returns nothing useful, do not rewrite the whole query. Run it with two tables, look at the rows, then add the third. Most three-way join bugs are two-way join bugs that nobody checked.',
        },
      ],
    },
    {
      id: 'left-join',
      number: '4.3',
      title: 'LEFT JOIN and the row that is all NULL',
      blocks: [
        {
          type: 'theory',
          body: [
            '`JOIN` only keeps rows where both sides found a partner. Look at the reviews: they cover products 1, 3, 4 and 7 — but the shop sells seven products, and Mouse, Desk and Chair have no review at all. An `INNER JOIN` throws those three away without mentioning it.',
            '`LEFT JOIN` promises something different: **every row from the left table survives**. Where no match exists on the right, SQL still produces a row and fills the right-hand columns with `NULL`.',
            'The word `LEFT` describes the table you keep, not the one you lose. It is the left table’s rows that are protected.',
          ],
        },
        { type: 'visual', name: 'join-types' },
        {
          type: 'code',
          caption: 'Five rows. Three products have vanished, and so has the chance to notice.',
          code: 'SELECT p.name, r.rating\nFROM products p\nJOIN reviews r ON r.product_id = p.id\nORDER BY r.id;',
          expect: {
            label: 'INNER JOIN · 5 rows',
            columns: ['name', 'rating'],
            rows: [
              ['Laptop', 5],
              ['Laptop', null],
              ['Monitor', 4],
              ['Mouse Pad', null],
              ['Keyboard', 3],
            ],
          },
        },
        {
          type: 'code',
          caption:
            'Eight rows, and every one of the seven products is still there. Laptop appears twice because it has two reviews.',
          code: 'SELECT p.name, r.rating\nFROM products p\nLEFT JOIN reviews r ON r.product_id = p.id\nORDER BY p.id, r.id;',
          expect: {
            label: 'LEFT JOIN · 8 rows',
            columns: ['name', 'rating'],
            rows: [
              ['Laptop', 5],
              ['Laptop', null],
              ['Mouse', null],
              ['Keyboard', 3],
              ['Monitor', 4],
              ['Desk', null],
              ['Chair', null],
              ['Mouse Pad', null],
            ],
          },
        },
        {
          type: 'flow',
          caption: 'Same two tables, same condition. Only the promise about surviving rows changed.',
          steps: [
            {
              label: 'JOIN reviews r ON r.product_id = p.id',
              note: 'Only products that a review points at can appear. Mouse, Desk and Chair are dropped.',
              columns: ['p.name', 'r.rating'],
              rows: [
                ['Laptop', 5],
                ['Laptop', null],
                ['Keyboard', 3],
                ['Monitor', 4],
                ['Mouse Pad', null],
              ],
            },
            {
              label: 'LEFT JOIN reviews r ON r.product_id = p.id',
              note: 'Every product is kept. The three with no review arrive with a NULL rating.',
              columns: ['p.name', 'r.rating'],
              rows: [
                ['Laptop', 5],
                ['Laptop', null],
                ['Mouse', null],
                ['Keyboard', 3],
                ['Monitor', 4],
                ['Desk', null],
                ['Chair', null],
                ['Mouse Pad', null],
              ],
            },
          ],
        },
        {
          type: 'code',
          caption:
            'This is the shape you will write most often: keep everything on the left, then keep only the rows where the right side found nothing. The `IS NULL` is doing the real work.',
          code: 'SELECT p.name\nFROM products p\nLEFT JOIN reviews r ON r.product_id = p.id\nWHERE r.id IS NULL;',
          expect: {
            label: 'products nobody has reviewed',
            columns: ['name'],
            rows: [['Mouse'], ['Desk'], ['Chair']],
          },
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'To find missing rows, test the right side — not the left',
          body:
            '`WHERE r.id IS NULL` is correct because `r.id` is the column that had nothing to match with. `WHERE p.id IS NULL` returns nothing at all, because every product row has an `id`. Point the test at the side that went missing.',
        },
        {
          type: 'note',
          tone: 'info',
          title: 'Mouse Pad has a review with no rating',
          body:
            'Mouse Pad is missing from the "unreviewed" list even though its rating is `NULL`. It *has* a review — the review simply has no stars. A row exists, so the `LEFT JOIN` matched it. This is the difference between "no review" and "a review that did not score it", and the shop data contains both.',
        },
        {
          type: 'note',
          tone: 'info',
          title: 'One row can match many',
          body:
            'Laptop appears twice in the `LEFT JOIN` output because two reviews point at product 1. Joins multiply rows when the right side has several matches, which is exactly why counting things after a join needs care — Chapter 6 comes back to this.',
        },
      ],
    },
    {
      id: 'cross-join',
      number: '4.4',
      title: 'A join with no condition',
      blocks: [
        {
          type: 'theory',
          body: [
            'If you name two tables in `FROM` and separate them with a comma, or write `CROSS JOIN`, you have not asked for a match — you have asked for every possible pairing. Six customers times seven products is forty-two rows, and not one of them means anything.',
            'SQLite will not warn you. It will hand you all forty-two rows with a straight face.',
          ],
        },
        {
          type: 'code',
          tone: 'bad',
          caption: 'Forty-two rows: every customer against every product.',
          code: 'SELECT COUNT(*) AS pairs\nFROM customers c, products p;',
          expect: { label: '6 customers x 7 products', columns: ['pairs'], rows: [[42]] },
        },
        {
          type: 'code',
          tone: 'bad',
          caption:
            'Same mistake, more innocent-looking tables. Nine orders times six customers is fifty-four rows, and the `order_date` next to a name may not have anything to do with it.',
          code: 'SELECT COUNT(*) AS pairs\nFROM orders o, customers c;',
          expect: { label: '9 orders x 6 customers', columns: ['pairs'], rows: [[54]] },
        },
        {
          type: 'code',
          caption: 'Add `CROSS JOIN` and the accident becomes a decision. Same forty-two rows, but now you meant it.',
          code: 'SELECT COUNT(*) AS pairs\nFROM customers CROSS JOIN products;',
          expect: { label: 'CROSS JOIN, said out loud', columns: ['pairs'], rows: [[42]] },
        },
        {
          type: 'theory',
          body: [
            'The sneakier version of this mistake is not a missing join at all. It is a join on the **wrong key** — one that runs, returns a sensible number of rows, and quietly answers a question nobody asked.',
          ],
        },
        {
          type: 'code',
          tone: 'bad',
          caption:
            'Read the result before you trust it. Order 2 was placed by Alice, but this says Carol — because `o.product_id` was matched against the *customer* id. Every name here is a real customer, so nothing looks broken. Order 7 disappeared entirely, because no customer has `id` 7.',
          code: 'SELECT c.name AS customer, o.id AS order_id, o.order_date\nFROM orders o\nJOIN customers c ON c.id = o.product_id\nORDER BY o.id;',
          expect: {
            label: 'wrong key · 8 rows, all plausible, all wrong',
            columns: ['customer', 'order_id', 'order_date'],
            rows: [
              ['Alice', 1, '2023-01-20'],
              ['Carol', 2, '2023-02-01'],
              ['Dave', 3, '2023-02-25'],
              ['Bob', 4, '2023-03-10'],
              ['Eve', 5, '2023-03-15'],
              ['Frank', 6, '2023-04-20'],
              ['Bob', 8, '2023-06-10'],
              ['Alice', 9, '2023-07-12'],
            ],
          },
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'Check the count, then check the names',
          body:
            'The reliable habit is to run a join with `COUNT(*)` first. Nine means one row per order and the key is probably right. Eight means something was dropped. A count you did not expect is the cheapest possible bug report.',
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'Naming the columns removes the temptation',
          body:
            'If you alias the joined tables meaningfully — `JOIN products p` rather than `JOIN products x` — then writing `p.customer_id` is obviously wrong and the database rejects it. A wrong key has to be a deliberate act, not a slip.',
        },
      ],
    },
    {
      id: 'self-join',
      number: '4.5',
      title: 'Joining a table to itself',
      blocks: [
        {
          type: 'theory',
          body: [
            'A join does not have to be between two different tables. You can name the same table twice with two different aliases and match the rows against each other — a **self join**.',
            'The question it answers here is: which customers live in the same city as each other? Three customers are in London, and nobody shares a city with anyone else.',
          ],
        },
        {
          type: 'code',
          tone: 'bad',
          caption:
            'This matches every customer to themselves as well as to each other, and it counts each pair twice — once as (Alice, Carol) and once as (Carol, Alice). Twelve rows where three were wanted.',
          code: 'SELECT a.name, b.name\nFROM customers a\nJOIN customers b ON a.city = b.city;',
          expect: {
            label: '12 rows · every pair, doubled, plus everyone with themselves',
            columns: ['name', 'name'],
            rows: [
              ['Alice', 'Alice'],
              ['Alice', 'Carol'],
              ['Alice', 'Frank'],
              ['Bob', 'Bob'],
              ['Carol', 'Alice'],
              ['Carol', 'Carol'],
              ['Carol', 'Frank'],
              ['Dave', 'Dave'],
              ['Eve', 'Eve'],
              ['Frank', 'Alice'],
              ['Frank', 'Carol'],
              ['Frank', 'Frank'],
            ],
          },
        },
        {
          type: 'code',
          caption:
            'The extra condition `a.id < b.id` does two jobs at once: it drops each customer’s match with themselves, and it keeps only one direction of each pair.',
          code: 'SELECT a.name AS person, b.name AS partner\nFROM customers a\nJOIN customers b ON a.city = b.city AND a.id < b.id\nORDER BY a.id, b.id;',
          expect: {
            label: '3 pairs in London',
            columns: ['person', 'partner'],
            rows: [
              ['Alice', 'Carol'],
              ['Alice', 'Frank'],
              ['Carol', 'Frank'],
            ],
          },
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'Self joins are how hierarchies work',
          body:
            'Swapping `city` for a `manager_id` column gives you every employee beside their manager, with no extra table. Swap it for a `parent_id` and you have categories. The pattern — one table, two aliases, a comparison between them — covers all of them.',
        },
        {
          type: 'note',
          tone: 'info',
          title: 'Why aliases are not optional here',
          body:
            'In a self join there is genuinely no other way to say which `name` you mean: both columns belong to `customers`. `a.name` and `b.name` are the only two valid answers, and picking one by accident is the most common self-join bug.',
        },
      ],
    },
  ],
  commonMistakes: [
    '`FROM customers c, products p` with no `ON` — that is a cross join, and it returns every possible pairing. It will not warn you.',
    '`JOIN customers c ON c.id = o.product_id` — a wrong key still runs and still returns real-looking names. Check `COUNT(*)` before you trust it.',
    '`SELECT name` after joining `customers` and `products` — both have a `name` column, so SQL asks which one. Alias them.',
    '`LEFT JOIN` and then `WHERE p.id IS NULL` — testing the side that was *kept* can never be NULL. Test the side that went missing.',
    'A self join with no `a.id < b.id` — every pair appears twice and every row matches itself.',
    'Expecting a `LEFT JOIN` to add rows to the right table. It only ever protects the left.',
  ],
  cheatsheet: {
    title: 'JOIN cheat sheet',
    columns: ['You want to…', 'Write'],
    rows: [
      ['Rows that match on both sides', 'INNER JOIN ... ON a.x = b.y'],
      ['Keep every row of the left table', 'LEFT JOIN ... ON a.x = b.y'],
      ['Keep every row of the right table', 'RIGHT JOIN ... ON a.x = b.y'],
      ['Keep every row of both', 'FULL OUTER JOIN ... ON a.x = b.y'],
      ['Rows on the left with no match', 'LEFT JOIN ... WHERE b.y IS NULL'],
      ['Say which name you mean', 'a.name AS customer, b.name AS product'],
      ['Join without matching anything', 'CROSS JOIN (you almost never want this)'],
      ['Compare rows within one table', 'FROM t a JOIN t b ON a.city = b.city AND a.id < b.id'],
    ],
  },
}
