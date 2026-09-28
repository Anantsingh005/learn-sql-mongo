export default {
  'inner-join': [
    {
      id: 'q4.1.1',
      prompt:
        'Pick the query that gives each order the name of the customer who placed it.',
      options: [
        'SELECT o.id, c.name FROM orders o JOIN customers c ON o.customer_id = c.id;',
        'SELECT o.id, c.name FROM orders o, customers c;',
        'SELECT o.id, c.name FROM orders o JOIN customers c ON o.id = c.id;',
        'SELECT o.id, c.name FROM orders o JOIN customers c ON o.product_id = c.id;',
      ],
      answerIndex: 0,
      explanation:
        'The join needs the key that actually points across: `orders.customer_id` holds the id of the customer, so that is what goes on the left of `=`. The third option is the tempting mistake — matching an order id to a customer id is joining two unrelated primary keys, and since there are nine orders and six customers it silently drops three rows. The fourth option matches the *product* id instead, which is a different join entirely.',
      check: {
        code: 'SELECT COUNT(*) AS joined_rows FROM orders o JOIN customers c ON o.customer_id = c.id;',
        columns: ['joined_rows'],
        rows: [[9]],
      },
    },
    {
      id: 'q4.1.2',
      prompt:
        'That query returns **9 rows** from 9 orders. Why does joining a second table not add any?',
      options: [
        'Because SQL removes duplicate rows as soon as two tables are joined',
        'Because every one of the nine orders found exactly one matching customer, so each order row is copied once beside it',
        'Because `JOIN` only reads the first table when no `AS` alias is used',
        'Because nine is the maximum SQLite will return from a single query',
      ],
      answerIndex: 1,
      explanation:
        'A join does not add rows — it *attaches* to the rows you already have. Each of the nine orders matched one customer (the shop has one order per customer at worst), so each order appears exactly once with a name beside it. Rows only multiply on the far side when several rows match, which is the `LEFT JOIN` story in 4.3: the Laptop appears twice there because it has two reviews.',
    },
  ],

  'three-way': [
    {
      id: 'q4.2.1',
      prompt:
        'You want each order with both the customer name and the product name, and the value of that line. Exactly one of these runs. Which?',
      options: [
        'SELECT name FROM orders o JOIN customers c ON o.customer_id = c.id JOIN products p ON o.product_id = p.id;',
        'SELECT c.name AS customer, p.name AS product FROM orders o JOIN customers c ON o.customer_id = c.id JOIN products p ON o.product_id = p.id;',
        'SELECT customer.name, product.name FROM orders JOIN customers ON orders.customer_id = customers.id JOIN products ON orders.product_id = products.id;',
        'SELECT c.name AS product, p.name AS customer FROM orders o JOIN customers c ON o.customer_id = c.id JOIN products p ON o.product_id = p.id;',
      ],
      answerIndex: 1,
      explanation:
        '`customers` and `products` both have a column called `name`, so a bare `name` is genuinely ambiguous — the database asks which one you meant rather than guessing. Aliasing the tables *and* renaming the columns with `AS` is the fix. The third option fails the same way, since naming the table instead of aliasing it does not tell SQLite which of the two `name` columns you want. The fourth option runs fine and is exactly backwards: it labels the customer as the product.',
      check: {
        code:
          'SELECT c.name AS customer, p.name AS product, ROUND(o.quantity * p.price, 2) AS line_total\n' +
          'FROM orders o\n' +
          'JOIN customers c ON o.customer_id = c.id\n' +
          'JOIN products p ON o.product_id = p.id\n' +
          'ORDER BY line_total DESC;',
        columns: ['customer', 'product', 'line_total'],
        rows: [
          ['Alice', 'Laptop', 999.99],
          ['Frank', 'Laptop', 999.99],
          ['Dave', 'Chair', 599.96],
          ['Carol', 'Desk', 299.99],
          ['Bob', 'Monitor', 199.99],
          ['Alice', 'Keyboard', 99.98],
          ['Carol', 'Mouse', 99.95],
          ['Eve', 'Mouse', 39.98],
          ['Eve', 'Mouse Pad', 29.97],
        ],
      },
      distractorIndices: [0, 2],
    },
    {
      id: 'q4.2.2',
      prompt:
        'Adding `ROUND(o.quantity * p.price, 2)` to that join and wrapping it in `SUM` gives the shop\'s **total revenue**. What is it?',
      options: [
        '3369.80 — because the multiplication happens row by row before the summing',
        '479.98 — the sum of the three product prices only',
        '599.96 — just the largest single order line',
        'The same as `SUM(p.price)`, because the join makes the two equivalent',
      ],
      answerIndex: 0,
      explanation:
        'Once the tables are joined, `quantity` and `price` sit on the same row, so each order can contribute what it was actually worth: nine order lines, each multiplied out and then added up. `ROUND(..., 2)` is there because money in floating point arrives with a long tail — Carol\'s five Mice are `99.94999999999999` before rounding, and the 2 is what turns that into `99.95`. Note the other option that sounds plausible: `SUM(p.price)` would add each product price once per *order row*, not once per unit, so it is a different number and a different question.',
      check: {
        code:
          'SELECT ROUND(SUM(o.quantity * p.price), 2) AS total_revenue\n' +
          'FROM orders o\n' +
          'JOIN customers c ON o.customer_id = c.id\n' +
          'JOIN products p ON o.product_id = p.id;',
        columns: ['total_revenue'],
        rows: [[3369.8]],
      },
    },
  ],

  'left-join': [
    {
      id: 'q4.3.1',
      prompt:
        'You want the products **nobody has reviewed**. Which query finds them?',
      options: [
        'SELECT p.name FROM products p LEFT JOIN reviews r ON r.product_id = p.id WHERE p.id IS NULL;',
        'SELECT p.name FROM products p LEFT JOIN reviews r ON r.product_id = p.id WHERE r.id IS NULL;',
        'SELECT p.name FROM products p LEFT JOIN reviews r ON r.product_id = p.id WHERE r.rating IS NULL;',
        'SELECT p.name FROM products p JOIN reviews r ON r.product_id = p.id WHERE r.rating IS NULL;',
      ],
      answerIndex: 1,
      explanation:
        'The `IS NULL` has to test the side that went missing, and that is the right-hand table. The first option returns **nothing at all**, because every product row has an id — the column you kept is never null. The third option looks for reviews that exist but went unrated, which is a different question: it returns the Mouse Pad, which *has* a review. The fourth option throws away exactly the products you were trying to find, since an inner join keeps only the ones that matched.',
      check: {
        code:
          'SELECT p.name FROM products p\n' +
          'LEFT JOIN reviews r ON r.product_id = p.id\n' +
          'WHERE r.id IS NULL\n' +
          'ORDER BY p.name;',
        columns: ['name'],
        rows: [['Chair'], ['Desk'], ['Mouse']],
      },
    },
    {
      id: 'q4.3.2',
      prompt:
        'Swapping `JOIN` for `LEFT JOIN` on that same pair of tables changes the row count. From how many to how many?',
      options: [
        '5 to 7 — one extra row per product, with NULLs for the missing reviews',
        '5 to 8 — the three unreviewed products come back, and the Laptop appears twice',
        '5 to 10 — every product appears once per review slot',
        '5 to 5 — `LEFT` only changes which columns are filled in, never the count',
      ],
      answerIndex: 1,
      explanation:
        'Three products with no review get their row back with `NULL` in the rating, taking 5 to 8. But the count does not stop there: the Laptop has two reviews, so it is copied twice — that is the fan-out from 4.3 and the reason Chapter 6 warns about counting after a join. The `5` is the inner join losing Mouse, Desk and Chair without mentioning it.',
      check: {
        code: 'SELECT COUNT(*) AS joined_rows FROM products p LEFT JOIN reviews r ON r.product_id = p.id;',
        columns: ['joined_rows'],
        rows: [[8]],
      },
    },
  ],

  'cross-join': [
    {
      id: 'q4.4.1',
      prompt:
        'You write `SELECT COUNT(*) FROM customers c, products p;` expecting a joined report. How many rows do you get, and what do they represent?',
      options: [
        '9 — one row per order',
        '13 — one row per customer plus one per product',
        '42 — every customer paired with every product, because there is no `ON` clause to match anything',
        '0 — SQL refuses a join with no condition',
      ],
      answerIndex: 2,
      explanation:
        'A comma in `FROM` is a `CROSS JOIN`, and with no condition there is nothing to match on, so every row of one table is paired with every row of the other: 6 × 7. SQLite will not warn you and will not refuse it — it hands you all 42 pairs with a straight face. Writing `CROSS JOIN` instead of the comma does not change the row count; it just makes the accident into a decision. This is the join to run with `COUNT(*)` first, because an unexpected count is the cheapest possible bug report.',
      check: {
        code: 'SELECT COUNT(*) AS pairs FROM customers c, products p;',
        columns: ['pairs'],
        rows: [[42]],
      },
    },
    {
      id: 'q4.4.2',
      prompt:
        'A join runs, returns real customer names, and looks entirely plausible — but it is on the wrong key. `SELECT COUNT(*) FROM orders o JOIN customers c ON c.id = o.product_id;` returns how many rows?',
      options: [
        '9 — every order still matched',
        '8 — one order was dropped, because no customer has `id` 7',
        '42 — the join silently became a cross join',
        '0 — matching a product id against a customer id is always an error',
      ],
      answerIndex: 1,
      explanation:
        'Eight, and that is exactly what makes this join dangerous. `o.product_id` is a *product* id being matched against a *customer* id. Most of the numbers overlap, so most rows match and you get a table of genuine, plausible, completely wrong names — order 2 reads as Carol when Alice placed it. Order 7 disappears silently because no customer has `id` 7. Nothing errors, and every value in the result is real; only the question being answered is wrong. Aliasing your tables meaningfully (`JOIN products p`) is what stops `p.customer_id` from ever being tempting.',
      check: {
        code: 'SELECT COUNT(*) AS rows FROM orders o JOIN customers c ON c.id = o.product_id;',
        columns: ['rows'],
        rows: [[8]],
      },
    },
  ],

  'self-join': [
    {
      id: 'q4.5.1',
      prompt:
        'Three customers live in London. You want each pair of them **once**, with nobody paired with themselves. Which query does it?',
      options: [
        'SELECT a.name, b.name FROM customers a JOIN customers b ON a.city = b.city;',
        'SELECT a.name, b.name FROM customers a JOIN customers b ON a.city = b.city AND a.id != b.id;',
        'SELECT a.name, b.name FROM customers a JOIN customers b ON a.city = b.city AND a.id < b.id;',
        'SELECT a.name, b.name FROM customers a JOIN customers a ON a.city = a.city AND a.id < a.id;',
      ],
      answerIndex: 2,
      explanation:
        'A self join is the same table twice under two aliases, matched against each other — there is no other way to say which `name` you mean, since both columns belong to `customers`. The second condition does two jobs: `a.id < b.id` drops each customer\'s match with themselves *and* keeps only one direction of each pair, so you get the 3 London pairs instead of 12. Using `!=` removes the self-matches but leaves every pair listed twice. The last option aliases one table to itself, which is not a join at all — it matches each row only against itself, and `a.id < a.id` is never true, so it returns nothing.',
      check: {
        code:
          'SELECT a.name AS person, b.name AS partner\n' +
          'FROM customers a\n' +
          'JOIN customers b ON a.city = b.city AND a.id < b.id\n' +
          'ORDER BY a.id, b.id;',
        columns: ['person', 'partner'],
        rows: [
          ['Alice', 'Carol'],
          ['Alice', 'Frank'],
          ['Carol', 'Frank'],
        ],
      },
    },
    {
      id: 'q4.5.2',
      prompt:
        'Drop the `a.id < b.id` condition from that self join and count the rows. How many do you get, and why?',
      options: [
        '3 — the London pairs are unaffected',
        '6 — each pair appears once per city',
        '12 — six people paired with themselves, plus the three London pairs counted in both directions',
        '0 — an `ON` clause on the same table is invalid',
      ],
      answerIndex: 2,
      explanation:
        'Twelve. The plain `ON a.city = b.city` matches every customer to everyone sharing their city, which includes themselves, and it reports each pair in both directions: (Alice, Carol) and (Carol, Alice) are two different rows. London contributes 3 × 3 = 9 of them, and the three loners (Bob, Dave, Eve) each pair only with themselves, giving 12. That is a valid query answering a question nobody asked — which is why the count is worth checking before you trust the output.',
      check: {
        code: 'SELECT COUNT(*) AS rows FROM customers a JOIN customers b ON a.city = b.city;',
        columns: ['rows'],
        rows: [[12]],
      },
    },
  ],
}
