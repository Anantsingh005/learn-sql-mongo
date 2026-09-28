import { storeSchema } from '../sql/schemas.js'

/**
 * The database used by every worked example in the book.
 *
 * `customers` / `products` / `orders` are the *same three tables* as
 * `storeSchema` (the schema behind all 60 multiple-choice quiz questions), so
 * every example here is runnable against the exact data the player already
 * meets in the quiz. We deliberately re-export them rather than editing
 * `storeSchema` — those questions have machine-checked answers that depend on
 * its current contents.
 *
 * `reviews` is the one addition. Chapter 2 needs real NULL values to teach
 * `IS NULL` and three-valued logic honestly, and none of the shop tables have
 * any. It is introduced in section 2.3, where the reader is told it is being
 * added, and it becomes the fourth table the rest of the book builds on.
 *
 * Its `constraints` are real: Chapter 7 needs to show a `CHECK` and a foreign
 * key refusing bad data, and a violation the reader cannot reproduce is not
 * worth printing. Every existing row satisfies all three, and Chapter 2 only
 * ever reads `columns` and `rows`, so adding a key here changes nothing that
 * has already been verified.
 */
export const academySchema = {
  ...storeSchema,
  reviews: {
    columns: ['id', 'product_id', 'rating', 'comment'],
    rows: [
      [1, 1, 5, 'Fast and quiet'],
      [2, 1, null, 'Arrived late'],
      [3, 4, 4, null],
      [4, 7, null, 'Good value'],
      [5, 3, 3, 'Keys feel cheap'],
    ],
    constraints:
      'FOREIGN KEY (product_id) REFERENCES products(id), CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)',
  },
}

export default academySchema
