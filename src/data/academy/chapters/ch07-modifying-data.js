export default {
  slug: 'modify-data',
  number: 7,
  title: 'Modifying Data',
  subtitle: 'INSERT, UPDATE, DELETE — and the mistakes you cannot undo',
  accent: '#d24444',
  accentInk: '#a32e2e',
  icon: '✎',
  practiceTopic: 'table-query',
  objectives: [
    'Add one row, or many at once, with INSERT',
    'Fill a table from another query with INSERT ... SELECT',
    'Change existing rows with UPDATE, and always scope it with WHERE',
    'Calculate new values from old ones while updating',
    'Remove rows with DELETE, and know when a WHERE is not optional',
    'Let a foreign key or a CHECK stop bad data before it lands',
    'Group several writes into one transaction with BEGIN, COMMIT and ROLLBACK',
  ],
  sections: [
    {
      id: 'insert',
      number: '7.1',
      title: 'INSERT adds rows',
      blocks: [
        {
          type: 'theory',
          body: [
            'Every statement so far has been a `SELECT`: it asked a question and left the data exactly as it found it. `INSERT` is the first statement that changes anything, and that makes it a different kind of risk — a wrong `SELECT` costs you nothing, a wrong `INSERT` costs you a row.',
            'The shape is always the same: name the table, name the columns, then supply the values in the same order.',
          ],
        },
        {
          type: 'dml',
          code: "INSERT INTO products (id, name, category, price, stock)\nVALUES (8, 'Standing Desk', 'Furniture', 549.99, 6);",
          after: {
            label: 'the new row',
            query: 'SELECT id, name, price, stock FROM products WHERE id = 8;',
            columns: ['id', 'name', 'price', 'stock'],
            rows: [[8, 'Standing Desk', 549.99, 6]],
          },
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'Name the columns. Always.',
          body:
            'It is legal to leave the list off, because the values then line up with the table\'s column order as it happens to be defined today. That order is an implementation detail, not a promise: add a column to the table and every such statement starts writing into the wrong place. The column list costs a few characters and makes the statement independent of the table layout.',
        },
        {
          type: 'code',
          tone: 'bad',
          caption:
            'Here is what that shortcut looks like. It works — right up until someone reorders the columns. Nothing in the statement says "the third value is the category", so nobody can tell whether the row is correct.',
          code: "INSERT INTO products VALUES (9, 'Desk Lamp', 'Accessories', 24.99, 30);\n\nSELECT id, name, category, price FROM products WHERE id = 9;",
          expect: {
            label: 'correct today, by luck',
            columns: ['id', 'name', 'category', 'price'],
            rows: [[9, 'Desk Lamp', 'Accessories', 24.99]],
          },
        },
        {
          type: 'theory',
          body: [
            'The column list also lets you be partial. A table can have a column you do not mention, and the row will simply get that column\'s default — or `NULL` if it has no default.',
          ],
        },
        {
          type: 'dml',
          tone: 'bad',
          caption:
            'This one forgets `id` entirely — and it is accepted. Because `id` was declared as a plain `PRIMARY KEY` rather than an auto-incrementing one, the row lands with `id` set to `NULL`, and `NULL` sorts before every number, so it appears at the top of any ordered list. Nothing warned you. Every other database would have refused it.',
          code: "INSERT INTO products (name, category, price, stock)\nVALUES ('Ghost', 'Accessories', 1.00, 1);",
          after: {
            label: 'a row with a NULL id, sorting first',
            query: 'SELECT id, name FROM products ORDER BY id;',
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
        {
          type: 'note',
          tone: 'warn',
          title: 'This is the argument for the column list all over again',
          body:
            'A statement that fails loudly teaches you immediately. A statement that succeeds and writes `NULL` into your primary key teaches you six months later, when a report is mysteriously missing its first row. Section 7.4 returns to this with constraints, which are the real fix.',
        },
        {
          type: 'theory',
          body: [
            'One `VALUES` clause can hold many rows, and it is one statement rather than several — which means one atomic operation rather than a loop that could be interrupted halfway.',
          ],
        },
        {
          type: 'dml',
          caption: 'Two new products, one statement, one transaction.',
          code: "INSERT INTO products (id, name, category, price, stock) VALUES\n  (9, 'Webcam', 'Electronics', 59.99, 40),\n  (10, 'USB-C Hub', 'Electronics', 39.99, 55);",
          after: {
            label: 'both rows are there',
            query: 'SELECT id, name, stock FROM products WHERE id >= 8 ORDER BY id;',
            columns: ['id', 'name', 'stock'],
            rows: [
              [9, 'Webcam', 40],
              [10, 'USB-C Hub', 55],
            ],
          },
        },
        {
          type: 'theory',
          body: [
            'The most useful `INSERT` is the one you do not type by hand. `INSERT ... SELECT` takes rows straight out of a query, which is how data is normally migrated — and section 5.3 already explained why this is a correlated shape in reverse: here the `SELECT` runs first, and the `INSERT` copies whatever it produced.',
          ],
        },
        {
          type: 'dml',
          caption:
            'A backfill: give every product that has never been reviewed a default 4-star review, pulled from a paper survey. Products 2, 5 and 6 have no review, so three rows arrive, with ids computed from the product id so they cannot clash with the existing 1–5.',
          code:
            "INSERT INTO reviews (id, product_id, rating, comment)\nSELECT 10 + p.id, p.id, 4, 'Imported from paper survey'\nFROM products p\nWHERE p.id NOT IN (SELECT product_id FROM reviews WHERE product_id IS NOT NULL);",
          after: {
            label: 'five old reviews plus three new ones',
            query: 'SELECT id, product_id, rating FROM reviews ORDER BY id;',
            columns: ['id', 'product_id', 'rating'],
            rows: [
              [1, 1, 5],
              [2, 1, null],
              [3, 4, 4],
              [4, 7, null],
              [5, 3, 3],
              [12, 2, 4],
              [15, 5, 4],
              [16, 6, 4],
            ],
          },
        },
        {
          type: 'note',
          tone: 'info',
          title: 'The `NOT IN` is doing real work here',
          body:
            'It has to be `WHERE product_id IS NOT NULL` inside the subquery. Without that, the list of ids to exclude would contain a `NULL`, and section 5.4 showed exactly what `NOT IN` does when a `NULL` turns up: it matches nothing at all, so the backfill would insert seven rows instead of three.',
        },
      ],
    },
    {
      id: 'update',
      number: '7.2',
      title: 'UPDATE changes rows',
      blocks: [
        {
          type: 'theory',
          body: [
            '`UPDATE` never touches the shape of a table. It says "for these rows, set these columns to these values", and the grammar is `SET` then `WHERE`.',
            'That order is not a suggestion. Everything after `WHERE` is deciding *which rows change* — so when the `WHERE` is the part you forget, the part that decides everything is the part that was left out.',
          ],
        },
        {
          type: 'dml',
          caption: 'The Chair is repriced and nearly sold out. One row, found by primary key.',
          code: 'UPDATE products SET price = 449.99, stock = 3 WHERE id = 6;',
          after: {
            label: 'the Chair, changed',
            query: 'SELECT id, name, price, stock FROM products WHERE id = 6;',
            columns: ['id', 'name', 'price', 'stock'],
            rows: [[6, 'Chair', 449.99, 3]],
          },
        },
        {
          type: 'dml',
          tone: 'bad',
          caption:
            'Same statement, `WHERE` deleted. This is not a bigger version of the previous example — it is a different and much worse one. All seven products now cost nothing. `SET` is not a special case of "insert"; the number of rows affected is a consequence of the `WHERE`, not of the verb.',
          code: 'UPDATE products SET price = 0;',
          after: {
            label: 'all seven rows matched',
            query: 'SELECT COUNT(*) AS zero_priced FROM products WHERE price = 0;',
            columns: ['zero_priced'],
            rows: [[7]],
          },
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'The habit that prevents it',
          body:
            'Write the `WHERE` first. Start from `SELECT * FROM products WHERE ...`, look at the rows it returns, confirm they are the rows you meant, and only then change `SELECT *` into `UPDATE ... SET ...`. If the `SELECT` returns seven rows, the `UPDATE` will change seven rows — and a `WHERE` on a primary key that matches one row cannot do this by accident.',
        },
        {
          type: 'theory',
          body: [
            'A `WHERE` does not have to name one row. Chapter 2 spent a whole section on conditions, and they all work here — which is how you update a whole category at once, or a range, or everything matching a pattern.',
          ],
        },
        {
          type: 'dml',
          caption:
            'One unit was sold from each of the three Electronics products. The three rows that matched are the three rows that changed; the other four are untouched.',
          code: "UPDATE products SET stock = stock - 1 WHERE category = 'Electronics';",
          after: {
            label: 'Electronics only',
            query: "SELECT name, stock FROM products WHERE category = 'Electronics' ORDER BY name;",
            columns: ['name', 'stock'],
            rows: [
              ['Laptop', 24],
              ['Monitor', 39],
              ['Mouse', 119],
            ],
          },
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'Read the right-hand side against the old value',
          body:
            '`SET stock = stock - 1` means "one less than whatever this row had", so every row decrements by its own amount. `SET stock = 119` would be a far worse sentence, even though on this data it produces the same three numbers. Write the one that stays correct when the data changes.',
        },
        {
          type: 'theory',
          body: [
            'Because the right-hand side is an expression, arithmetic during an update needs no loop either. A 10% price rise across a category is a single statement, and `ROUND` keeps the result a sensible amount of money instead of the usual long tail.',
          ],
        },
        {
          type: 'dml',
          caption: 'Ten percent off two Furniture prices, rounded to the penny.',
          code: "UPDATE products SET price = ROUND(price * 1.1, 2) WHERE category = 'Furniture';",
          after: {
            label: 'Furniture, up 10%',
            query: "SELECT name, price FROM products WHERE category = 'Furniture' ORDER BY name;",
            columns: ['name', 'price'],
            rows: [
              ['Chair', 164.99],
              ['Desk', 329.99],
            ],
          },
        },
        {
          type: 'theory',
          body: [
            'Chapter 6 is not left behind. A `WHERE` can contain a subquery, which is how you update a set of rows chosen by a rule rather than by a list — here, everything that has been ordered at least twice.',
          ],
        },
        {
          type: 'dml',
          caption:
            'The subquery finds Laptop and Mouse (two orders each) and the `UPDATE` zeroes their stock. Two rows changed, and the subquery is the only thing that decided which.',
          code:
            'UPDATE products SET stock = 0\nWHERE id IN (SELECT product_id FROM orders GROUP BY product_id HAVING COUNT(*) >= 2);',
          after: {
            label: 'the two most-ordered products',
            query: 'SELECT name, stock FROM products WHERE stock = 0 ORDER BY name;',
            columns: ['name', 'stock'],
            rows: [
              ['Laptop', 0],
              ['Mouse', 0],
            ],
          },
        },
        {
          type: 'dml',
          tone: 'bad',
          caption:
            'Here is why the subquery belongs in a `WHERE` and not in a column list. SQLite is happy to let a text column be used as a number: it treats each comment as `0`, adds one, and writes the number `1` back over your prose. Four comments are destroyed and nothing is reported. The row whose comment was already `NULL` is the only one untouched.',
          code: 'UPDATE reviews SET comment = comment + 1;',
          after: {
            label: 'every comment is now the number 1',
            query: 'SELECT id, comment FROM reviews ORDER BY id;',
            columns: ['id', 'comment'],
            rows: [
              [1, 1],
              [2, 1],
              [3, null],
              [4, 1],
              [5, 1],
            ],
          },
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'Silently coercing a type is the most expensive class of SQL bug',
          body:
            'Compare the three outcomes: the foreign key in 7.3 and the `CHECK` in 7.4 stop you with an error and change nothing, while this coercion succeeds, reports no problem, and leaves you with a database full of `1`s where your customers\' words used to be. Always check that a column is the type you are about to treat it as, with `typeof(column)` from Chapter 1.',
        },
      ],
    },
    {
      id: 'delete',
      number: '7.3',
      title: 'DELETE removes rows',
      blocks: [
        {
          type: 'theory',
          body: [
            '`DELETE FROM table` takes no column list, because there is no new value to supply. The whole question is which rows go, so the statement is nothing but a target and a `WHERE`.',
            'That makes it the most dangerous statement in SQL, and also the easiest to write correctly: one keyword decides everything.',
          ],
        },
        {
          type: 'dml',
          caption: 'The Mouse is discontinued, and no review refers to it.',
          code: 'DELETE FROM products WHERE id = 2;',
          after: {
            label: 'one product gone',
            query: 'SELECT COUNT(*) AS remaining, (SELECT name FROM products WHERE id = 1) AS laptop FROM products;',
            columns: ['remaining', 'laptop'],
            rows: [[6, 'Laptop']],
          },
        },
        {
          type: 'dml',
          caption:
            'A condition from Chapter 2, used to delete: the two reviews nobody scored. Note that `IS NULL` is the only correct test here — `rating = NULL` never matches, as section 2.3 showed, so it would have deleted nothing at all.',
          code: 'DELETE FROM reviews WHERE rating IS NULL;',
          after: {
            label: 'three scored reviews remain',
            query: 'SELECT id, rating FROM reviews ORDER BY id;',
            columns: ['id', 'rating'],
            rows: [
              [1, 5],
              [3, 4],
              [5, 3],
            ],
          },
        },
        {
          type: 'dml',
          caption:
            'An `IN` list, no subquery needed. Three orders from before March, and the table is down to six.',
          code: "DELETE FROM orders WHERE order_date < '2023-03-01';",
          after: {
            label: 'the oldest three are gone',
            query: "SELECT COUNT(*) AS orders_left, (SELECT COUNT(*) FROM orders WHERE order_date < '2023-03-01') AS old_left FROM orders;",
            columns: ['orders_left', 'old_left'],
            rows: [[6, 0]],
          },
        },
        {
          type: 'dml',
          tone: 'bad',
          caption:
            'The same sentence with the `WHERE` removed. Five reviews, all of them gone, in one statement. There is no `TRUNCATE` shortcut here to soften the lesson: in SQLite this is how you empty a table.',
          code: 'DELETE FROM reviews;',
          after: {
            label: 'the table is empty',
            query: 'SELECT COUNT(*) AS reviews_left FROM reviews;',
            columns: ['reviews_left'],
            rows: [[0]],
          },
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'Select before you delete',
          body:
            'The same habit as `UPDATE`, and it works identically: turn the `DELETE` into `SELECT * FROM reviews WHERE ...`, look at what comes back, and only then put the verb back. It is also the only way to find out *beforehand* whether a `DELETE` will be refused — which is the subject of the next section.',
        },
      ],
    },
    {
      id: 'constraints',
      number: '7.4',
      title: 'Let the database refuse',
      blocks: [
        {
          type: 'theory',
          body: [
            'Everything so far has trusted the statement. `INSERT INTO products` was believed when it wrote a `NULL` id; `comment + 1` was believed when it overwrote prose with `1`. Application code can only be so careful, and the same bug arrives through a different door eventually.',
            'This is what constraints are for. They are rules the database itself enforces on every single write, no matter which application, script or admin tool is holding the pen — and `reviews` has been carrying two of them since Chapter 2, quietly.',
          ],
        },
        {
          type: 'theory',
          body: [
            'The first is a **foreign key**: `FOREIGN KEY (product_id) REFERENCES products(id)`. A review has to point at a product that exists.',
          ],
        },
        {
          type: 'dml',
          expectError: true,
          code: "INSERT INTO reviews (id, product_id, rating, comment)\nVALUES (6, 99, 4, 'Great product');",
          caption: 'There is no product 99, so the row is refused and nothing is written.',
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'Foreign keys are off unless you turn them on',
          body:
            'SQLite ships with `PRAGMA foreign_keys` disabled, so the identical statement would be accepted on a default connection and produce an orphan review pointing at a product that never existed. Every example in this chapter runs with the pragma on. If you are writing SQLite by hand, this is the first line of your connection code.',
        },
        {
          type: 'note',
          tone: 'info',
          title: 'A `NULL` foreign key is allowed, and that is deliberate',
          body:
            'Section 2.3 said a comparison with `NULL` is never true. A foreign key that *points at* something cannot be unknown, but a nullable one that simply has not been filled in yet is a normal state — "this review is about the shop, not a product". Inserting `NULL` into `product_id` succeeds, because there is no product being claimed and so nothing to check.',
        },
        {
          type: 'dml',
          caption: 'A review of the shop itself, with no product attached.',
          code: "INSERT INTO reviews (id, product_id, rating, comment)\nVALUES (6, NULL, 4, 'Review of the shop itself');",
          after: {
            label: 'the row lands, with no product',
            query: 'SELECT id, product_id FROM reviews WHERE id = 6;',
            columns: ['id', 'product_id'],
            rows: [[6, null]],
          },
        },
        {
          type: 'theory',
          body: [
            'The second is a **check constraint**: `CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)`. Read it as a sentence — *either nobody has rated this yet, or the rating is between one and five*. A `CHECK` is an ordinary boolean expression, so anything you could write in a `WHERE` you can write in one.',
          ],
        },
        {
          type: 'dml',
          expectError: true,
          code: 'UPDATE reviews SET rating = 9;',
          caption:
            'Nine is not between one and five, so every row is rejected. The rating of 5 on review 1 is still 5 — a failed statement changes nothing, it does not apply to some rows first.',
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'The `IS NULL OR` is the whole trick',
          body:
            'Without the first half, `CHECK (rating BETWEEN 1 AND 5)` would reject a missing rating as well as an impossible one, and no review could ever be left unrated. `NULL` in a check expression evaluates to unknown rather than true, which section 2.3 covered, so the rule has to name the `NULL` case explicitly.',
        },
        {
          type: 'theory',
          body: [
            'A constraint also protects you from *deleting* the wrong thing, which is where it earns its keep. The Mouse Pad is the cheapest product in the shop, and one review refers to it.',
          ],
        },
        {
          type: 'dml',
          expectError: true,
          code: 'DELETE FROM products WHERE price < 10;',
          caption:
            'Two products match that condition and the statement is still refused. Deleting the Mouse Pad would leave review 4 pointing at a product that is no longer there — so the database stops the whole statement.',
        },
        {
          type: 'note',
          tone: 'info',
          title: 'This is why the deletion order matters',
          body:
            'The database will not cascade on its own here, because this foreign key was declared without an `ON DELETE CASCADE`. It could have been — writing `ON DELETE CASCADE` would have made that `DELETE` succeed and quietly take review 4 with it. Both designs are legitimate; what matters is that you know which one you have, because the difference is a row that survives when you expected it gone and a row that vanishes when you expected it kept.',
        },
        {
          type: 'dml',
          caption:
            'Deleting the children first, in a single statement block, and the parent after. The order is the whole trick. Two statements, and the constraint is satisfied by the time the second one runs.',
          code: 'DELETE FROM reviews WHERE product_id = 7;\nDELETE FROM products WHERE id = 7;',
          after: {
            label: 'the review and the product are both gone',
            query:
              'SELECT (SELECT COUNT(*) FROM products) AS products, (SELECT COUNT(*) FROM reviews) AS reviews;',
            columns: ['products', 'reviews'],
            rows: [[6, 4]],
          },
        },
        {
          type: 'note',
          tone: 'warn',
          title: 'A constraint is the last line of defence, not the first',
          body:
            'Constraints catch the mistakes you did not anticipate. They do not catch the ones you did: a valid rating of 5 for the wrong product, a `DELETE` scoped to the right row at the wrong moment, a backfill that runs twice. Validation in your application is still the first line — this is the layer underneath it that stays honest when the application is not.',
        },
      ],
    },
    {
      id: 'transactions',
      number: '7.5',
      title: 'All of it, or none of it',
      blocks: [
        {
          type: 'theory',
          body: [
            'A single `INSERT`, `UPDATE` or `DELETE` is already atomic — the section 7.4 failures were all-or-nothing, never half-applied. But real work is rarely a single statement. Moving stock between two products is two `UPDATE`s, and if the connection drops between them, the stock has vanished from one row and never arrived at the other.',
            'A **transaction** is the group of statements that should succeed or fail together. `BEGIN` opens it, `COMMIT` makes it permanent, `ROLLBACK` discards it.',
          ],
        },
        {
          type: 'dml',
          caption:
            'Take five Mouse off the shelf and put them on the Desk. Both statements succeed, and `COMMIT` is what makes them permanent.',
          code:
            'BEGIN;\nUPDATE products SET stock = stock - 5 WHERE id = 2;\nUPDATE products SET stock = stock + 5 WHERE id = 5;\nCOMMIT;',
          after: {
            label: '115 on the Mouse, 20 on the Desk',
            query: 'SELECT name, stock FROM products WHERE id IN (2, 5) ORDER BY id;',
            columns: ['name', 'stock'],
            rows: [
              ['Mouse', 115],
              ['Desk', 20],
            ],
          },
        },
        {
          type: 'dml',
          caption:
            'The identical transfer, ending in `ROLLBACK` instead. The same two statements ran and the same two rows were touched — but the transfer never happened, because the transaction was undone as a unit. This is the safety net for everything that could go wrong halfway: a crash, a timeout, a constraint failure in between, a decision to change your mind.',
          code:
            'BEGIN;\nUPDATE products SET stock = stock - 5 WHERE id = 2;\nUPDATE products SET stock = stock + 5 WHERE id = 5;\nROLLBACK;',
          after: {
            label: 'unchanged: 120 and 15',
            query: 'SELECT name, stock FROM products WHERE id IN (2, 5) ORDER BY id;',
            columns: ['name', 'stock'],
            rows: [
              ['Mouse', 120],
              ['Desk', 15],
            ],
          },
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'Roll back on the way out, not only on the way in',
          body:
            'The code around a transaction is the part people get wrong. `ROLLBACK` has to be reachable when something *inside* the block throws — otherwise a failed third statement leaves the first two applied and the transaction open, which is exactly the half-finished state the transaction was opened to prevent. Wrap the block, and let the error path roll back.',
        },
        {
          type: 'note',
          tone: 'info',
          title: 'The lock lasts for the whole transaction',
          body:
            'Between `BEGIN` and `COMMIT`, whoever opened the transaction is holding locks on every row it touched, and nobody else can change them. That is what makes the group consistent — and why a transaction should be short. It is a guarantee, not a place to do slow work.',
        },
        {
          type: 'dml',
          caption:
            'A different kind of change that still needs a group: take one unit of stock and record the review in the same breath. Either both land or neither does, so stock and reviews can never disagree.',
          code:
            "BEGIN;\nUPDATE products SET stock = stock - 1 WHERE id = 2;\nINSERT INTO reviews (id, product_id, rating, comment)\nVALUES (6, 2, 4, 'Solid for the price');\nCOMMIT;",
          after: {
            label: 'one sale and its review, together',
            query:
              'SELECT (SELECT stock FROM products WHERE id = 2) AS mouse_stock, (SELECT COUNT(*) FROM reviews) AS reviews;',
            columns: ['mouse_stock', 'reviews'],
            rows: [[119, 6]],
          },
        },
        {
          type: 'theory',
          body: [
            'One last SQLite-specific trap, because it catches everyone writing their first `INSERT`. `last_insert_rowid()` is a convenient way to ask "what id did that row get?" — but only when `id` is an alias for the internal row id. In this schema it is a plain `PRIMARY KEY (id)` column, which is a *different* thing, so the two numbers have nothing to do with each other.',
          ],
        },
        {
          type: 'dml',
          tone: 'bad',
          caption:
            'The statement asks for id 9. `last_insert_rowid()` reports 6, and the largest id in the table is 9. If your code had trusted that return value it would have gone on to use 6 as a product id, silently attaching the next insert to the wrong product.',
          code: "INSERT INTO reviews (id, product_id, rating, comment)\nVALUES (9, 2, 4, 'Temp');",
          after: {
            label: 'rowid 6, but id 9',
            query: 'SELECT last_insert_rowid() AS last_rowid, (SELECT MAX(id) FROM reviews) AS max_id;',
            columns: ['last_rowid', 'max_id'],
            rows: [[6, 9]],
          },
        },
        {
          type: 'note',
          tone: 'tip',
          title: 'Prefer a real auto-incrementing primary key',
          body:
            'Written as `id INTEGER PRIMARY KEY AUTOINCREMENT`, `id` *is* the row id, the database assigns it, and `last_insert_rowid()` means what it looks like it means. You also stop being able to forget it, which is the `NULL` id from section 7.1 all over again. Or: never supply `id` yourself, and read the id back from the row you just wrote.',
        },
        {
          type: 'theory',
          body: [
            'That is the last write statement. What remains is to ask questions of data you built up yourself — and for that there is a tool that lets a long, tangled query be written as a readable sequence, and a way to look at a whole group of rows at once instead of one row at a time.',
          ],
        },
      ],
    },
  ],
  commonMistakes: [
    'Writing the `UPDATE` or `DELETE` first and the `WHERE` second — or forgetting it. Without one, the statement matches every row in the table.',
    'Trusting a run that succeeded: SQLite accepts a missing `id` as `NULL`, and coerces text to a number when you do arithmetic on it.',
    'Assuming a foreign key is enforced. In SQLite it is not, unless `PRAGMA foreign_keys = ON` was set on the connection.',
    'A `CHECK` that forgets its `NULL` case, so `CHECK (rating BETWEEN 1 AND 5)` rejects every unrated review.',
    'Deleting a parent row before its children, and being surprised that the constraint stopped you.',
    'Running two `UPDATE`s that must agree without a transaction, so a failure between them leaves half the work applied.',
    'Trusting `last_insert_rowid()` when `id` is a plain `PRIMARY KEY` column rather than an `INTEGER PRIMARY KEY` row id.',
  ],
  cheatsheet: {
    title: 'Writing data cheat sheet',
    columns: ['You want to…', 'Write'],
    rows: [
      ['Add a row', "INSERT INTO t (a, b) VALUES (1, 'x');"],
      ['Add many rows', 'INSERT INTO t (a, b) VALUES (1, 2), (3, 4);'],
      ['Add rows from a query', 'INSERT INTO t (a) SELECT x FROM u;'],
      ['Change one row', 'UPDATE t SET a = 1 WHERE id = 7;'],
      ['Change a whole group', "UPDATE t SET a = a - 1 WHERE category = 'X';"],
      ['Calculate while updating', 'UPDATE t SET price = ROUND(price * 1.1, 2) WHERE ...;'],
      ['Change rows chosen by a rule', 'UPDATE t SET stock = 0 WHERE id IN (SELECT ...);'],
      ['Remove rows', 'DELETE FROM t WHERE id = 7;'],
      ['Remove rows with no value', 'DELETE FROM t WHERE rating IS NULL;'],
      ['Make a group of writes safe', 'BEGIN; ... COMMIT;  (or ROLLBACK)'],
    ],
  },
}
