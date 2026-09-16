export const storeSchema = {
  customers: {
    columns: ['id', 'name', 'city', 'signup_date'],
    rows: [
      [1, 'Alice', 'London', '2022-08-01'],
      [2, 'Bob', 'New York', '2022-10-12'],
      [3, 'Carol', 'London', '2023-01-15'],
      [4, 'Dave', 'Paris', '2023-02-20'],
      [5, 'Eve', 'Berlin', '2023-03-05'],
      [6, 'Frank', 'London', '2023-06-30'],
    ],
  },
  products: {
    columns: ['id', 'name', 'category', 'price', 'stock'],
    rows: [
      [1, 'Laptop', 'Electronics', 999.99, 25],
      [2, 'Mouse', 'Electronics', 19.99, 120],
      [3, 'Keyboard', 'Accessories', 49.99, 80],
      [4, 'Monitor', 'Electronics', 199.99, 40],
      [5, 'Desk', 'Furniture', 299.99, 15],
      [6, 'Chair', 'Furniture', 149.99, 60],
      [7, 'Mouse Pad', 'Accessories', 9.99, 200],
    ],
  },
  orders: {
    columns: ['id', 'customer_id', 'product_id', 'quantity', 'order_date'],
    rows: [
      [1, 1, 1, 1, '2023-01-20'],
      [2, 1, 3, 2, '2023-02-01'],
      [3, 2, 4, 1, '2023-02-25'],
      [4, 3, 2, 5, '2023-03-10'],
      [5, 3, 5, 1, '2023-03-15'],
      [6, 4, 6, 4, '2023-04-20'],
      [7, 5, 7, 3, '2023-06-01'],
      [8, 5, 2, 2, '2023-06-10'],
      [9, 6, 1, 1, '2023-07-12'],
    ],
  },
}

export default storeSchema