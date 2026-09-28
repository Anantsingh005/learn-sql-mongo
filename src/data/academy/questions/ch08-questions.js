export default {
  with: [
    {
      id: 'q8.1.1',
      prompt:
        'A query groups orders by city to get a `revenue` per city, then filters to the cities that cleared 100. Written as a CTE, which query is right — and why is that `WHERE` allowed here?',
      options: [
        'WITH totals AS (SELECT c.city, ROUND(SUM(o.quantity * p.price), 2) AS revenue FROM orders o JOIN customers c ON o.customer_id = c.id JOIN products p ON o.product_id = p.id GROUP BY c.city) SELECT city, revenue FROM totals WHERE revenue > 100 ORDER BY revenue DESC;',
        'SELECT c.city, ROUND(SUM(o.quantity * p.price), 2) AS revenue FROM orders o JOIN customers c ON o.customer_id = c.id JOIN products p ON o.product_id = p.id GROUP BY c.city WHERE revenue > 100;',
        'WITH totals AS (SELECT c.city, SUM(o.quantity * p.price) AS revenue FROM orders o GROUP BY c.city) SELECT city FROM totals;',
        'CREATE VIEW totals AS SELECT c.city, SUM(o.quantity * p.price) AS revenue FROM orders o GROUP BY c.city;',
      ],
      answerIndex: 0,
      explanation:
        'The grouping happens once, inside the CTE, and everything after it is a flat list of cities that reads like a lookup. The `WHERE revenue > 100` is legal precisely because the alias belongs to a real subquery that the outer query can see — which is the exception to the rule from 6.4, where an alias cannot be used in a `WHERE` because that runs before the `SELECT` list is built. The second option is that rule being broken, and it fails. Three cities clear 100. The fourth is a genuinely different tool with a different lifetime: a view is a stored object that outlives the query, and a CTE is not.',
      check: {
        code:
          'WITH totals AS (\n' +
          '  SELECT c.city, ROUND(SUM(o.quantity * p.price), 2) AS revenue\n' +
          '  FROM orders o\n' +
          '  JOIN customers c ON o.customer_id = c.id\n' +
          '  JOIN products p ON o.product_id = p.id\n' +
          '  GROUP BY c.city\n' +
          ')\n' +
          'SELECT city, revenue FROM totals WHERE revenue > 100 ORDER BY revenue DESC;',
        columns: ['city', 'revenue'],
        rows: [
          ['London', 2499.9],
          ['Paris', 599.96],
          ['New York', 199.99],
        ],
      },
      distractorIndices: [1],
    },
    {
      id: 'q8.1.2',
      prompt:
        '`WITH RECURSIVE countdown(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM countdown WHERE n < 5) SELECT n FROM countdown;` returns five rows. Why does it stop at five instead of looping forever?',
      options: [
        'Because `UNION ALL` removes rows it has already seen, so the fifth row is the last distinct one',
        'Because when `n` reaches 5 the recursive term matches nothing, produces no row, and the recursion has nothing left to build on',
        'Because `WHERE n < 5` is a hard limit SQLite enforces on all recursive queries',
        'Because `SELECT 1` is treated as the seed and can only ever produce one row',
      ],
      answerIndex: 1,
      explanation:
        'The seed row is the anchor, the recursive term rebuilds the table one row at a time, and the recursion stops when the recursive term returns nothing — at `n = 5` the condition fails, no row comes back, and the whole thing ends. This is the honest demonstration because the shop has no hierarchical data; a countdown just shows the mechanism. Which is also the warning: a missing `WHERE` in the recursive term is an infinite loop rather than an error. For anything flat, a self join is a single readable pass — recursion is the tool of last resort.',
      check: {
        code:
          'WITH RECURSIVE countdown(n) AS (\n' +
          '  SELECT 1\n' +
          '  UNION ALL\n' +
          '  SELECT n + 1 FROM countdown WHERE n < 5\n' +
          ')\n' +
          'SELECT n FROM countdown;',
        columns: ['n'],
        rows: [[1], [2], [3], [4], [5]],
      },
    },
  ],

  'window-basics': [
    {
      id: 'q8.2.1',
      prompt:
        '`SELECT name, COUNT(*) OVER () AS total_products, ROUND(AVG(price) OVER (), 2) AS avg_price FROM products ORDER BY price DESC;` — how many rows come back, and what is in the last two columns?',
      options: [
        '7 rows, and every row carries the same 7 and 247.13',
        '1 row, and every row carries the same 7 and 247.13',
        '3 rows, one per category, and every row carries its own category average',
        '7 rows, and every row carries its own price',
      ],
      answerIndex: 0,
      explanation:
        'Seven rows in, seven rows out — the whole point of a window function. `AVG(price)` and `AVG(price) OVER ()` calculate exactly the same number; the empty brackets say "…and treat the entire result set as the group". Section 6.2 would have collapsed those seven products into one row and thrown the names away. Here each product keeps its own name and price and simply carries the same 7 and 247.13 beside it, which is the trade you make: aggregation *replaces* the rows, a window *adds* to them.',
      check: {
        code:
          'SELECT name, COUNT(*) OVER () AS total_products, ROUND(AVG(price) OVER (), 2) AS avg_price\n' +
          'FROM products\n' +
          'ORDER BY price DESC;',
        columns: ['name', 'total_products', 'avg_price'],
        rows: [
          ['Laptop', 7, 247.13],
          ['Desk', 7, 247.13],
          ['Monitor', 7, 247.13],
          ['Chair', 7, 247.13],
          ['Keyboard', 7, 247.13],
          ['Mouse', 7, 247.13],
          ['Mouse Pad', 7, 247.13],
        ],
      },
    },
    {
      id: 'q8.2.2',
      prompt:
        'Add `PARTITION BY category` to that average. What changes, and how do you tell it worked?',
      options: [
        'The row count drops to 3, one per category, like a `GROUP BY`',
        'Still 7 rows, but the average now differs by category — 406.66 for Electronics, 224.99 for Furniture, 29.99 for Accessories',
        'Still 7 rows, and the average is still 247.13 because `PARTITION BY` only affects `ORDER BY`',
        'An error, because `PARTITION BY` cannot be combined with `AVG`',
      ],
      answerIndex: 1,
      explanation:
        '`PARTITION BY` splits the rows into independent windows, and it behaves exactly like the `GROUP BY` you already know — except that it divides the window instead of dividing the output, so all seven products survive with their own names and prices. Compare with 6.3, where the same three averages were three separate rows with the product names thrown away. This is the query you would have written in Chapter 6 with a subquery per group if you had known about windows.',
      check: {
        code:
          'SELECT name, category, ROUND(AVG(price) OVER (PARTITION BY category), 2) AS category_avg\n' +
          'FROM products\n' +
          'ORDER BY category, price DESC;',
        columns: ['name', 'category', 'category_avg'],
        rows: [
          ['Keyboard', 'Accessories', 29.99],
          ['Mouse Pad', 'Accessories', 29.99],
          ['Laptop', 'Electronics', 406.66],
          ['Monitor', 'Electronics', 406.66],
          ['Mouse', 'Electronics', 406.66],
          ['Desk', 'Furniture', 224.99],
          ['Chair', 'Furniture', 224.99],
        ],
      },
    },
  ],

  ranking: [
    {
      id: 'q8.3.1',
      prompt:
        'Six customers: three with 2 orders, three with 1. Ranking them with `RANK()` and `DENSE_RANK()` on the same `ORDER BY COUNT(*) DESC`, what do the two columns say?',
      options: [
        'Identical — both give 1, 2, 3, 4, 5, 6',
        '`RANK` gives 1, 1, 1, 4, 4, 4 because three customers tie for first; `DENSE_RANK` gives 1, 1, 1, 2, 2, 2 because it does not skip',
        '`RANK` gives 1, 2, 3, 4, 5, 6; `DENSE_RANK` gives 1, 1, 1, 2, 2, 2',
        'Both give 1 for all six, because a tie means nobody has a place',
      ],
      answerIndex: 1,
      explanation:
        'The two differ in exactly one respect — what they do when rows tie — and both are correct, answering slightly different questions. `RANK` counts *groups*, so the three customers on 2 orders share rank 1 and the next number skips to 4: "three customers are tied for first, so fourth place really is rank four". `DENSE_RANK` counts groups without skipping, so the numbers keep counting up. Reach for `RANK` on a leaderboard, `DENSE_RANK` for "top three price bands", and `ROW_NUMBER` when you are cutting a list and the gaps do not matter.',
      check: {
        code:
          'SELECT c.name, COUNT(*) AS orders,\n' +
          '       RANK()       OVER (ORDER BY COUNT(*) DESC) AS rnk,\n' +
          '       DENSE_RANK() OVER (ORDER BY COUNT(*) DESC) AS dense\n' +
          'FROM orders o\n' +
          'JOIN customers c ON o.customer_id = c.id\n' +
          'GROUP BY c.name\n' +
          'ORDER BY orders DESC, c.name;',
        columns: ['name', 'orders', 'rnk', 'dense'],
        rows: [
          ['Alice', 2, 1, 1],
          ['Carol', 2, 1, 1],
          ['Eve', 2, 1, 1],
          ['Bob', 1, 4, 2],
          ['Dave', 1, 4, 2],
          ['Frank', 1, 4, 2],
        ],
      },
    },
    {
      id: 'q8.3.2',
      prompt:
        'Three customers are tied on 2 orders. You run `ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC)` with no tie-break. What is the risk?',
      options: [
        'The query is invalid — `ROW_NUMBER` requires a unique ordering column',
        'The three tied customers can come back in any order, so the numbers are arbitrary and unstable — a query whose result can change with nothing changed is one you cannot put in a test',
        'The tied customers all get the same number, which breaks the sequence',
        'It is slower than `RANK` but otherwise identical',
      ],
      answerIndex: 1,
      explanation:
        '`ROW_NUMBER` counts *positions*, so ties are broken by whatever the data happens to be in — and nothing in the `ORDER BY` says what that should be. Alice could be 1 and Carol 2 today, and the other way round after a reindex or a different query plan. Add `, c.name` to the window\'s `ORDER BY` and it becomes deterministic, which is exactly why the example in 8.3 spells that out. Also notice this is legal even though `COUNT(*)` is an aggregate: the window is computed *after* the `GROUP BY` has produced one row per customer, so it is ranking the results, not the orders.',
    },
  ],

  'lag-lead': [
    {
      id: 'q8.4.1',
      prompt:
        'Units sold per month, with `LAG` and a `change` column computed from it. The series is 1, 3, 6, 4, 5, 1. What do the first two rows show, and why?',
      options: [
        'January 1, prev 0, change 0; February 3, prev 1, change 2 — because the month before January had no sales',
        'January 1, prev NULL, change NULL; February 3, prev 1, change 2 — because there is no row before the first one',
        'January 1, prev 1, change 0; February 3, prev 3, change 0 — because `LAG` returns the current row',
        'January 1, prev NULL, change 0; February 3, prev 1, change 2 — because NULL minus 1 is 0',
      ],
      answerIndex: 1,
      explanation:
        'The first row has no previous row, so `LAG` gives `NULL` — and that `NULL` is a real answer, not a missing one. Since `1 - NULL` is also `NULL`, the change is `NULL` too, and it propagates rather than defaulting to zero. The first option is the mistake of reading that absence as "no sales in December", which the data does not support: a `NULL` here might mean zero sales, or it might mean a month that was never imported. If you genuinely need a zero, you have to generate the missing months from a calendar table rather than a cleverer query.',
      check: {
        code:
          'WITH monthly AS (\n' +
          "  SELECT substr(order_date, 1, 7) AS month, SUM(quantity) AS units\n" +
          '  FROM orders\n' +
          '  GROUP BY substr(order_date, 1, 7)\n' +
          ')\n' +
          'SELECT month, units,\n' +
          '       LAG(units) OVER (ORDER BY month) AS prev_month,\n' +
          '       units - LAG(units) OVER (ORDER BY month) AS change\n' +
          'FROM monthly\n' +
          'ORDER BY month;',
        columns: ['month', 'units', 'prev_month', 'change'],
        rows: [
          ['2023-01', 1, null, null],
          ['2023-02', 3, 1, 2],
          ['2023-03', 6, 3, 3],
          ['2023-04', 4, 6, -2],
          ['2023-06', 5, 4, 1],
          ['2023-07', 1, 5, -4],
        ],
      },
    },
    {
      id: 'q8.4.2',
      prompt:
        'A running total over that same monthly series, with the frame written out: `SUM(units) OVER (ORDER BY month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`. What does the last row show?',
      options: [
        'month 2023-07, units 1, running total 20 — all six months together',
        'month 2023-07, units 1, running total 1 — the frame resets on each row',
        'month 2023-07, units 1, running total 6 — one row per month, summed',
        'month 2023-07, units 5, running total 20 — the June value carried forward',
      ],
      answerIndex: 0,
      explanation:
        '20, which is every month added together: 1 + 3 + 6 + 4 + 5 + 1. The frame is what makes it a running total rather than a plain total — from the very start of the partition up to and including the current row. The short form `OVER (ORDER BY month)` gives identical numbers *here*, but the default is `RANGE`, not `ROWS`, and `RANGE` counts all rows tied on the ordering column, so two months sharing a label would both land in the first row\'s total. The default is a reasonable guess; the explicit frame is never a guess.',
      check: {
        code:
          'WITH monthly AS (\n' +
          "  SELECT substr(order_date, 1, 7) AS month, SUM(quantity) AS units\n" +
          '  FROM orders\n' +
          '  GROUP BY substr(order_date, 1, 7)\n' +
          ')\n' +
          'SELECT month, units,\n' +
          '       SUM(units) OVER (\n' +
          '         ORDER BY month\n' +
          '         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n' +
          '       ) AS running_total\n' +
          'FROM monthly\n' +
          'ORDER BY month;',
        columns: ['month', 'units', 'running_total'],
        rows: [
          ['2023-01', 1, 1],
          ['2023-02', 3, 4],
          ['2023-03', 6, 10],
          ['2023-04', 4, 14],
          ['2023-06', 5, 19],
          ['2023-07', 1, 20],
        ],
      },
    },
  ],

  together: [
    {
      id: 'q8.5.1',
      prompt:
        '"The dearest product in each category" — one row per category. You cannot filter on a window function, so where does the `WHERE` go?',
      options: [
        'Inside the same query, after the window function: `SELECT name, category, ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn FROM products WHERE rn = 1;`',
        'In a subquery or CTE that calculates the rank, with the filter applied outside it where the rank is a plain column',
        'In the `PARTITION BY` clause, since that is what decides which rows survive',
        'In a `HAVING` clause, because a rank is an aggregate',
      ],
      answerIndex: 1,
      explanation:
        'Calculate in a subquery, filter outside it. A window is computed *after* the rows exist, so there is nothing to filter on yet — the first option fails with `misuse of window function RANK()`, and it fails the same way if you try to reference the alias instead. That is the identical reason `WHERE COUNT(*) > 2` failed in 6.4. Once the rank is a column of a CTE, `WHERE rn = 1` is an ordinary test on an ordinary column, and you get the three winners. The fourth option is wrong twice over: a rank is not an aggregate, and `HAVING` could not see this column either.',
      check: {
        code:
          'WITH ranked AS (\n' +
          '  SELECT name, category, price,\n' +
          '         ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn\n' +
          '  FROM products\n' +
          ')\n' +
          'SELECT category, name, price\n' +
          'FROM ranked\n' +
          'WHERE rn = 1\n' +
          'ORDER BY category;',
        columns: ['category', 'name', 'price'],
        rows: [
          ['Accessories', 'Keyboard', 49.99],
          ['Electronics', 'Laptop', 999.99],
          ['Furniture', 'Desk', 299.99],
        ],
      },
      distractorIndices: [0],
    },
    {
      id: 'q8.5.2',
      prompt:
        '`SELECT name, SUM(price) OVER (PARTITION BY category) AS s FROM products GROUP BY category;` runs without complaint and returns 3 rows. Why is the answer nonsense?',
      options: [
        'It cannot run — SQLite rejects a `GROUP BY` and a window function in one query',
        'The `GROUP BY` collapsed the seven products into three arbitrary rows *first*, so the window was computed over those three instead of the seven real ones',
        'The window has no `ORDER BY`, so it cannot partition',
        'The two aggregates are added together, so the total is double-counted',
      ],
      answerIndex: 1,
      explanation:
        'It runs, and that is the problem. `GROUP BY category` collapses the seven products down to three rows *before* the window is ever calculated, so the window sees three rows rather than seven — and each of those rows is an arbitrary representative, which is why `SUM(price)` comes back as a single product\'s price instead of the category total. The partition happens in the wrong order to be of any use. A window function is not an aggregate; the two do not mix in one query, and the failure is silent rather than an error.',
      check: {
        code: 'SELECT name, SUM(price) OVER (PARTITION BY category) AS s FROM products GROUP BY category;',
        columns: ['name', 's'],
        rows: [
          ['Keyboard', 49.99],
          ['Laptop', 999.99],
          ['Desk', 299.99],
        ],
      },
    },
  ],
}
