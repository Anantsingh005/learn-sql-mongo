import { storeSchema } from '../sql/schemas.js'

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
