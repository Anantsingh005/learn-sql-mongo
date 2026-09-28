export default {
  slug: 'ctes-windows',
  number: 8,
  title: 'CTEs & Window Functions',
  subtitle: 'WITH, RANK and LAG — reading a whole group of rows at once',
  accent: '#22d3ee',
  icon: '⧉',
  practiceTopic: 'table-query',
  objectives: [
    'Give a subquery a name with WITH, and reuse it as if it were a table',
    'Chain several CTEs so a long query reads top to bottom',
    'Use a window function to add an aggregate to every row instead of collapsing them',
    'Split rows into independent groups with PARTITION BY',
    'Tell ROW_NUMBER, RANK and DENSE_RANK apart, ties included',
    'Reach the neighbouring row with LAG and LEAD, and total a column as it accumulates',
    'Combine a CTE with a window function to answer "best in each group"',
  ],
  sections: [
    {
      id: 'with',
      number: '8.1',
      title: 'WITH gives a query a name',
      blocks: [
        {
          type: 'theory',
          body: [
            'Chapter 5 introduced subqueries, and then carefully avoided putting one in a `FROM`. It works — but a query with three levels of nesting is a wall of parentheses, and you have to hold the whole thing in your head to see which rows are moving where.',
            'A **common table expression** fixes the readability without changing the meaning. You give the subquery a name in a `WITH` clause, and from then on the name can be used anywhere a table name can: in the `FROM`, in another subquery, in a join.',
          ],
        },
        {
          type: 'code',
          caption:
            'The subquery from 5.1, given a name. Same rows, but now you can refer to "expensive" instead of re-reading the brackets.',
          code:
            'WITH expensive AS (\n  SELECT id, name, price FROM products WHERE price > 100\n)\nSELECT * FROM expensive ORDER BY price DESC;',
          expect: {
            label: '4 rows',
            columns: ['id', 'name', 'price'],
            rows: [
              [1, 'Laptop', 999.99],
              [5, 'Desk', 299.99],
              [4, 'Monitor', 199.99],
              [6, 'Chair', 149.99],
            ],
          },
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'A CTE is a name, not a table',
          body:
            'It only has the columns the `SELECT` inside it produced — exactly three here, no more. Asking for `category` is a mistake the database catches, and it is worth knowing that the error mentions a *column* rather than a table, because that is the tell: the name resolved, and the column did not exist inside it.',
        },
        {
          type: 'code',
          tone: 'bad',
          caption: 'The name resolved. The column was never in the subquery, so the error is about `name`.',
          code:
            'WITH expensive AS (\n  SELECT id FROM products WHERE price > 100\n)\nSELECT name FROM expensive;',
          expectError: true,
        },
        {
          type: 'theory',
          body: [
            'The real payoff is that a CTE can be reused and can feed another CTE. The city-revenue query from 6.3 has a `GROUP BY` in the middle of it; as a CTE, the grouping happens once, in one place, and everything after it is a flat list of four cities that reads like a lookup.',
          ],
        },
        {
          type: 'code',
          caption:
            'Berlin drops out below 100. Note that `revenue` is usable in the outer `WHERE` — the same rule from 6.4, where aliases work in `HAVING` but not in `WHERE`, except that here the alias belongs to a real subquery that the outer query can see.',
          code:
            'WITH totals AS (\n  SELECT c.city, ROUND(SUM(o.quantity * p.price), 2) AS revenue\n  FROM orders o\n  JOIN customers c ON o.customer_id = c.id\n  JOIN products p ON o.product_id = p.id\n  GROUP BY c.city\n)\nSELECT city, revenue FROM totals WHERE revenue > 100 ORDER BY revenue DESC;',
          expect: {
            label: '3 cities',
            columns: ['city', 'revenue'],
            rows: [
              ['London', 2499.9],
              ['Paris', 599.96],
              ['New York', 199.99],
            ],
          },
        },
        {
          type: 'code',
          caption:
            'The anti-join from 5.4, which needed a subquery in a `NOT IN`, now reads as a definition followed by a question. This is the shape that makes a CTE worth writing: the complicated reasoning is above, and the part you actually want to read is below.',
          code:
            'WITH reviewed AS (\n  SELECT DISTINCT product_id FROM reviews WHERE product_id IS NOT NULL\n)\nSELECT p.name\nFROM products p\nWHERE p.id NOT IN (SELECT product_id FROM reviewed)\nORDER BY p.name;',
          expect: { label: '3 products', columns: ['name'], rows: [['Chair'], ['Desk'], ['Mouse']] },
        },
        {
          type: 'note',
          tone: 'info',
          title: 'One `WITH`, several names, separated by commas',
          body:
            'A single `WITH` clause can define more than one CTE, and a later one can read an earlier one. This is how you break a genuinely long query into named steps — the difference between a wall and a sequence of sentences. The keyword goes once, at the top; the commas do the rest.',
        },
        {
          type: 'theory',
          body: [
            'One form goes further: `WITH RECURSIVE`, for a query that refers to its own result. The seed row is the anchor, the recursive term rebuilds the table one row at a time, and the recursion stops when the recursive term returns nothing.',
          ],
        },
        {
          type: 'code',
          caption:
            'A countdown. The shop has no data shaped like a hierarchy, so the classic demonstration is the honest one: `1` is the seed, each row adds one while the result is under five, and when `n` reaches five the recursive term produces no row and the whole thing stops.',
          code:
            'WITH RECURSIVE countdown(n) AS (\n  SELECT 1\n  UNION ALL\n  SELECT n + 1 FROM countdown WHERE n < 5\n)\nSELECT n FROM countdown;',
          expect: { label: '5 rows', columns: ['n'], rows: [[1], [2], [3], [4], [5]] },
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'Recursion is the tool of last resort',
          body:
            'A hierarchy — employees under managers, categories under parents, threads under posts — is the case recursion is genuinely for. For anything flat, a self-join (section 4.5) is a single readable pass, and the self-join that gets you one level will get you two levels just as easily. Recursive CTEs are also the easiest thing in this book to write wrongly: a missing `WHERE` in the recursive term is an infinite loop rather than an error.',
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'A CTE ends at the next statement',
          body:
            'A name defined in a `WITH` is visible to the one `SELECT` that follows it and nowhere else. You cannot reference it from a different statement, and there is no `CREATE` and no `DROP` — so a CTE is purely a readability device, not a stored object. If you want a name that outlives the query, that is a view or a temporary table, which is a different tool with a different lifetime.',
        },
      ],
    },
    {
      id: 'window-basics',
      number: '8.2',
      title: 'An aggregate that keeps every row',
      blocks: [
        {
          type: 'theory',
          body: [
            'Everything in Chapter 6 had one idea at its centre: aggregation **reduces**. Seven rows go in, three come out, and the individual products are gone. Sometimes that is exactly what you want. Often it is the wrong trade, because what you wanted was the aggregate *next to* each row rather than instead of it.',
            'A **window function** is an aggregate that does not reduce. It looks at a whole set of rows, calculates one value from them, and hands that value to *every* row in the set. Same `AVG`, same `COUNT` — different idea about what happens to the rows.',
          ],
        },
        {
          type: 'code',
          caption:
            'This is `COUNT(*)` and `AVG(price)` from 6.1, unchanged, plus the words `OVER ()`. And here is the difference in one glance: seven rows in, seven rows out. No `GROUP BY` anywhere, and every row is still there with its own name and price.',
          code:
            'SELECT name, price,\n       COUNT(*) OVER () AS total_products,\n       ROUND(AVG(price) OVER (), 2) AS avg_price\nFROM products\nORDER BY price DESC;',
          expect: {
            label: '7 rows, not 1',
            columns: ['name', 'price', 'total_products', 'avg_price'],
            rows: [
              ['Laptop', 999.99, 7, 247.13],
              ['Desk', 299.99, 7, 247.13],
              ['Monitor', 199.99, 7, 247.13],
              ['Chair', 149.99, 7, 247.13],
              ['Keyboard', 49.99, 7, 247.13],
              ['Mouse', 19.99, 7, 247.13],
              ['Mouse Pad', 9.99, 7, 247.13],
            ],
          },
        },
        {
          type: 'note',
          tone: 'info',
          title: 'The empty brackets are the whole of the difference',
          body:
            '`AVG(price)` and `AVG(price) OVER ()` calculate exactly the same number. The brackets say "…and treat the entire result set as the group". Section 6.2 would have collapsed these seven rows into one; this keeps all seven and repeats the answer beside each.',
        },
        {
          type: 'theory',
          body: [
            'An empty window is rarely what you want, because "the average of everything" on every row is a constant you could have looked up separately. The useful version adds `PARTITION BY`, and it behaves exactly like the `GROUP BY` you already know — except that it divides the window instead of dividing the output.',
          ],
        },
        {
          type: 'code',
          caption:
            'The category average now sits next to each product, so you can see both the value and how it compares. Compare with 6.3, where the same averages were three separate rows with the product names thrown away. Every category restarts its ranking at 1, which is the tell that a partition really is a separate window.',
          code:
            'SELECT name, category, price,\n       RANK() OVER (PARTITION BY category ORDER BY price DESC) AS rank_in_category\nFROM products\nORDER BY category, rank_in_category;',
          expect: {
            label: '7 rows, ranked inside each category',
            columns: ['name', 'category', 'price', 'rank_in_category'],
            rows: [
              ['Keyboard', 'Accessories', 49.99, 1],
              ['Mouse Pad', 'Accessories', 9.99, 2],
              ['Laptop', 'Electronics', 999.99, 1],
              ['Monitor', 'Electronics', 199.99, 2],
              ['Mouse', 'Electronics', 19.99, 3],
              ['Desk', 'Furniture', 299.99, 1],
              ['Chair', 'Furniture', 149.99, 2],
            ],
          },
        },
        {
          type: 'code',
          caption:
            'And here is `PARTITION BY` with a plain aggregate in front of it, which is the query you would have written in Chapter 6 with a subquery if you had known about windows. The per-category average appears on all seven rows, so nothing is lost.',
          code:
            'SELECT name, category, price,\n       ROUND(AVG(price) OVER (PARTITION BY category), 2) AS category_avg\nFROM products\nORDER BY category, price DESC;',
          expect: {
            label: 'every product, with its category average',
            columns: ['name', 'category', 'price', 'category_avg'],
            rows: [
              ['Keyboard', 'Accessories', 49.99, 29.99],
              ['Mouse Pad', 'Accessories', 9.99, 29.99],
              ['Laptop', 'Electronics', 999.99, 406.66],
              ['Monitor', 'Electronics', 199.99, 406.66],
              ['Mouse', 'Electronics', 19.99, 406.66],
              ['Desk', 'Furniture', 299.99, 224.99],
              ['Chair', 'Furniture', 149.99, 224.99],
            ],
          },
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'The syntax, once',
          body:
            '`function(...) OVER (PARTITION BY ... ORDER BY ...)`. `PARTITION BY` splits the rows into independent windows — the same idea as `GROUP BY`. `ORDER BY` inside the brackets gives the window a sequence, which is meaningless for `AVG` but is the whole point for `ROW_NUMBER`, `RANK` and `LAG`. Both are optional; `OVER ()` means one window of everything, in no particular order.',
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'You cannot filter on a window function',
          body:
            'A window is calculated *after* the rows exist, so there is nothing to filter on yet — the same reason `WHERE COUNT(*) > 2` failed in 6.4. The error is `misuse of window function`. And you cannot reference it by its alias either, for the same reason section 6.4 could not. If you need to keep only the ranked winners, that is a subquery, which is the next section.',
        },
        {
          type: 'code',
          tone: 'bad',
          caption: 'The window function is in the `WHERE`, so it is evaluated before it can exist.',
          code: 'SELECT name FROM products WHERE RANK() OVER (ORDER BY price) = 1;',
          expectError: true,
        },
        {
          type: 'code',
          tone: 'bad',
          caption:
            'Moving it to the `SELECT` list and filtering on the alias instead — still refused, for the same reason. `WHERE` runs before the `SELECT` list is built. The fix is a subquery, and 8.5 has it.',
          code:
            'SELECT name, RANK() OVER (ORDER BY price DESC) AS r\nFROM products\nWHERE r = 1;',
          expectError: true,
        },
      ],
    },
    {
      id: 'ranking',
      number: '8.3',
      title: 'ROW_NUMBER, RANK, DENSE_RANK',
      blocks: [
        {
          type: 'theory',
          body: [
            'Three functions, one job: number the rows in order. They differ in exactly one respect — what they do when two rows tie. Until you know that, they look interchangeable, and picking the wrong one produces a report with a gap or a duplicate in it.',
            '`ROW_NUMBER` counts positions, so ties are broken by whatever the data happens to be in. `RANK` counts *groups*, so a tie shares a number and the next number skips ahead. `DENSE_RANK` counts groups without skipping.',
          ],
        },
        {
          type: 'code',
          caption:
            'Six customers, three with two orders and three with one. Look at the two ranking columns: after the three customers on 2 orders, `RANK` jumps to 4 while `DENSE_RANK` continues at 2. Both are correct — they are answering slightly different questions.',
          code:
            'SELECT c.name, COUNT(*) AS orders,\n       RANK()       OVER (ORDER BY COUNT(*) DESC) AS rnk,\n       DENSE_RANK() OVER (ORDER BY COUNT(*) DESC) AS dense,\n       ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC, c.name) AS row_no\nFROM orders o\nJOIN customers c ON o.customer_id = c.id\nGROUP BY c.name\nORDER BY orders DESC, c.name;',
          expect: {
            label: 'the gap in RANK, and no gap in DENSE_RANK',
            columns: ['name', 'orders', 'rnk', 'dense', 'row_no'],
            rows: [
              ['Alice', 2, 1, 1, 1],
              ['Carol', 2, 1, 1, 2],
              ['Eve', 2, 1, 1, 3],
              ['Bob', 1, 4, 2, 4],
              ['Dave', 1, 4, 2, 5],
              ['Frank', 1, 4, 2, 6],
            ],
          },
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'Which one to use',
          body:
            '`ROW_NUMBER` for "give me the first ten" and pagination — the gaps never matter because you are cutting the list anyway. `RANK` for a leaderboard, where "three customers are tied for first, so fourth place really is rank four" is the honest answer. `DENSE_RANK` when you want the numbers to keep counting up — "top three price bands" means three bands, not bands one, two and four.',
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'ROW_NUMBER over a tie is arbitrary, and it is not stable',
          body:
            'In the query above, `ROW_NUMBER` was made deterministic by adding `, c.name` to its `ORDER BY` — that is the tie-break, and it is why Alice is 1 and Carol is 2 rather than the other way round. Without it, the three customers on two orders could come out in any order, and a query that returns a different result when nothing in the data changed is a query you cannot put in a test.',
        },
        {
          type: 'note',
          tone: 'info',
          title: 'A window function can be numbered over a grouped query',
          body:
            'Notice that the `OVER` clause counts orders with `COUNT(*) DESC` — an aggregate. This is legal because the window is computed after the `GROUP BY` has produced one row per customer, and at that point `COUNT(*)` is a number each of those rows can carry. The window is ranking the *results*, not the orders.',
        },
      ],
    },
    {
      id: 'lag-lead',
      number: '8.4',
      title: 'LAG, LEAD and running totals',
      blocks: [
        {
          type: 'theory',
          body: [
            'The other family of window functions does not aggregate at all. They reach out to the rows *around* a row in some order, which makes questions like "what was this month\'s number last month" and "how much have we sold so far this year" into single columns instead of a self-join.',
            '`LAG(x)` is the value from the previous row in the window, `LEAD(x)` the next one, and neither ever changes the number of rows. With nothing before the first row, `LAG` gives `NULL` — and per section 2.3 that `NULL` is a real answer, not a missing one.',
          ],
        },
        {
          type: 'code',
          caption:
            'First build the series: units sold per month, from the nine orders. Note the gap — nothing was ordered in May, so May is absent from the data entirely rather than present with a zero.',
          code:
            "WITH monthly AS (\n  SELECT substr(order_date, 1, 7) AS month, SUM(quantity) AS units\n  FROM orders\n  GROUP BY substr(order_date, 1, 7)\n)\nSELECT month, units FROM monthly ORDER BY month;",
          expect: {
            label: '6 months with sales',
            columns: ['month', 'units'],
            rows: [
              ['2023-01', 1],
              ['2023-02', 3],
              ['2023-03', 6],
              ['2023-04', 4],
              ['2023-06', 5],
              ['2023-07', 1],
            ],
          },
        },
        {
          type: 'code',
          caption:
            'Now the same series with its neighbours. March sold 6 after February\'s 3, so its change is +3. April drops by 2, and the first and last rows have a `NULL` where there is no previous or next month — they are not zero, and computing a change from a `NULL` would give you one.',
          code:
            'WITH monthly AS (\n  SELECT substr(order_date, 1, 7) AS month, SUM(quantity) AS units\n  FROM orders\n  GROUP BY substr(order_date, 1, 7)\n)\nSELECT month, units,\n       LAG(units)  OVER (ORDER BY month) AS prev_month,\n       LEAD(units) OVER (ORDER BY month) AS next_month,\n       units - LAG(units) OVER (ORDER BY month) AS change\nFROM monthly\nORDER BY month;',
          expect: {
            label: 'each month beside the ones either side',
            columns: ['month', 'units', 'prev_month', 'next_month', 'change'],
            rows: [
              ['2023-01', 1, null, 3, null],
              ['2023-02', 3, 1, 6, 2],
              ['2023-03', 6, 3, 4, 3],
              ['2023-04', 4, 6, 5, -2],
              ['2023-06', 5, 4, 1, 1],
              ['2023-07', 1, 5, null, -4],
            ],
          },
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'The `ORDER BY` inside the window is not the `ORDER BY` of the query',
          body:
            'There are two of them in that statement and they are independent. The one inside `OVER` decides what "previous" means; the one at the end decides what order the results are *displayed* in. Swap them and the numbers are still right but the table is jumbled, which is the most confusing possible symptom. Write both, and make them the same.',
        },
        {
          type: 'code',
          caption:
            'A running total, which is `SUM` over an ordered window. The frame is spelled out: from the very start of the partition up to the current row. Watch the last row — 20 is all six months together, and the seven Laptop-plus-Mouse units from 6.3 are in there somewhere.',
          code:
            'WITH monthly AS (\n  SELECT substr(order_date, 1, 7) AS month, SUM(quantity) AS units\n  FROM orders\n  GROUP BY substr(order_date, 1, 7)\n)\nSELECT month, units,\n       SUM(units) OVER (\n         ORDER BY month\n         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n       ) AS running_total\nFROM monthly\nORDER BY month;',
          expect: {
            label: 'accumulating as the months pass',
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
        {
          type: 'note',
          tone: 'info',
          title: 'The frame, and why the short version works here',
          body:
            'The long form is `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, which is exactly what a running total means: every row from the start up to and including this one. It can be shortened to `OVER (ORDER BY month)`, and for this data it gives the identical numbers — but the default is `RANGE`, not `ROWS`, and `RANGE` counts *all rows tied on the ordering column*. With two rows sharing a month, `RANGE` would include both in the first row\'s total. The default is a reasonable guess; the explicit frame is never a guess.',
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'The frame is where sliding windows live',
          body:
            'Change `UNBOUNDED PRECEDING` to `1 PRECEDING` and the frame becomes the current row plus the one before it — a rolling two-month average, from a single `AVG` with no self-join. Moving totals, trailing averages and period-over-period comparisons are all the same idea with a different frame.',
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'A missing month is not a zero',
          body:
            'There is no May row because nothing was ordered in May, and a report that showed May as 0 would be making a claim the data does not support — it might be a zero, or it might be a month where orders were not imported. If you genuinely need a zero, you have to generate the missing months, which needs a table of the calendar rather than a cleverer query.',
        },
      ],
    },
    {
      id: 'together',
      number: '8.5',
      title: 'The best of each group',
      blocks: [
        {
          type: 'theory',
          body: [
            'One last shape, and it is the one window functions were invented for: "the top row of every group". Section 8.2 explained why you cannot filter on a window function, so the answer is to calculate the rank in a subquery and filter outside it — which is a CTE with a job to do.',
          ],
        },
        {
          type: 'code',
          caption:
            'One row per category: the dearest thing in each. The `WHERE rn = 1` sits outside the CTE, where a rank is a plain column and can be tested like any other.',
          code:
            'WITH ranked AS (\n  SELECT name, category, price,\n         ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn\n  FROM products\n)\nSELECT category, name, price\nFROM ranked\nWHERE rn = 1\nORDER BY category;',
          expect: {
            label: 'the winner from each of 3 categories',
            columns: ['category', 'name', 'price'],
            rows: [
              ['Accessories', 'Keyboard', 49.99],
              ['Electronics', 'Laptop', 999.99],
              ['Furniture', 'Desk', 299.99],
            ],
          },
        },
        {
          type: 'code',
          tone: 'bad',
          caption:
            'The tempting version, and why it is not the same question. This returns seven rows, because it numbers the rows and then stops — the "winner" per category is a number sitting in a column, not a row that has been selected. It is not wrong, it is a different query: the full ranking, rather than the top of each group.',
          code:
            'SELECT name, category, price,\n       ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn\nFROM products\nORDER BY category, price DESC;',
          expect: {
            label: '7 rows — every product, ranked',
            columns: ['name', 'category', 'price', 'rn'],
            rows: [
              ['Keyboard', 'Accessories', 49.99, 1],
              ['Mouse Pad', 'Accessories', 9.99, 2],
              ['Laptop', 'Electronics', 999.99, 1],
              ['Monitor', 'Electronics', 199.99, 2],
              ['Mouse', 'Electronics', 19.99, 3],
              ['Desk', 'Furniture', 299.99, 1],
              ['Chair', 'Furniture', 149.99, 2],
            ],
          },
        },
        {
          type: 'code',
          tone: 'bad',
          caption:
            'And a mistake worth making once, so it is never made twice: a `GROUP BY` and a window function in the same query. It runs without complaint, and the answer is nonsense — `GROUP BY` collapsed the seven products into three arbitrary rows *first*, so the window was calculated over those three, not over the seven real ones. The partition happens in the wrong order to be of any use. A window function is not an aggregate; the two do not mix in one query.',
          code:
            'SELECT name, SUM(price) OVER (PARTITION BY category) AS s\nFROM products\nGROUP BY category;',
          expect: {
            label: 'three rows, over the wrong data',
            columns: ['name', 's'],
            rows: [
              ['Keyboard', 49.99],
              ['Laptop', 999.99],
              ['Desk', 299.99],
            ],
          },
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'The pattern to remember',
          body:
            'Calculate in a subquery, filter outside it. A CTE is the readable way to write that, and it scales to as many steps as the question needs — rank, then filter, then aggregate, then order, each in its own named layer. When a query stops fitting on one screen, it is telling you it wants to be a CTE.',
        },
        {
          type: 'theory',
          body: [
            'That is the last tool in the box. The eight chapters between them cover reading, filtering, sorting, joining, nesting, grouping, writing and — this one — looking at a whole set of rows at once. `RANK` and `LAG` were added to SQL long after the rest of it existed, and they are the first things to reach for when a report needs a number from the rows around a row rather than a number from the rows themselves.',
          ],
        },
      ],
    },
  ],
  commonMistakes: [
    'Forgetting `OVER` and writing `AVG(price)` when you meant the windowed version — you get one collapsed row and no error.',
    'Filtering on a window function in `WHERE`, or on its alias. Both are refused; the filter has to happen in an outer query.',
    'Confusing the `ORDER BY` inside `OVER` with the one at the end of the query. The first defines "previous"; the second only rearranges the output.',
    'Mixing `GROUP BY` with a window function. The grouping happens first, so the window is computed over the wrong rows.',
    'Using `ROW_NUMBER` to pick a single winner from a group that might tie — two rows can come back as "number 1" if you use `RANK` and expect one. Use `ROW_NUMBER` when you need exactly one, and add a tie-break to its `ORDER BY`.',
    'Assuming the short `OVER (ORDER BY x)` frame means "rows up to here" — it means `RANGE`, which also includes every row tied on `x`.',
    'Reading a `LAG` of `NULL` on the first row as a zero, then reporting a change of `NULL` for the first month of every series.',
    'Assuming a CTE persists. It is a name for one statement; there is nothing to create or drop.',
  ],
  cheatsheet: {
    title: 'CTEs & windows cheat sheet',
    columns: ['You want to…', 'Write'],
    rows: [
      ['Name a subquery', 'WITH expensive AS (SELECT ...) SELECT * FROM expensive;'],
      ['Chain named steps', 'WITH a AS (...), b AS (SELECT * FROM a) SELECT * FROM b;'],
      ['Walk a hierarchy', 'WITH RECURSIVE t(n) AS (seed UNION ALL ...) ...'],
      ['Add a whole-set total to every row', 'COUNT(*) OVER ()'],
      ['Add a per-group total to every row', 'AVG(price) OVER (PARTITION BY category)'],
      ['Number the rows', 'ROW_NUMBER() OVER (ORDER BY price DESC)'],
      ['Rank, ties sharing a place', 'RANK() OVER (ORDER BY price DESC)'],
      ['Rank, ties sharing a place, no gaps', 'DENSE_RANK() OVER (ORDER BY price DESC)'],
      ['The previous row\'s value', 'LAG(units) OVER (ORDER BY month)'],
      ['The next row\'s value', 'LEAD(units) OVER (ORDER BY month)'],
      ['A running total', 'SUM(x) OVER (ORDER BY month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)'],
      ['The top row of every group', 'WITH r AS (SELECT ..., ROW_NUMBER() OVER (PARTITION BY c ORDER BY v DESC) AS rn ...) SELECT * FROM r WHERE rn = 1;'],
    ],
  },
}
