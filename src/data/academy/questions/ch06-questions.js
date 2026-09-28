export default {
  counting: [
    {
      id: 'q6.1.1',
      prompt:
        'There are 5 reviews, 3 with a rating, and 4 with a comment — and those are not the same 3. What does `SELECT COUNT(*), COUNT(rating), COUNT(comment) FROM reviews;` return?',
      options: [
        '5, 5, 5 — `COUNT` counts the rows either way',
        '5, 3, 4 — the star counts rows, and a named column counts only the rows where it has a value',
        '5, 3, 3 — both columns have the same two NULLs',
        '3, 3, 4 — `COUNT(*)` skips rows that are missing something',
      ],
      answerIndex: 1,
      explanation:
        'The star means "count the rows, whatever is in them", so `NULL`s do not reduce it and you get 5. Naming a column means "count how many of these have a value here", and the two columns have *different* NULLs: reviews 2 and 4 have no rating, while review 3 is the one with no comment. That is why the third option is wrong — it assumes the missing values line up, and the whole point of the flow diagram in 6.1 is that they do not. The same rule governs `AVG`, which is why the average rating is 4.0 from three scores rather than five.',
      check: {
        code: 'SELECT COUNT(*) AS all_reviews, COUNT(rating) AS rated, COUNT(comment) AS commented FROM reviews;',
        columns: ['all_reviews', 'rated', 'commented'],
        rows: [[5, 3, 4]],
      },
    },
    {
      id: 'q6.1.2',
      prompt:
        'One aggregate query with no `GROUP BY`, so the whole table is a single group. What does `SELECT COUNT(*), COUNT(DISTINCT category), MIN(price), MAX(price), ROUND(AVG(price), 2) FROM products;` return?',
      options: [
        '7, 3, 9.99, 999.99, 247.13',
        '7, 7, 9.99, 999.99, 247.13 — seven products, so seven categories',
        '7, 3, 9.99, 999.99, 247.13428571428572 — the `ROUND` does not change the average',
        '3, 3, 9.99, 999.99, 29.99 — one row per category',
      ],
      answerIndex: 0,
      explanation:
        'The shop has 7 products spread across 3 categories, so `COUNT(DISTINCT category)` collapses the repeats down to 3 while `COUNT(*)` stays at 7 — that difference is the entire reason `DISTINCT` exists. The `ROUND(..., 2)` is not decoration: the raw average is 247.13428571428572, and a price column that reports fourteen decimal places is not a number a person would recognise. It changes nothing about the calculation, only about how the answer reads. The last option is what you get once you add a `GROUP BY`, which is a different question with three rows instead of one.',
      check: {
        code:
          'SELECT COUNT(*) AS products, COUNT(DISTINCT category) AS categories,\n' +
          '       MIN(price) AS cheapest, MAX(price) AS priciest, ROUND(AVG(price), 2) AS avg\n' +
          'FROM products;',
        columns: ['products', 'categories', 'cheapest', 'priciest', 'avg'],
        rows: [[7, 3, 9.99, 999.99, 247.13]],
      },
    },
  ],

  'group-by': [
    {
      id: 'q6.2.1',
      prompt:
        'Which query collapses the seven products into exactly one row per category?',
      options: [
        'SELECT category, COUNT(*) AS n FROM products GROUP BY category ORDER BY category;',
        'SELECT category, COUNT(*) AS n FROM products ORDER BY category;',
        'SELECT category, COUNT(*) AS n FROM products GROUP BY n;',
        'SELECT category FROM products GROUP BY category, COUNT(*);',
      ],
      answerIndex: 0,
      explanation:
        '`GROUP BY` is the division into buckets, and the aggregate is then calculated once per bucket — three categories, three rows, with the category name repeated beside its answer. The second option is the trap that catches everyone once: `ORDER BY category` sorts the seven rows and *labels* them, but they are still seven separate rows, so you get 7 not 3. The third groups by an alias that does not exist yet, and the fourth mixes a grouped column with an aggregate that was never asked for.',
      check: {
        code: 'SELECT category, COUNT(*) AS n FROM products GROUP BY category ORDER BY category;',
        columns: ['category', 'n'],
        rows: [
          ['Accessories', 2],
          ['Electronics', 3],
          ['Furniture', 2],
        ],
      },
    },
    {
      id: 'q6.2.2',
      prompt:
        '`SELECT category, name FROM products GROUP BY category;` runs, returns 3 rows, and every value in it is a real category and a real product name. Why is it still wrong?',
      options: [
        'It is a syntax error — `name` is not allowed beside a grouping column',
        '`name` is neither grouped nor aggregated, so SQLite picks one arbitrary row per group and shows you whichever it picked',
        'It returns 7 rows, because the `GROUP BY` is ignored without an aggregate',
        'It returns 0 rows, because the two columns disagree within each group',
      ],
      answerIndex: 1,
      explanation:
        'Once the rows have collapsed there is no single `name` for the group, so any `name` you show is a representative row that the database chose for you — today Keyboard, Laptop and Desk, tomorrow something else entirely after a reindex or a different query plan. The dangerous part is that nothing marks it as arbitrary: the output looks like a real, deliberate report. PostgreSQL, MySQL and SQL Server all reject this outright, so SQLite is unusually permissive here — useful for experimenting, dangerous for shipping. Group on the level you actually mean, and aggregate everything else.',
      check: {
        code: 'SELECT category, name FROM products GROUP BY category ORDER BY category;',
        columns: ['category', 'name'],
        rows: [
          ['Accessories', 'Keyboard'],
          ['Electronics', 'Laptop'],
          ['Furniture', 'Desk'],
        ],
      },
    },
  ],

  'aggregates-per-group': [
    {
      id: 'q6.3.1',
      prompt:
        'Join orders to customers and to products, group by city, and report how much each city has spent. Which city is top, and how much?',
      options: [
        'London, 2499.90 — because `quantity * price` is worked out on each order line before the summing',
        'London, 999.99 — because only the Laptop counts, it being the largest single line',
        'Paris, 599.96 — because Paris has the highest spend per order',
        'Berlin, 69.95 — because the join only keeps orders that match two tables',
      ],
      answerIndex: 0,
      explanation:
        'Five orders in London, and the multiplication happens on each row *before* the summing, so Frank\'s Laptop is in there alongside Alice\'s. That ordering is the whole lesson of 6.3: sum `o.quantity * p.price`, never `SUM(p.price)`, or you are adding each product price once per order row instead of once per unit sold. The second option is the classic undercount — it is one order line, not a total. The last option is what a broken join looks like: Berlin is the *smallest* of the four, not the largest, and no join condition is dropping orders here.',
      check: {
        code:
          'SELECT c.city, COUNT(*) AS orders, ROUND(SUM(o.quantity * p.price), 2) AS revenue\n' +
          'FROM orders o\n' +
          'JOIN customers c ON o.customer_id = c.id\n' +
          'JOIN products p ON o.product_id = p.id\n' +
          'GROUP BY c.city\n' +
          'ORDER BY revenue DESC;',
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
      id: 'q6.3.2',
      prompt:
        'Same aggregation, but grouped by product instead of city. Which product sold the most, and for how much?',
      options: [
        'Laptop, 1999.98 — it was ordered twice, once by Alice and once by Frank',
        'Laptop, 999.99 — because `SUM` of a single value is that value',
        'Chair, 599.96 — because four units beat one expensive line',
        'Mouse, 139.93 — because quantity is summed but the price is not multiplied',
      ],
      answerIndex: 0,
      explanation:
        'The Laptop was ordered twice at one unit each, so its two lines are 999.99 apiece and add to 1999.98 — the multiplication is what turns "bought a Laptop" into "revenue from Laptops". The second option is the same mistake as the city query in a different place: `SUM` over one value *is* that value, which is only correct if the product was sold exactly once. Chair is the third-place line at 599.96, and the last option describes a genuinely different — and wrong — query, since it counts units without pricing them.',
      check: {
        code:
          'SELECT p.name, ROUND(SUM(o.quantity * p.price), 2) AS revenue\n' +
          'FROM orders o\n' +
          'JOIN products p ON o.product_id = p.id\n' +
          'GROUP BY p.name\n' +
          'ORDER BY revenue DESC, p.name;',
        columns: ['name', 'revenue'],
        rows: [
          ['Laptop', 1999.98],
          ['Chair', 599.96],
          ['Desk', 299.99],
          ['Monitor', 199.99],
          ['Mouse', 139.93],
          ['Keyboard', 99.98],
          ['Mouse Pad', 29.97],
        ],
      },
    },
  ],

  having: [
    {
      id: 'q6.4.1',
      prompt:
        'You want only the categories holding **more than two products**. Which query is legal SQL, and what does it return?',
      options: [
        'SELECT category FROM products WHERE COUNT(*) > 1 GROUP BY category;',
        'SELECT category, COUNT(*) AS n FROM products GROUP BY category HAVING COUNT(*) > 2;',
        'SELECT category, COUNT(*) AS n FROM products HAVING COUNT(*) > 2;',
        'SELECT category, COUNT(*) AS n FROM products GROUP BY category WHERE n > 2;',
      ],
      answerIndex: 1,
      explanation:
        'There are two different moments to filter a grouped query. `WHERE` runs *before* the grouping, one row at a time, so there is no `COUNT(*)` to test yet — the first option fails with `misuse of aggregate: COUNT()`. `HAVING` runs *after*, on the finished groups, which is the only place a condition *about* a group can live. Just Electronics has three products, so one group survives. The third option has no `GROUP BY` at all, and the fourth tries to filter on an alias from `WHERE`, which does not exist yet either — that one is the mirror-image mistake from 6.4.',
      check: {
        code: 'SELECT category, COUNT(*) AS n FROM products GROUP BY category HAVING COUNT(*) > 2;',
        columns: ['category', 'n'],
        rows: [['Electronics', 3]],
      },
      distractorIndices: [0, 3],
    },
    {
      id: 'q6.4.2',
      prompt:
        'Run `SELECT category, ROUND(SUM(price), 2) AS revenue FROM products GROUP BY category HAVING SUM(price) > 400 ORDER BY revenue DESC;`. Which groups survive?',
      options: [
        'Electronics at 1219.97 and Furniture at 449.98 — both clear 400, Accessories at 59.98 does not',
        'All three, because `HAVING` on a `SUM` is ignored',
        'Only Electronics, because 449.98 is not strictly greater than 449.98',
        'None, because `HAVING` needs the group to appear in a `WHERE` first',
      ],
      answerIndex: 0,
      explanation:
        'The filter is on the *sum* of the group, not its size: Electronics totals 1219.97, Furniture 449.98, and Accessories only 59.98, so the last is dropped. Note that `SUM(price)` here is the sum of the products\' list prices, not of anything sold — that is a different number from 6.3, and worth keeping straight. `HAVING` can use the `revenue` alias directly because the alias already exists by then, which is why `HAVING revenue > 400` also works and reads better. The third option is a plausible-sounding edge that does not apply: 449.98 is comfortably over 400.',
      check: {
        code:
          'SELECT category, ROUND(SUM(price), 2) AS revenue\n' +
          'FROM products\n' +
          'GROUP BY category\n' +
          'HAVING SUM(price) > 400\n' +
          'ORDER BY revenue DESC;',
        columns: ['category', 'revenue'],
        rows: [
          ['Electronics', 1219.97],
          ['Furniture', 449.98],
        ],
      },
    },
  ],

  'join-fanout': [
    {
      id: 'q6.5.1',
      prompt:
        'You add `JOIN reviews r ON r.product_id = p.id` to a query counting orders per product, "just in case". Only 4 groups come back instead of 7, and Laptop now claims **4** orders when it has 2. What happened?',
      options: [
        'The reviews join replaced the orders table, so Laptop\'s count is now its review count',
        'Each of Laptop\'s 2 orders was copied once per review, so `COUNT(*)` counted 4 rows of join output rather than 2 real orders',
        'The join dropped three products entirely because they have no reviews',
        '`COUNT(*)` after two joins can only ever return the number of columns',
      ],
      answerIndex: 1,
      explanation:
        'The join was correct; the count is not. A join makes one row out of several whenever the far side has more than one match, and Laptop has two reviews, so each of its two order rows appears twice and `COUNT(*)` — which counts rows — reports 4. The three dropped products are the honest part of the mistake too: only four products have any review at all, so the other three vanish. This is the most common way a grouped number ends up wrong, and it is completely invisible unless you ask what each output row is made of.',
      check: {
        code:
          'SELECT p.name, COUNT(*) AS order_count\n' +
          'FROM orders o\n' +
          'JOIN products p ON p.id = o.product_id\n' +
          'JOIN reviews r ON r.product_id = p.id\n' +
          'GROUP BY p.name\n' +
          'ORDER BY p.name;',
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
      id: 'q6.5.2',
      prompt:
        'Which change puts Laptop\'s order count back to **2** without removing the reviews join?',
      options: [
        '`COUNT(DISTINCT o.id)` — each order is counted once, however many times the join copied it',
        '`COUNT(DISTINCT p.name)` — one row per product name',
        '`SUM(1)` — summing ones avoids the duplication',
        '`MAX(o.id)` — the largest order id is the real count',
      ],
      answerIndex: 0,
      explanation:
        '`COUNT(DISTINCT o.id)` collapses the copies back to the real things being counted: two distinct order ids for the Laptop, however many review rows each was multiplied by. It fixes counts. It does **not** fix sums — `SUM(DISTINCT o.id)` would be worse than no fix at all, because distinct *values* are not the same as distinct *things*; for a sum you aggregate in a subquery first and then join the result. The second option counts products, not orders, and happens to be right about 4 groups only by accident. The last two are simply different questions with different answers.',
      check: {
        code:
          'SELECT p.name, COUNT(DISTINCT o.id) AS order_count\n' +
          'FROM orders o\n' +
          'JOIN products p ON p.id = o.product_id\n' +
          'JOIN reviews r ON r.product_id = p.id\n' +
          'GROUP BY p.name\n' +
          'ORDER BY p.name;',
        columns: ['name', 'order_count'],
        rows: [
          ['Keyboard', 1],
          ['Laptop', 2],
          ['Monitor', 1],
          ['Mouse Pad', 1],
        ],
      },
    },
  ],
}
