export default {
  insert: [
    {
      id: 'q7.1.1',
      prompt:
        'You add a Standing Desk at 549.99 with 6 in stock. Which `INSERT` puts it in correctly?',
      options: [
        'INSERT INTO products (id, name, category, price, stock) VALUES (8, \'Standing Desk\', \'Furniture\', 549.99, 6);',
        'INSERT INTO products VALUES (8, \'Standing Desk\', \'Furniture\', 549.99, 6);',
        'INSERT INTO products (name, category, price, stock) VALUES (8, \'Standing Desk\', \'Furniture\', 549.99, 6);',
        'INSERT INTO products (id, name, category, price, stock) VALUES (549.99, 6, \'Standing Desk\', \'Furniture\');',
      ],
      answerIndex: 0,
      explanation:
        'The columns are named, and the values follow in exactly that order — `id` 8, the name, the category, then the two numbers. The second option works *today*, which is what makes it the interesting one: with the column list omitted the values line up with the table\'s current layout by luck, and nothing in the statement says "the third value is the category", so nobody can tell whether the row is correct. Add a column tomorrow and it starts writing into the wrong place. The third option names four columns for five values, and the fourth pairs the numbers with the wrong columns entirely.',
      check: {
        code:
          "INSERT INTO products (id, name, category, price, stock)\n" +
          "VALUES (8, 'Standing Desk', 'Furniture', 549.99, 6);\n" +
          'SELECT id, name, price, stock FROM products WHERE id = 8;',
        columns: ['id', 'name', 'price', 'stock'],
        rows: [[8, 'Standing Desk', 549.99, 6]],
      },
    },
    {
      id: 'q7.1.2',
      prompt:
        'You forget `id` entirely: `INSERT INTO products (name, category, price, stock) VALUES (\'Ghost\', \'Accessories\', 1.00, 1);`. SQLite **accepts it**. What lands in the table?',
      options: [
        'An error, because `id` is a primary key and cannot be left out',
        'A row with `id` set to `NULL`, which sorts before every number and so appears at the top of any ordered list',
        'A row with `id` automatically set to 8, the next free number',
        'A row with `id` set to 0, because that is the default for a missing integer',
      ],
      answerIndex: 1,
      explanation:
        'This is the argument for naming your columns, in one row. `id` was declared as a plain `PRIMARY KEY` rather than an auto-incrementing one, so SQLite does not fill it in — and unlike every other database, it will not complain either. The row lands with `id` as `NULL`, and since `NULL` sorts before every number it turns up at the top of any `ORDER BY id`, where a report will happily print it. Nothing warned you, and you find out six months later when a list has a mystery first row. The fix is `id INTEGER PRIMARY KEY AUTOINCREMENT` — the database assigns the id, and you stop being able to forget it.',
      check: {
        code:
          "INSERT INTO products (name, category, price, stock)\n" +
          "VALUES ('Ghost', 'Accessories', 1.00, 1);\n" +
          'SELECT id, name FROM products ORDER BY id;',
        columns: ['id', 'name'],
        rows: [
          [null, 'Ghost'],
          [1, 'Laptop'],
          [2, 'Mouse'],
          [3, 'Keyboard'],
          [4, 'Monitor'],
          [5, 'Desk'],
          [6, 'Chair'],
          [7, 'Mouse Pad'],
        ],
      },
    },
  ],

  update: [
    {
      id: 'q7.2.1',
      prompt:
        'The Chair is repriced to 449.99 with 3 left in stock. Run it and read the row back. What does product 6 look like afterwards?',
      options: [
        'id 6, Chair, 449.99, 3 — the `WHERE` matched exactly one row',
        'id 6, Chair, 449.99, 200 — the stock was overwritten by the price column',
        '7 rows changed, because `UPDATE` acts on the table and the `WHERE` is only a suggestion',
        'Nothing, because `UPDATE` cannot change a price once a row exists',
      ],
      answerIndex: 0,
      explanation:
        'One row, found by primary key, changed in exactly the two columns named. The `WHERE` is not a suggestion — it is the entire part of the statement that decides which rows are affected, which is why the chapter says to write it first: start from `SELECT * FROM products WHERE id = 6`, look at what comes back, and only then change `SELECT *` into `UPDATE … SET …`. If that `SELECT` returns seven rows, the `UPDATE` changes seven rows. A `WHERE` on a primary key that matches one row cannot do this by accident.',
      check: {
        code:
          'UPDATE products SET price = 449.99, stock = 3 WHERE id = 6;\n' +
          'SELECT id, name, price, stock FROM products WHERE id = 6;',
        columns: ['id', 'name', 'price', 'stock'],
        rows: [[6, 'Chair', 449.99, 3]],
      },
    },
    {
      id: 'q7.2.2',
      prompt:
        'Same statement with the `WHERE` deleted: `UPDATE products SET price = 0;`. How many rows end up at zero?',
      options: [
        '1 — the most recently inserted product',
        '0 — a `WHERE` is optional, so this is a no-op',
        '7 — every product in the table, because with no `WHERE` the statement matches them all',
        'It is an error, since `SET` requires a `WHERE`',
      ],
      answerIndex: 2,
      explanation:
        'All seven, in one statement, and SQLite reports no problem. This is the most expensive kind of typo in SQL precisely because a wrong `SELECT` costs you nothing and a wrong `UPDATE` costs you the table. `SET` is not a special case of "insert" and the number of rows affected is a consequence of the `WHERE`, not of the verb. The habit that prevents it: write the `WHERE` first, confirm the rows it selects are the rows you meant, then swap `SELECT *` for `UPDATE … SET …`.',
      check: {
        code: 'UPDATE products SET price = 0; SELECT COUNT(*) AS zero_priced FROM products;',
        columns: ['zero_priced'],
        rows: [[7]],
      },
    },
  ],

  delete: [
    {
      id: 'q7.3.1',
      prompt:
        'The Mouse is discontinued and no review refers to it, so `DELETE FROM products WHERE id = 2;` succeeds. What is the state afterwards?',
      options: [
        '6 products remain, and the Laptop is untouched — the `WHERE` on the primary key matched one row',
        '5 products remain, because deleting a product also removes its category',
        '0 products remain, because `DELETE` ignores a `WHERE` on a primary key',
        'An error, because product 2 still appears in the orders table',
      ],
      answerIndex: 0,
      explanation:
        'Six products and the Laptop untouched: the `WHERE` did the deciding, exactly as with `UPDATE`. `DELETE FROM table` takes no column list, because there is no new value to supply — the whole question is which rows go, so the statement is nothing but a target and a `WHERE`. That makes it the most dangerous statement in SQL and also the easiest to write correctly: one keyword decides everything. The select-before-you-delete habit works here too, and it is the only way to find out *beforehand* whether the delete will be refused.',
      check: {
        code:
          'DELETE FROM products WHERE id = 2;\n' +
          'SELECT COUNT(*) AS remaining, (SELECT name FROM products WHERE id = 1) AS laptop FROM products;',
        columns: ['remaining', 'laptop'],
        rows: [[6, 'Laptop']],
      },
    },
    {
      id: 'q7.3.2',
      prompt:
        'You also want rid of the reviews nobody scored. Which statement is correct, and what survives?',
      options: [
        '`DELETE FROM reviews WHERE rating = NULL;` — three reviews remain',
        '`DELETE FROM reviews WHERE rating IS NULL;` — three scored reviews remain',
        '`DELETE FROM reviews WHERE comment IS NULL;` — three scored reviews remain',
        '`DELETE FROM reviews;` — the table is emptied',
      ],
      answerIndex: 1,
      explanation:
        '`IS NULL` is the only correct test here, because `rating = NULL` never matches — section 2.3 is explicit that a comparison with `NULL` is never true, so that version would have deleted nothing at all and reported success. Reviews 1, 3 and 5 keep their scores. The third option is a different question: it would remove review 3, the one with a rating but no comment, leaving reviews 1, 2, 4 and 5. The last is the un-`WHERE`d version of the same mistake as 7.2, and it does empty the table.',
      check: {
        code: 'DELETE FROM reviews WHERE rating IS NULL; SELECT id, rating FROM reviews ORDER BY id;',
        columns: ['id', 'rating'],
        rows: [
          [1, 5],
          [3, 4],
          [5, 3],
        ],
      },
    },
  ],

  constraints: [
    {
      id: 'q7.4.1',
      prompt:
        'The Mouse Pad is the cheapest product and one review refers to it. `DELETE FROM products WHERE price < 10;` is **refused**. What two-statement version does work, and what state does it leave?',
      options: [
        'Delete the parent first and the child second — 6 products and 5 reviews',
        'Delete the child first, then the parent — 6 products and 4 reviews',
        'Add `ON DELETE CASCADE` mentally; nothing else changes — 6 products and 5 reviews',
        'Delete both in one statement separated by a comma — 6 products and 4 reviews',
      ],
      answerIndex: 1,
      explanation:
        'The order is the whole trick. Deleting the Mouse Pad would leave review 4 pointing at a product that is no longer there, and since this foreign key was declared without `ON DELETE CASCADE` the database stops the entire statement rather than half-applying it. Remove the child first and the constraint is satisfied by the time the second statement runs, leaving 6 products and 4 reviews. Note the failed statement changed nothing at all — it is not a partial delete. The third option is a real design choice, and the honest framing is that both are legitimate as long as you know which one you have.',
      check: {
        code:
          'DELETE FROM reviews WHERE product_id = 7;\n' +
          'DELETE FROM products WHERE id = 7;\n' +
          'SELECT (SELECT COUNT(*) FROM products) AS products, (SELECT COUNT(*) FROM reviews) AS reviews;',
        columns: ['products', 'reviews'],
        rows: [[6, 4]],
      },
    },
    {
      id: 'q7.4.2',
      prompt:
        'A review of the shop itself, with `product_id` left as `NULL`, is **accepted**. Why is a `NULL` foreign key legal when a review is supposed to point at a product?',
      options: [
        'It is a bug in SQLite — foreign keys are off by default and nothing is being checked',
        'A nullable foreign key that has not been filled in yet is a normal state, and there is no product being claimed, so there is nothing to check',
        '`NULL` is treated as 0, and no product has `id` 0 so the check passes anyway',
        'It is accepted only because `PRAGMA foreign_keys` is off in this connection',
      ],
      answerIndex: 1,
      explanation:
        'A foreign key that *points at* something cannot be unknown, but a nullable one that simply has not been filled in yet is a legitimate state — "this review is about the shop, not a product". There is no product being claimed, so the constraint has nothing to compare against and the row lands with a `NULL` in `product_id`. The first and fourth options are the same wrong idea twice: the pragma *is* on, which is why `DELETE FROM products WHERE price < 10` was refused one question ago. That pragma line is the first thing to put in your own SQLite connection code.',
      check: {
        code:
          "INSERT INTO reviews (id, product_id, rating, comment)\n" +
          "VALUES (6, NULL, 4, 'Review of the shop itself');\n" +
          'SELECT id, product_id, rating FROM reviews WHERE id = 6;',
        columns: ['id', 'product_id', 'rating'],
        rows: [[6, null, 4]],
      },
    },
  ],

  transactions: [
    {
      id: 'q7.5.1',
      prompt:
        'Five units are moved from the Mouse to the Desk inside a transaction that ends in `ROLLBACK` instead of `COMMIT`. Read the stock afterwards. What is it?',
      options: [
        'Mouse 115, Desk 20 — the statements ran, so the transfer happened',
        'Mouse 120, Desk 15 — the two statements ran and both rows were touched, but the transaction was undone as a unit',
        'Mouse 115, Desk 15 — the first statement committed on its own',
        'An error, because a transaction cannot contain an `UPDATE`',
      ],
      answerIndex: 1,
      explanation:
        'Unchanged: 120 and 15. This is the point of the section — the same two statements ran and the same two rows were touched, and yet the transfer never happened, because `ROLLBACK` discarded the group as a unit. That is the safety net for everything that can go wrong halfway: a crash, a timeout, a constraint failure in between, a change of mind. Note that a single `INSERT`, `UPDATE` or `DELETE` was already atomic; a transaction is what makes a *group* of them atomic, which is what real work like moving stock between two products actually is.',
      check: {
        code:
          'BEGIN;\n' +
          'UPDATE products SET stock = stock - 5 WHERE id = 2;\n' +
          'UPDATE products SET stock = stock + 5 WHERE id = 5;\n' +
          'ROLLBACK;\n' +
          'SELECT name, stock FROM products WHERE id IN (2, 5) ORDER BY id;',
        columns: ['name', 'stock'],
        rows: [
          ['Mouse', 120],
          ['Desk', 15],
        ],
      },
    },
    {
      id: 'q7.5.2',
      prompt:
        '`INSERT INTO reviews (id, product_id, rating, comment) VALUES (9, 2, 4, \'Temp\');` asks for `id` 9. What does `last_insert_rowid()` report, and why is it not what it looks like?',
      options: [
        '9 — the function returns the value you supplied in the `id` column',
        '6 — `id` is a plain `PRIMARY KEY` column rather than an `INTEGER PRIMARY KEY` row id, so the two numbers have nothing to do with each other',
        '0 — nothing was auto-generated, so the function returns nothing',
        'An error, because `last_insert_rowid()` only works with `AUTOINCREMENT`',
      ],
      answerIndex: 1,
      explanation:
        'It reports 6, while the largest `id` in the table is 9. `last_insert_rowid()` asks for the internal row id, and in this schema `id` is an ordinary `PRIMARY KEY (id)` column — a different thing that happens to be declared separately. Had your code trusted the return value it would have gone on to use 6 as a product id, silently attaching the next insert to the wrong product, with no error anywhere. The fix is `id INTEGER PRIMARY KEY AUTOINCREMENT`, where `id` *is* the row id, the database assigns it, and you stop being able to forget it.',
      check: {
        code:
          "INSERT INTO reviews (id, product_id, rating, comment)\n" +
          "VALUES (9, 2, 4, 'Temp');\n" +
          'SELECT last_insert_rowid() AS last_rowid, (SELECT MAX(id) FROM reviews) AS max_id;',
        columns: ['last_rowid', 'max_id'],
        rows: [[6, 9]],
      },
    },
  ],
}
