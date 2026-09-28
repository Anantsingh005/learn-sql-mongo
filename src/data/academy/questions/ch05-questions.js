export default {
  'in-subquery': [
    {
      id: 'q5.1.1',
      prompt:
        'Chapter 3 hard-coded `WHERE category IN (\'Electronics\', \'Furniture\')`. Now suppose you only know that the shop wants every product in a category that contains **something over 200**. Which query finds them?',
      options: [
        'SELECT name, category FROM products WHERE category IN (SELECT category FROM products WHERE price > 200) ORDER BY id;',
        'SELECT name, category FROM products WHERE price > 200;',
        'SELECT name, category FROM products WHERE category IN (SELECT price FROM products WHERE price > 200);',
        'SELECT name, category FROM products WHERE EXISTS (SELECT 1 FROM products x WHERE x.category = products.category AND x.price > 200);',
      ],
      answerIndex: 0,
      explanation:
        'The inner query asks a *different* question from the outer one: not which products are expensive, but which **categories** contain an expensive product. That returns Electronics (the Laptop) and Furniture (the Desk), and the outer query then keeps every product in either — five rows, with the test decided by the data rather than by you. The second option is the trap: it is a perfectly good query for a different question, and it returns two rows instead of five. The third compares a category name against a price, so nothing ever matches. The fourth reaches the same five rows via `EXISTS`, which 5.4 covers properly.',
      check: {
        code:
          'SELECT name, category FROM products\n' +
          'WHERE category IN (SELECT category FROM products WHERE price > 200)\n' +
          'ORDER BY id;',
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
      id: 'q5.1.2',
      prompt:
        'The same shop wants the products with **no review at all**. `WHERE p.id NOT IN (SELECT product_id FROM reviews)` returns Mouse, Desk and Chair. Why does this work here when the chapter spends a whole section warning about `NOT IN`?',
      options: [
        'Because `NOT IN` is never dangerous, and the warning was about a different operator',
        'Because no row in `reviews` has a `NULL` in `product_id` — a single `NULL` in the list is what would empty the whole query',
        'Because `NOT IN` ignores rows that do not appear in the subquery',
        'Because the subquery returns only 3 rows, so there is nothing to conflict with',
      ],
      answerIndex: 1,
      explanation:
        'The trap is a `NULL` in the subquery\'s list, not the `NOT IN` itself. Every one of the five reviews points at a real product, so the list is `1, 1, 4, 7, 3` with no `NULL` in it, and the comparison behaves exactly as you would hope. Had review 2 been about the shop rather than a product, its `product_id` would be `NULL`, and section 2.4 showed what that does: the whole comparison becomes unknown and *nothing* can ever match. Whether a shortcut is safe depends on your data, which is why `NOT EXISTS` is the habit worth forming.',
      check: {
        code: 'SELECT p.name FROM products p WHERE p.id NOT IN (SELECT product_id FROM reviews) ORDER BY p.id;',
        columns: ['name'],
        rows: [['Mouse'], ['Desk'], ['Chair']],
      },
    },
  ],

  'scalar-subquery': [
    {
      id: 'q5.2.1',
      prompt:
        '`SELECT name, price FROM products WHERE price > (SELECT AVG(price) FROM products);` returns exactly two products. Which?',
      options: [
        'Laptop and Desk — the two most expensive',
        'Laptop and Monitor — whatever clears the average of 247.13',
        'Laptop, Desk, Monitor and Chair — everything above 100',
        'Nothing — a subquery inside a comparison is not allowed',
      ],
      answerIndex: 1,
      explanation:
        'The average of all seven prices is 247.13, and the threshold is never written down anywhere — it is computed at the moment the query runs, which is the whole point of a scalar subquery. Only the Desk at 299.99 and the Laptop at 999.99 clear it; the Monitor at 199.99 does not. Note the third option is the mistake of reading "above average" as "above 100", which is a number that *is* written down and therefore needs no subquery at all. A scalar subquery must return exactly one row and one column — `IN` is what you want when it returns a list.',
      check: {
        code: 'SELECT name, price FROM products WHERE price > (SELECT AVG(price) FROM products) ORDER BY price;',
        columns: ['name', 'price'],
        rows: [
          ['Desk', 299.99],
          ['Laptop', 999.99],
        ],
      },
    },
    {
      id: 'q5.2.2',
      prompt:
        'Somebody writes `SELECT name FROM products WHERE price = (SELECT price FROM products);`. The subquery returns **7 rows**, and the query still runs. What does it return, and why is that the dangerous kind of wrong?',
      options: [
        'All 7 products, because every price equals some price',
        'Just the Laptop — SQLite silently uses the first row, so the comparison quietly becomes "is the price 999.99?"',
        'Nothing, because a subquery in a comparison must return exactly one row',
        'An error, but only on some SQLite builds',
      ],
      answerIndex: 1,
      explanation:
        'Just the Laptop, and no error. SQLite does not complain about a scalar subquery that matched more than one row — it quietly takes the first, compares against the Laptop\'s 999.99, and hands back a single answer that looks deliberate. The same silence applies in the other direction: a subquery that matches *no* rows makes the comparison `price > NULL`, which is never true, so you get zero rows and no complaint either. Neither failure mode is visible in the output, which is exactly why a scalar subquery is a trap unless you are sure it can only ever return one row.',
      check: {
        code: 'SELECT name FROM products WHERE price = (SELECT price FROM products);',
        columns: ['name'],
        rows: [['Laptop']],
      },
    },
  ],

  'correlated-subquery': [
    {
      id: 'q5.3.1',
      prompt:
        'Which single query gives every product a count of how many times it has been ordered?',
      options: [
        'SELECT p.name, (SELECT COUNT(*) FROM orders o WHERE o.product_id = p.id) AS times_ordered FROM products p ORDER BY times_ordered DESC, p.id;',
        'SELECT p.name, COUNT(*) AS times_ordered FROM products p JOIN orders o ON p.id = o.product_id GROUP BY p.name;',
        'SELECT p.name, (SELECT COUNT(*) FROM orders o WHERE o.product_id = p.id) AS times_ordered FROM products p;',
        'SELECT p.name, COUNT(*) AS times_ordered FROM products p, orders o;',
      ],
      answerIndex: 0,
      explanation:
        'The inner query refers back to `p.id`, the row it sits inside, so it is run again for each of the seven products and can give a different answer each time — that is what makes it *correlated*. The price of the mechanism is that the inner query cannot run on its own: delete the `p.id` reference and it has nothing to count per row. The second option is the `GROUP BY` route from Chapter 6, which gets the same two Laptop and two Mouse counts and is the faster shape on a large table. The fourth is a cross join: 63 rows, and a count of 9 on every one of them.',
      check: {
        code:
          'SELECT p.name, (SELECT COUNT(*) FROM orders o WHERE o.product_id = p.id) AS times_ordered\n' +
          'FROM products p\n' +
          'ORDER BY times_ordered DESC, p.id;',
        columns: ['name', 'times_ordered'],
        rows: [
          ['Laptop', 2],
          ['Mouse', 2],
          ['Keyboard', 1],
          ['Monitor', 1],
          ['Desk', 1],
          ['Chair', 1],
          ['Mouse Pad', 1],
        ],
      },
    },
    {
      id: 'q5.3.2',
      prompt:
        '"The most expensive product **in each category**" is the classic correlated query. Run it against this shop. Which three products come back?',
      options: [
        'Laptop, Desk and Chair — the three dearest overall',
        'Laptop, Keyboard and Desk — the leader of each category',
        'Laptop and Desk only — Electronics and Furniture have leaders, Accessories does not',
        'One row per category with the category name and a price, because the subquery can only be used in a `SELECT` list',
      ],
      answerIndex: 1,
      explanation:
        'The inner query averages nothing — it takes the `MAX` of prices **within the outer row\'s own category**, so it is recomputed three times and gives three different answers. Each category gets its own leader: the Laptop at 999.99, the Keyboard at 49.99 over the Mouse Pad, and the Desk at 299.99. Note the second option looks wrong because 49.99 is the smallest number in the result, and that is the point — the comparison is against the category, not against the table. Chapter 8 shows the same question answered with `RANK() OVER (PARTITION BY category …)`, which is the shape to reach for once the group is more than two columns wide.',
      check: {
        code:
          'SELECT p.name, p.price FROM products p\n' +
          'WHERE p.price = (SELECT MAX(x.price) FROM products x WHERE x.category = p.category)\n' +
          'ORDER BY p.id;',
        columns: ['name', 'price'],
        rows: [
          ['Laptop', 999.99],
          ['Keyboard', 49.99],
          ['Desk', 299.99],
        ],
      },
    },
  ],

  exists: [
    {
      id: 'q5.4.1',
      prompt:
        'You want the products that have a **5-star** review. Which query is the safe way to ask it?',
      options: [
        'SELECT p.name FROM products p WHERE p.id IN (SELECT product_id FROM reviews WHERE rating = 5);',
        'SELECT p.name FROM products p WHERE EXISTS (SELECT 1 FROM reviews r WHERE r.product_id = p.id AND r.rating = 5) ORDER BY p.id;',
        'SELECT p.name FROM products p WHERE 5 IN (SELECT rating FROM reviews);',
        'SELECT p.name FROM products p JOIN reviews r ON r.product_id = p.id WHERE r.rating = 5;',
      ],
      answerIndex: 1,
      explanation:
        '`EXISTS` runs the subquery and cares only about whether it produced **any row at all** — it never fetches the values or compares them, which is what makes it immune to the `NULL` trap. `SELECT 1` is there because the value is never used, so the cheapest possible projection is the right one. The first option works today for the same reason 5.1.2 did — no `NULL` in `product_id` — but it is one bad row away from returning nothing at all. The fourth is a real join and it happens to give the same single row, so it is not wrong, just a heavier way to ask a yes-or-no question.',
      check: {
        code:
          'SELECT p.name FROM products p\n' +
          'WHERE EXISTS (SELECT 1 FROM reviews r WHERE r.product_id = p.id AND r.rating = 5)\n' +
          'ORDER BY p.id;',
        columns: ['name'],
        rows: [['Laptop']],
      },
    },
    {
      id: 'q5.4.2',
      prompt:
        'Two ways to ask "which reviews have a rating nothing else repeats". One returns **0 rows**, the other returns **2**. Why?',
      options: [
        'The `NOT EXISTS` version is the buggy one, because `NULL` cannot be compared',
        '`NOT IN` compares against the list 5, NULL, 4, NULL, 3 — and a single `NULL` in a `NOT IN` list makes the whole condition unknown, so nothing can ever match',
        'Both are right, but `EXISTS` is only faster, not different in its answer',
        '`NOT IN` needs the subquery to return one column, and `rating` is the wrong column',
      ],
      answerIndex: 1,
      explanation:
        'Reviews 2 and 4 have no rating, so the subquery\'s list is `5, NULL, 4, NULL, 3`. Section 2.4 is explicit about what a `NULL` in a `NOT IN` list does: every comparison becomes unknown, `unknown` is not `true`, and the answer is zero rows. Not a bug in the data — a bug in the operator. `NOT EXISTS` asks the same question as a yes-or-no and gets a real answer, returning the two `NULL`-rating reviews. This is the one place the two are not interchangeable at all.',
      check: {
        code: 'SELECT COUNT(*) AS rows FROM reviews WHERE id NOT IN (SELECT rating FROM reviews);',
        columns: ['rows'],
        rows: [[0]],
      },
    },
  ],

  'set-operations': [
    {
      id: 'q5.5.1',
      prompt:
        'Two queries: categories holding a product over 100, and categories holding a product with stock under 50. Stacking them with `UNION` gives 2 rows; with `UNION ALL` it gives 7. What is the extra 5 made of?',
      options: [
        'Five categories that appear on only one side',
        'The repeats: Electronics qualifies 4 times over and Furniture 3 times, and `UNION` collapses identical rows while `UNION ALL` keeps all 7',
        'Five products, because `UNION` works on rows and `UNION ALL` works on tables',
        'The join between the two queries, which `UNION` silently drops',
      ],
      answerIndex: 1,
      explanation:
        'Four Electronics products are over 100 and three products are scarce, and the two lists overlap, so `UNION ALL` counts 4 + 3 = 7 appearances. `UNION` removes duplicate rows — and since both sides only ever produce category *names*, everything collapses to the 2 distinct categories. That is the warning in one line: if you are counting things, `UNION` will quietly merge identical rows and your count will be short. `UNION ALL` keeps every row and the counting happens honestly.',
      check: {
        code:
          'SELECT COUNT(*) AS rows FROM (\n' +
          '  SELECT category FROM products WHERE price > 100\n' +
          '  UNION ALL\n' +
          '  SELECT category FROM products WHERE stock < 50\n' +
          ');',
        columns: ['rows'],
        rows: [[7]],
      },
    },
    {
      id: 'q5.5.2',
      prompt:
        '`EXCEPT` is subtraction: everything on the left that is not on the right. `SELECT category FROM products EXCEPT SELECT category FROM products WHERE stock < 50;` returns which category, and why that one?',
      options: [
        'Electronics — it is the only category with a product over 100',
        'Accessories — Accessories is the only category that never holds a scarce product',
        'Furniture — Desk is the only product with stock under 50',
        'All three — `EXCEPT` returns the left side unchanged',
      ],
      answerIndex: 1,
      explanation:
        'The right side collects every category that contains something with stock under 50: the Laptop at 25 and the Monitor at 40 make Electronics, and the Desk at 15 makes Furniture. Subtracting those from the three categories leaves **Accessories**, whose two products hold 80 and 200. The trap is assuming a category is safe because of how it *feels* — Accessories has the cheapest product in the shop, but the filter here is `stock`, not `price`, and a cheap Mouse Pad that is well stocked is not scarce at all. `EXCEPT` also gives no order and no duplicates, so add a final `ORDER BY` if the order matters.',
      check: {
        code: 'SELECT category FROM products EXCEPT SELECT category FROM products WHERE stock < 50;',
        columns: ['category'],
        rows: [['Accessories']],
      },
    },
  ],
}
