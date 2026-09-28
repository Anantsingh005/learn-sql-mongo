export default {
  slug: 'subqueries',
  number: 5,
  title: 'Subqueries & Set Operations',
  subtitle: 'A query inside a query, and stacking two result sets on top of each other',
  accent: '#c084fc',
  icon: '⊞',
  practiceTopic: 'table-query',
  objectives: [
    'Filter with a list produced by another query',
    'Use a subquery that answers with a single value',
    'Write a correlated subquery that changes per row',
    'Test for existence with EXISTS instead of comparing values',
    'Combine result sets with UNION, INTERSECT and EXCEPT',
    'Know why one NULL can empty an entire NOT IN',
  ],
  sections: [
    {
      id: 'in-subquery',
      number: '5.1',
      title: 'A list from a query: IN',
      blocks: [
        {
          type: 'theory',
          body: [
            'Chapter 3 hard-coded a filter: "keep Electronics and Furniture". That only works because you already knew the answer. The moment the answer lives in the data, you need the filter to ask the database.',
            '`IN` accepts a list, and a **subquery** produces a list. Wrapping a second `SELECT` in parentheses is all it takes.',
          ],
        },
        {
          type: 'result',
          label: 'the inner query, on its own',
          caption:
            'The subquery asks a different question: not which products are expensive, but which *categories* contain an expensive product. Two categories come back — Electronics, because of the Laptop, and Furniture, because of the Desk.',
          columns: ['category'],
          rows: [['Electronics'], ['Furniture']],
        },
        {
          type: 'code',
          caption:
            'The outer query then keeps every product whose category is in that list. Five rows, and the expensive-product test is decided by the data rather than by you.',
          code: 'SELECT name, category\nFROM products\nWHERE category IN (SELECT category FROM products WHERE price > 200)\nORDER BY id;',
          expect: {
            label: '5 of 7 products',
            columns: ['name', 'category'],
            rows: [
              ['Laptop', 'Electronics'],
              ['Mouse', 'Electronics'],
              ['Monitor', 'Electronics'],
              ['Desk', 'Furniture'],
              ['Chair', 'Furniture'],
            ],
          },
        },
        {
          type: 'note',
          tone: 'info',
          title: 'A subquery is not special syntax',
          body:
            '`WHERE category IN (...)` and `WHERE category IN (SELECT ...)` obey the same rule. The parentheses mark out a complete query to run first, and its result is used in place of the hand-written list. You can swap one for the other whenever the list is long enough to be worth computing.',
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'The subquery cannot see the outer query',
          body:
            'In this example the inner query reads the same table as the outer one and that is fine. But try to write `WHERE price > (SELECT AVG(price) FROM products WHERE id = p.id)` — referring to `p` from the inner query — and it will not run. Section 5.3 is about the one way to make that work.',
        },
      ],
    },
    {
      id: 'scalar-subquery',
      number: '5.2',
      title: 'A subquery that answers with one value',
      blocks: [
        {
          type: 'theory',
          body: [
            '`IN` wants a list. Sometimes you want a single number instead — the average price, the highest price, the number of orders — and you want the database to work it out at the moment the query runs.',
            'A subquery in a comparison like `price > (...)` must return exactly **one row and one column**. Used this way it is called a scalar subquery, and it is the bridge to Chapter 6: whatever the aggregate is, this is how you filter on it.',
          ],
        },
        {
          type: 'code',
          caption:
            'The average price of all seven products is about 247.13, so only the two products above it survive. The threshold was never written down — it is computed.',
          code: 'SELECT name, price\nFROM products\nWHERE price > (SELECT AVG(price) FROM products)\nORDER BY price;',
          expect: {
            label: 'above the average of 247.13',
            columns: ['name', 'price'],
            rows: [
              ['Desk', 299.99],
              ['Laptop', 999.99],
            ],
          },
        },
        {
          type: 'code',
          tone: 'bad',
          caption:
            'This subquery returns seven rows, not one — but SQLite does not complain. It quietly uses the **first** row, compares against the Laptop’s 999.99, and hands back a single answer that looks deliberate.',
          code: 'SELECT name FROM products WHERE price = (SELECT price FROM products);',
          expect: {
            label: 'silently answers "is the price 999.99?"',
            columns: ['name'],
            rows: [['Laptop']],
          },
        },
        {
          type: 'code',
          tone: 'bad',
          caption:
            'Returning two *columns* is an error, at least. This is the failure you get when a scalar subquery is not scalar.',
          code: 'SELECT (SELECT id, name FROM customers LIMIT 1) FROM products LIMIT 1;',
          expectError: true,
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'A scalar subquery that returns no rows is also silent',
          body:
            'If the inner query matches nothing, the comparison becomes `price > NULL` — and, exactly as section 2.3 showed, that is never true. You get zero rows with no error at all. If a scalar subquery can come back empty, reach for `EXISTS` in 5.4 or `COALESCE` in Chapter 6 instead.',
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'Why this is worth learning',
          body:
            'Filtering on a computed number is the single most useful thing a subquery does. "Above average", "more than the median", "better than the customer’s own last order" — all of them are this pattern, and none of them need the number to appear anywhere in the data.',
        },
      ],
    },
    {
      id: 'correlated-subquery',
      number: '5.3',
      title: 'Correlated subqueries',
      blocks: [
        {
          type: 'theory',
          body: [
            'Every subquery so far has been independent: run it once, get the answer, apply it to everything. A **correlated** subquery is different. It refers back to the row it sits inside, so it is run again for every row and can give a different answer each time.',
            'The way to write it is to give the outer query an alias, and then use that alias inside the inner query. The price of the mechanism is that the inner query cannot run on its own.',
          ],
        },
        {
          type: 'code',
          caption:
            'For every product, the inner query averages the prices of products in **that product’s own category**. Three different answers come out of one subquery.',
          code: 'SELECT p.name, p.price,\n       (SELECT ROUND(AVG(x.price), 2) FROM products x WHERE x.category = p.category) AS category_avg\nFROM products p\nORDER BY p.id;',
          expect: {
            label: 'one average, recomputed per row',
            columns: ['name', 'price', 'category_avg'],
            rows: [
              ['Laptop', 999.99, 406.66],
              ['Mouse', 19.99, 406.66],
              ['Keyboard', 49.99, 29.99],
              ['Monitor', 199.99, 406.66],
              ['Desk', 299.99, 224.99],
              ['Chair', 149.99, 224.99],
              ['Mouse Pad', 9.99, 29.99],
            ],
          },
        },
        {
          type: 'flow',
          caption: 'The inner query is evaluated seven times, once per outer row.',
          steps: [
            {
              label: 'p = Laptop (Electronics)',
              note: 'Average of the three Electronics products: (999.99 + 19.99 + 199.99) / 3 = 406.66',
              columns: ['p.name', 'category_avg'],
              rows: [['Laptop', 406.66]],
            },
            {
              label: 'p = Keyboard (Accessories)',
              note: 'The category changed, so the query now averages a different pair: (49.99 + 9.99) / 2 = 29.99',
              columns: ['p.name', 'category_avg'],
              rows: [['Keyboard', 29.99]],
            },
            {
              label: 'p = Desk (Furniture)',
              note: 'And again for Furniture: (299.99 + 149.99) / 2 = 224.99',
              columns: ['p.name', 'category_avg'],
              rows: [['Desk', 224.99]],
            },
          ],
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'Correlated subqueries are slow, and it is not subtle',
          body:
            'The inner query runs once per outer row. On a table with a million rows that is a million separate queries. Whenever you can rewrite a correlated subquery as a plain join or a `GROUP BY`, do that instead — Chapter 6 is largely about how. Use a correlated subquery when the join version would be genuinely harder to read.',
        },
        {
          type: 'note',
          tone: 'info',
          title: 'The classic correlated query',
          body:
            '"The most expensive product **in each category**" is the same shape: `WHERE price = (SELECT MAX(x.price) FROM products x WHERE x.category = p.category)`. Compare the Laptop, the Desk and the Keyboard. This is the query people reach for first, and it is worth being able to write from memory.',
        },
      ],
    },
    {
      id: 'exists',
      number: '5.4',
      title: 'EXISTS asks a yes-or-no question',
      blocks: [
        {
          type: 'theory',
          body: [
            'Both of these ask the same question — is there a five-star review for this product? — and they are not equally safe.',
            '`EXISTS` runs the subquery and cares only about whether it produced **any row at all**. It does not fetch the values, compare them, or care what they were. That makes it faster, and — as section 2.4 showed — immune to the `NULL` trap that quietly destroys `NOT IN`.',
          ],
        },
        {
          type: 'code',
          caption:
            'Note `SELECT 1`. The value is never used; only the existence of a row matters, so the cheapest possible projection is used.',
          code: 'SELECT p.name\nFROM products p\nWHERE EXISTS (\n  SELECT 1 FROM reviews r WHERE r.product_id = p.id AND r.rating = 5\n)\nORDER BY p.id;',
          expect: {
            label: '1 product with a 5-star review',
            columns: ['name'],
            rows: [['Laptop']],
          },
        },
        {
          type: 'code',
          caption: 'Flip it to `NOT EXISTS` and you get the unrated products — without the `LEFT JOIN` from 4.3.',
          code: 'SELECT p.name\nFROM products p\nWHERE NOT EXISTS (SELECT 1 FROM reviews r WHERE r.product_id = p.id)\nORDER BY p.id;',
          expect: {
            label: '3 products with no review at all',
            columns: ['name'],
            rows: [['Mouse'], ['Desk'], ['Chair']],
          },
        },
        {
          type: 'theory',
          body: [
            'The difference matters more than it looks. Here is `NOT IN` doing the same job, on a nullable column.',
          ],
        },
        {
          type: 'code',
          tone: 'bad',
          caption:
            'Zero rows. The subquery returns the five ratings `5, NULL, 4, NULL, 3`, and section 2.4 already showed what a single `NULL` in a `NOT IN` list does: the whole comparison becomes unknown, so nothing can ever match. Not a bug in the data — a bug in the operator.',
          code: 'SELECT id FROM reviews WHERE id NOT IN (SELECT rating FROM reviews);',
          expect: { label: '0 rows', columns: ['id'], rows: [] },
        },
        {
          type: 'code',
          caption:
            'The same question, asked with `NOT EXISTS`, gets a real answer: reviews 2 and 4 are the only ones whose rating never repeats.',
          code: 'SELECT r.id, r.rating\nFROM reviews r\nWHERE NOT EXISTS (\n  SELECT 1 FROM reviews x WHERE x.id = r.id AND x.rating = r.rating\n)\nORDER BY r.id;',
          expect: {
            label: '2 rows — the NULL-rating reviews',
            columns: ['id', 'rating'],
            rows: [
              [2, null],
              [4, null],
            ],
          },
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'The rule to remember',
          body:
            'Use `EXISTS` / `NOT EXISTS` whenever the question is "is there a match?" Use `IN` when you genuinely want to compare against a list of values. The moment a nullable column could be on either side, prefer `EXISTS`.',
        },
        {
          type: 'note',
          tone: 'info',
          title: 'IN still works when nothing is NULL',
          body:
            '`WHERE p.id IN (SELECT r.product_id FROM reviews r)` gives Laptop, Keyboard, Monitor and Mouse Pad. It is only unsafe because `product_id` *could* be `NULL`. Whether a shortcut is safe depends on your data, which is exactly why the habit of reaching for `EXISTS` is worth forming.',
        },
      ],
    },
    {
      id: 'set-operations',
      number: '5.5',
      title: 'UNION, INTERSECT and EXCEPT',
      blocks: [
        {
          type: 'theory',
          body: [
            'Everything so far has combined tables by joining them **sideways**. Set operations combine two result sets **stacked on top of each other**, like two lists of the same shape.',
            'The keyword goes between two complete queries, and both sides are run independently. The result has as many columns as one side.',
          ],
        },
        {
          type: 'code',
          caption:
            'Which categories contain an expensive product? Which categories contain a scarce one? `UNION` answers "either", and removes the repeats.',
          code: 'SELECT category FROM products WHERE price > 100\nUNION\nSELECT category FROM products WHERE stock < 50;',
          expect: { label: 'UNION · 2 distinct categories', columns: ['category'], rows: [['Electronics'], ['Furniture']] },
        },
        {
          type: 'code',
          caption:
            'Same two queries, `UNION ALL`. Now every appearance counts: four expensive products and three scarce ones make seven rows, and Electronics appears four times because four separate products qualify.',
          code: 'SELECT category FROM products WHERE price > 100\nUNION ALL\nSELECT category FROM products WHERE stock < 50;',
          expect: {
            label: 'UNION ALL · 7 rows, duplicates kept',
            columns: ['category'],
            rows: [
              ['Electronics'],
              ['Electronics'],
              ['Furniture'],
              ['Furniture'],
              ['Electronics'],
              ['Electronics'],
              ['Furniture'],
            ],
          },
        },
        {
          type: 'code',
          caption: '`INTERSECT` keeps only what is in both. Electronics qualifies on both sides, Furniture does not.',
          code: 'SELECT category FROM products WHERE price > 900\nINTERSECT\nSELECT category FROM products WHERE stock < 30;',
          expect: { label: 'INTERSECT · 1 category', columns: ['category'], rows: [['Electronics']] },
        },
        {
          type: 'code',
          caption: '`EXCEPT` is subtraction: everything on the left that is not on the right. Only Accessories never holds a scarce product.',
          code: 'SELECT category FROM products\nEXCEPT\nSELECT category FROM products WHERE stock < 50;',
          expect: { label: 'EXCEPT · 1 category', columns: ['category'], rows: [['Accessories']] },
        },
        {
          type: 'code',
          caption:
            'A last look at why `UNION ALL` exists. Nine order ids and six customer ids overlap completely, so `UNION` would throw away six rows of real information.',
          code: 'SELECT id FROM orders\nUNION ALL\nSELECT id FROM customers;',
          expect: {
            label: '15 rows — nine plus six, no de-duplication',
            columns: ['id'],
            rows: [
              [1], [2], [3], [4], [5], [6], [7], [8], [9],
              [1], [2], [3], [4], [5], [6],
            ],
          },
        },
        {
          type: 'code',
          tone: 'bad',
          caption:
            'The two sides must have the same number of columns. The column *names* are ignored — SQLite takes the left-hand ones — so a mismatch in shape is an error but a mismatch in naming is not.',
          code: 'SELECT category FROM products\nUNION\nSELECT name, city FROM customers;',
          expectError: true,
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'UNION hides duplicates, and duplicates are often the point',
          body:
            'If you are counting things, `UNION` will quietly merge identical rows and your count will be wrong. `UNION ALL` keeps every row, and the counting happens honestly. Reach for `UNION` only when the repetition itself is meaningless.',
        },
        {
          type: 'note',
          tone: 'info',
          title: 'Add ORDER BY at the end, if you care about order',
          body:
            'Set operations do not promise an order — the rows above are grouped, but that is an implementation detail rather than a guarantee. If the order matters, put one `ORDER BY` after the final query, not on either side.',
        },
        {
          type: 'theory',
          body: [
            'That is Part Two. You can now put tables side by side with a join, nest one query inside another, and stack two result sets together. Part Three changes the grain of the data itself: Chapter 6 collapses many rows into totals, Chapter 7 changes what is stored, and Chapter 8 computes across rows without collapsing them.',
          ],
        },
      ],
    },
  ],
  commonMistakes: [
    'A subquery in a comparison that returns several rows — SQLite uses the first one silently instead of complaining. Use `IN` for lists, or `EXISTS` for yes-or-no questions.',
    '`WHERE id NOT IN (SELECT rating FROM reviews)` — one `NULL` in the list makes the whole query return zero rows. `NOT EXISTS` is the safe form.',
    '`UNION` when you meant `UNION ALL` — identical rows on both sides are merged, and any count you take afterwards is quietly short.',
    '`UNION`ing two queries with different column *counts* — that is an error, but different column *names* are accepted and the left-hand names win.',
    'A correlated subquery where a `GROUP BY` would do — it runs once per row, which is fine on seven products and painful on a million.',
    'Assuming a set operation preserves order — add a final `ORDER BY` if the order matters.',
  ],
  cheatsheet: {
    title: 'Subqueries & set operations cheat sheet',
    columns: ['You want to…', 'Write'],
    rows: [
      ['Filter against a list from another query', 'WHERE x IN (SELECT ...)'],
      ['Filter against one computed value', 'WHERE x > (SELECT AVG(x) FROM t)'],
      ['One value per outer row', 'WHERE x = (SELECT MAX(y.x) FROM t y WHERE y.g = p.g)'],
      ['Rows that have a match somewhere', 'WHERE EXISTS (SELECT 1 FROM t WHERE ...)'],
      ['Rows that have no match anywhere', 'WHERE NOT EXISTS (SELECT 1 FROM t WHERE ...)'],
      ['Rows from either query', 'SELECT ... UNION SELECT ...'],
      ['Every row, duplicates included', 'SELECT ... UNION ALL SELECT ...'],
      ['Rows in both queries', 'SELECT ... INTERSECT SELECT ...'],
      ['Rows on the left only', 'SELECT ... EXCEPT SELECT ...'],
    ],
  },
}
