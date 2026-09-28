export default {
  slug: 'aggregation',
  number: 6,
  title: 'Aggregation & GROUP BY',
  subtitle: 'COUNT, SUM, HAVING, and collapsing many rows into one',
  accent: '#fb923c',
  icon: 'Σ',
  practiceTopic: 'aggregation',
  objectives: [
    'Count rows and columns with COUNT, including COUNT(column) and COUNT(DISTINCT ...)',
    'Compute MIN, MAX, SUM and AVG over a whole table',
    'Collapse rows into groups with GROUP BY',
    'Filter rows before grouping and groups after, with WHERE and HAVING',
    'Group the result of a join, and avoid the fan-out trap',
    'Fix the "column not in GROUP BY" problem',
  ],
  sections: [
    {
      id: 'counting',
      number: '6.1',
      title: 'COUNT and its cousins',
      blocks: [
        {
          type: 'theory',
          body: [
            'Everything so far has returned rows one for one. Aggregation is the first thing that **changes the number of rows**: it reads many and produces one value.',
            '`COUNT` counts, `MIN` and `MAX` find the ends, `SUM` and `AVG` add and divide. Used with no `GROUP BY` they treat the entire table as a single group.',
          ],
        },
        {
          type: 'code',
          code: 'SELECT COUNT(*) AS products, MIN(price) AS cheapest, MAX(price) AS priciest, ROUND(AVG(price), 2) AS avg\nFROM products;',
          expect: {
            label: 'the whole table as one group',
            columns: ['products', 'cheapest', 'priciest', 'avg'],
            rows: [[7, 9.99, 999.99, 247.13]],
          },
        },
        {
          type: 'note',
          tone: 'info',
          title: 'ROUND is not decoration',
          body:
            '`AVG(price)` on its own returns 247.13428571428572, because averaging money in floating point gives you a long answer. `ROUND(x, 2)` is how you get a number a person would recognise. It changes nothing about the calculation — only about how the answer is displayed.',
        },
        {
          type: 'theory',
          body: [
            'Here is where Chapter 2 pays off. `COUNT` comes in three forms and they do not agree with each other.',
          ],
        },
        {
          type: 'code',
          caption:
            'There are five reviews. Only three have a rating, and only four have a comment — and they are not the same three.',
          code: 'SELECT COUNT(*) AS all_reviews, COUNT(rating) AS rated, COUNT(comment) AS commented\nFROM reviews;',
          expect: {
            label: '5, 3 and 4',
            columns: ['all_reviews', 'rated', 'commented'],
            rows: [[5, 3, 4]],
          },
        },
        {
          type: 'flow',
          caption: 'Why `COUNT(*)` says five and `COUNT(rating)` says three.',
          steps: [
            {
              label: 'every review row',
              note: 'Five rows exist. This is what `COUNT(*)` counts.',
              columns: ['id', 'rating', 'comment'],
              rows: [
                [1, 5, 'Fast and quiet'],
                [2, null, 'Arrived late'],
                [3, 4, null],
                [4, null, 'Good value'],
                [5, 3, 'Keys feel cheap'],
              ],
            },
            {
              label: 'COUNT(rating) — the NULL column',
              note: 'Reviews 2 and 4 have no rating, and section 2.3 already explained why they cannot be counted: there is no value to count.',
              columns: ['id', 'rating', 'comment'],
              rows: [
                [1, 5, 'Fast and quiet'],
                [3, 4, null],
                [5, 3, 'Keys feel cheap'],
              ],
            },
            {
              label: 'COUNT(comment) — a different column',
              note: 'Now review 3 drops out instead, because its comment is the empty one. The count is 4, and it is counting something else.',
              columns: ['id', 'rating', 'comment'],
              rows: [
                [1, 5, 'Fast and quiet'],
                [2, null, 'Arrived late'],
                [4, null, 'Good value'],
                [5, 3, 'Keys feel cheap'],
              ],
            },
          ],
        },
        {
          type: 'code',
          caption:
            'The same rule applies to every other aggregate. `AVG` ignores the missing ratings, so the average is of three scores and not five.',
          code: 'SELECT COUNT(rating) AS scored, ROUND(AVG(rating), 2) AS avg_rating\nFROM reviews;',
          expect: { label: '4.0 from the three real scores', columns: ['scored', 'avg_rating'], rows: [[3, 4]] },
        },
        {
          type: 'code',
          caption:
            '`DISTINCT` inside a count collapses repeats first. Seven products, but only three categories and seven different prices.',
          code: 'SELECT COUNT(DISTINCT category) AS categories, COUNT(DISTINCT price) AS distinct_prices\nFROM products;',
          expect: { label: '3 categories, 7 prices', columns: ['categories', 'distinct_prices'], rows: [[3, 7]] },
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'COUNT(*) counts rows; COUNT(column) counts values',
          body:
            'The star means "count the rows, whatever is in them", so `NULL`s do not reduce it. Naming a column means "count how many of these have a value here". When you want "how many things are there", you almost always want `COUNT(*)`.',
        },
      ],
    },
    {
      id: 'group-by',
      number: '6.2',
      title: 'GROUP BY collapses rows',
      blocks: [
        {
          type: 'theory',
          body: [
            'One number for the whole table is only interesting once. The moment you want a number *per category*, or per city, or per customer, you need the rows divided into buckets first.',
            '`GROUP BY` is that division. Rows sharing the value in the grouping column become one group, and every aggregate in the query is then calculated **once per group**. The output has one row per group, not one per input row.',
          ],
        },
        {
          type: 'flow',
          caption: 'Seven rows in, three rows out. The rows are not filtered — they are combined.',
          steps: [
            {
              label: 'products',
              note: 'The starting point: seven separate rows.',
              columns: ['name', 'category'],
              rows: [
                ['Laptop', 'Electronics'],
                ['Mouse', 'Electronics'],
                ['Keyboard', 'Accessories'],
                ['Monitor', 'Electronics'],
                ['Desk', 'Furniture'],
                ['Chair', 'Furniture'],
                ['Mouse Pad', 'Accessories'],
              ],
            },
            {
              label: 'GROUP BY category',
              note: 'Rows sharing a category collapse into one group. Electronics gets three products, Furniture two, Accessories two.',
              columns: ['category', 'products in the group'],
              rows: [
                ['Electronics', 'Laptop, Mouse, Monitor'],
                ['Furniture', 'Desk, Chair'],
                ['Accessories', 'Keyboard, Mouse Pad'],
              ],
            },
            {
              label: 'with COUNT(*)',
              note: 'Now the aggregate can be calculated for each group, and the group name is repeated beside its answer.',
              columns: ['category', 'n'],
              rows: [
                ['Accessories', 2],
                ['Electronics', 3],
                ['Furniture', 2],
              ],
            },
          ],
        },
        {
          type: 'code',
          code: 'SELECT category, COUNT(*) AS n\nFROM products\nGROUP BY category\nORDER BY category;',
          expect: { label: '3 groups', columns: ['category', 'n'], rows: [['Accessories', 2], ['Electronics', 3], ['Furniture', 2]] },
        },
        {
          type: 'theory',
          body: [
            'Every column in the `SELECT` list has to make sense once the rows have collapsed. The grouping column is fine — it is the same for the whole group. An aggregate is fine — it is computed per group. Anything else is a problem.',
          ],
        },
        {
          type: 'code',
          tone: 'bad',
          caption:
            'This runs without complaint, and it is meaningless. `name` is not a grouping column, so SQLite picks one arbitrary row from each group and shows you whatever it picked. Today Keyboard, Laptop and Desk; after a reindex or a different query plan, something else entirely.',
          code: 'SELECT category, name FROM products GROUP BY category;',
          expect: {
            label: '3 rows of arbitrary representatives',
            columns: ['category', 'name'],
            rows: [
              ['Accessories', 'Keyboard'],
              ['Electronics', 'Laptop'],
              ['Furniture', 'Desk'],
            ],
          },
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'Other databases reject this outright',
          body:
            'PostgreSQL, MySQL and SQL Server all raise an error for a column that is neither grouped nor aggregated. SQLite is unusually permissive, which is useful for experimenting and dangerous for shipping — the mistake that other engines catch for you will pass your tests and fail in production.',
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'Group on what you actually mean',
          body:
            'Two columns that always travel together can be grouped by either. If a table has a `city` and a `country`, `GROUP BY city, country` is not more correct than `GROUP BY city` — it is the same grouping, said twice. Group by the finest level you will ever report at.',
        },
      ],
    },
    {
      id: 'aggregates-per-group',
      number: '6.3',
      title: 'More aggregates, per group',
      blocks: [
        {
          type: 'theory',
          body: [
            'Once the groups exist you are not limited to counting. `SUM`, `AVG`, `MIN` and `MAX` all work per group, and you can use as many as you like in the same query — each one gets its own column in the output.',
          ],
        },
        {
          type: 'code',
          caption:
            'Four aggregates over the same three groups. The revenue column is the sum, and it is what the ordering uses.',
          code: 'SELECT category, COUNT(*) AS n,\n       ROUND(SUM(price), 2) AS revenue,\n       ROUND(AVG(price), 2) AS avg_price\nFROM products\nGROUP BY category\nORDER BY revenue DESC;',
          expect: {
            label: 'per-category totals',
            columns: ['category', 'n', 'revenue', 'avg_price'],
            rows: [
              ['Electronics', 3, 1219.97, 406.66],
              ['Furniture', 2, 449.98, 224.99],
              ['Accessories', 2, 59.98, 29.99],
            ],
          },
        },
        {
          type: 'note',
          tone: 'info',
          title: 'The product of n and the average is the sum',
          body:
            'Check Electronics: 3 products at an average of 406.66 gives roughly the 1219.97 revenue figure. That is not a coincidence — it is a useful sanity check whenever you report both, because a mismatch means the average or the count came from a different set of rows than the sum.',
        },
        {
          type: 'theory',
          body: [
            'Grouping is not limited to one table you already trust. Chapter 4 taught you to join, and a join followed by a `GROUP BY` is how you answer questions about the *combination* — such as how much each city has spent.',
          ],
        },
        {
          type: 'code',
          caption:
            'Five orders in London, not four. Frank lives in London too, and he is easy to forget because he only ever placed one order.',
          code: 'SELECT c.city, COUNT(*) AS order_count\nFROM orders o\nJOIN customers c ON o.customer_id = c.id\nGROUP BY c.city\nORDER BY order_count DESC, c.city;',
          expect: {
            label: 'orders per city',
            columns: ['city', 'order_count'],
            rows: [
              ['London', 5],
              ['Berlin', 2],
              ['New York', 1],
              ['Paris', 1],
            ],
          },
        },
        {
          type: 'code',
          caption:
            'Now the same grouping with a real total. The multiplication happens before the summing, so each order contributes its own value rather than one row per product.',
          code: 'SELECT c.city, COUNT(*) AS orders, ROUND(SUM(o.quantity * p.price), 2) AS revenue\nFROM orders o\nJOIN customers c ON o.customer_id = c.id\nJOIN products p ON o.product_id = p.id\nGROUP BY c.city\nORDER BY revenue DESC;',
          expect: {
            label: 'revenue per city',
            columns: ['city', 'orders', 'revenue'],
            rows: [
              ['London', 5, 2499.9],
              ['Paris', 1, 599.96],
              ['New York', 1, 199.99],
              ['Berlin', 2, 69.95],
            ],
          },
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'The order of the clauses is fixed, even now',
          body:
            '`FROM` then `JOIN` then `WHERE` then `GROUP BY` then `HAVING` then `ORDER BY` then `LIMIT` — the grammar from section 3.5 has not gained a single exception. `GROUP BY` sits after `WHERE` and before `HAVING`, and there is nowhere else it can go.',
        },
      ],
    },
    {
      id: 'having',
      number: '6.4',
      title: 'HAVING, and why WHERE cannot do it',
      blocks: [
        {
          type: 'theory',
          body: [
            'There are two different moments to filter a grouped query, and they need two different keywords.',
            '`WHERE` runs **before** the grouping, one row at a time. `HAVING` runs **after** the grouping, on the finished groups. Since a group only exists after `GROUP BY` has run, a condition about a group — "more than two products", "over 400 in revenue" — can only be expressed in `HAVING`.',
          ],
        },
        {
          type: 'code',
          caption:
            'Only Electronics has more than two products. One group survives out of three.',
          code: 'SELECT category, COUNT(*) AS n\nFROM products\nGROUP BY category\nHAVING COUNT(*) > 2;',
          expect: { label: '1 group', columns: ['category', 'n'], rows: [['Electronics', 3]] },
        },
        {
          type: 'code',
          caption:
            'The same clause, asked in money instead. Electronics and Furniture clear 400; Accessories does not.',
          code: 'SELECT category, ROUND(SUM(price), 2) AS revenue\nFROM products\nGROUP BY category\nHAVING SUM(price) > 400\nORDER BY revenue DESC;',
          expect: { label: '2 groups', columns: ['category', 'revenue'], rows: [['Electronics', 1219.97], ['Furniture', 449.98]] },
        },
        {
          type: 'code',
          tone: 'bad',
          caption:
            'This is the mistake everyone makes once. `WHERE` sees rows, not groups, so there is no `COUNT(*)` to test yet, and the database says so.',
          code: 'SELECT category FROM products WHERE COUNT(*) > 1 GROUP BY category;',
          expectError: true,
        },
        {
          type: 'theory',
          body: [
            'Both filters can appear in the same query, and they are not interchangeable. To keep products costing more than 20 and then report how many of those are in each category:',
          ],
        },
        {
          type: 'code',
          caption:
            'Five products survive the `WHERE`, and they form three groups. Compare the counts with 6.2: Accessories has 2 products in total but only 1 here, because the Mouse Pad is cheaper than 20.',
          code: 'SELECT category, COUNT(*) AS n\nFROM products\nWHERE price > 19.99\nGROUP BY category\nORDER BY category;',
          expect: { label: '3 groups, filtered first', columns: ['category', 'n'], rows: [['Accessories', 1], ['Electronics', 2], ['Furniture', 2]] },
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'Do not use HAVING where WHERE would do',
          body:
            'Both run on the same rows, so the answers agree — but `WHERE` is applied first, so the database discards rows before doing any grouping work. On a large table that is a large difference in speed, and it is the same rows either way. `WHERE` for rows, `HAVING` only for groups.',
        },
        {
          type: 'note',
          tone: 'info',
          title: 'HAVING can use aliases, WHERE cannot',
          body:
            'A `WHERE` clause is evaluated before the `SELECT` list is built, so `WHERE revenue > 400` is an error. In `HAVING` the alias already exists, which is why `HAVING COUNT(*) > 2` reads so much better than repeating the whole `COUNT(*)` expression it is testing.',
        },
      ],
    },
    {
      id: 'join-fanout',
      number: '6.5',
      title: 'The fan-out trap',
      blocks: [
        {
          type: 'theory',
          body: [
            'One warning, because it is the most common way a grouped number ends up wrong. A join makes one row out of several whenever the far side has more than one match — section 4.3 showed Laptop appearing twice because it has two reviews.',
            'A `COUNT(*)` counts **rows**, and after a join those rows may be duplicates you created yourself. The join was correct. The count is not.',
          ],
        },
        {
          type: 'code',
          caption: 'The truth: seven products have been ordered, and Laptop has been ordered twice.',
          code: 'SELECT p.name, COUNT(*) AS order_count\nFROM orders o\nJOIN products p ON p.id = o.product_id\nGROUP BY p.name\nORDER BY p.name;',
          expect: {
            label: '7 groups',
            columns: ['name', 'order_count'],
            rows: [
              ['Chair', 1],
              ['Desk', 1],
              ['Keyboard', 1],
              ['Laptop', 2],
              ['Monitor', 1],
              ['Mouse', 2],
              ['Mouse Pad', 1],
            ],
          },
        },
        {
          type: 'code',
          tone: 'bad',
          caption:
            'One extra join, to pull in reviews. Nothing looks wrong — the numbers are plausible, and only four groups come back instead of seven. But Laptop now claims four orders. It has two. Each of its orders was doubled by one of its two reviews.',
          code: 'SELECT p.name, COUNT(*) AS order_count\nFROM orders o\nJOIN products p ON p.id = o.product_id\nJOIN reviews r ON r.product_id = p.id\nGROUP BY p.name\nORDER BY p.name;',
          expect: {
            label: 'Laptop doubled: 4 instead of 2',
            columns: ['name', 'order_count'],
            rows: [
              ['Keyboard', 1],
              ['Laptop', 4],
              ['Monitor', 1],
              ['Mouse Pad', 1],
            ],
          },
        },
        {
          type: 'code',
          caption:
            'Count the *orders* rather than the rows, and the doubling disappears: `COUNT(DISTINCT o.id)` only counts each order once, however many times the join copied it.',
          code: 'SELECT p.name, COUNT(DISTINCT o.id) AS order_count\nFROM orders o\nJOIN products p ON p.id = o.product_id\nJOIN reviews r ON r.product_id = p.id\nGROUP BY p.name\nORDER BY p.name;',
          expect: {
            label: 'Laptop back to 2',
            columns: ['name', 'order_count'],
            rows: [
              ['Keyboard', 1],
              ['Laptop', 2],
              ['Monitor', 1],
              ['Mouse Pad', 1],
            ],
          },
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'The habit that prevents it',
          body:
            'Whenever a grouped query counts or sums something, ask what each output row is made of. If one output row can correspond to more than one real thing, you are counting join output rather than data. `COUNT(DISTINCT ...)` is the fix for counts; for sums, aggregate in a subquery first and then join the result.',
        },
        {
          type: 'note',
          tone: 'info',
          title: 'Or just do not join what you do not need',
          body:
            'The reviews join in that example exists only so the query could go wrong. If you want orders per product, join orders to products and stop. A join added "just in case" is a join that will eventually double something.',
        },
        {
          type: 'theory',
          body: [
            'Chapter 7 changes something different: instead of reading data, it writes it. `INSERT` adds rows, `UPDATE` changes them, `DELETE` removes them — and unlike everything so far, a mistake is permanent.',
          ],
        },
      ],
    },
  ],
  commonMistakes: [
    '`COUNT(column)` when you meant `COUNT(*)` — NULLs are skipped, so the number is smaller than the number of rows.',
    '`WHERE COUNT(*) > 2` — `WHERE` runs before grouping, so there is no count to test. Use `HAVING`.',
    'Using `HAVING` for a row-level filter — same answer, but the database groups rows it did not need to.',
    'A column in `SELECT` that is neither grouped nor aggregated — SQLite returns an arbitrary row, and stricter databases reject the query.',
    '`COUNT(*)` after a join to a table with several matches per row — the count is of join output, not of real things. Use `COUNT(DISTINCT ...)`.',
    '`ORDER BY SUM(x)` on a column you also aliased — fine in `HAVING`, an error in `WHERE`.',
    'Forgetting `ROUND` on an average of money, and reporting 247.13428571428572 as a price.',
  ],
  cheatsheet: {
    title: 'Aggregation cheat sheet',
    columns: ['You want to…', 'Write'],
    rows: [
      ['Count rows', 'COUNT(*)'],
      ['Count rows where a column has a value', 'COUNT(column)'],
      ['Count different values', 'COUNT(DISTINCT column)'],
      ['Smallest / largest', 'MIN(x) / MAX(x)'],
      ['Total / average', 'SUM(x) / AVG(x)'],
      ['Round money to 2 places', 'ROUND(SUM(x), 2)'],
      ['One row per group', 'GROUP BY column'],
      ['Filter rows before grouping', 'WHERE ... (before GROUP BY)'],
      ['Filter groups after grouping', 'HAVING COUNT(*) > 2'],
      ['Compare against a computed value', 'WHERE x > (SELECT AVG(x) FROM t)'],
    ],
  },
}
