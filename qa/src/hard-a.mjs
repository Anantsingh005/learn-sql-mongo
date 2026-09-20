export const hA = [
  {
    id: 'wrr-hd-a1',
    type: 'write',
    topic: 'recursive org chart path',
    difficulty: 'hard',
    question: 'Write a query that returns each employee together with the full chain of managers above them, from the top down.',
    schema: {
      employees: {
        columns: ['id', 'name', 'manager_id'],
        rows: [
          [1, 'CEO', null],
          [2, 'Ada', 1],
          [3, 'Bo', 2],
          [4, 'Ci', 2],
        ],
      },
    },
    expected: {
      columns: ['name', 'chain'],
      rows: [['CEO', 'CEO'], ['Ada', 'CEO > Ada'], ['Bo', 'CEO > Ada > Bo'], ['Ci', 'CEO > Ada > Ci']],
      orderMatters: false,
    },
    hint: 'Recursive CTE: anchor at NULL manager, then UNION ALL following manager_id once.',
    explanation: "WITH RECURSIVE org AS (SELECT id, name, CAST(name AS TEXT) AS chain FROM employees WHERE manager_id IS NULL UNION ALL SELECT e.id, e.name, org.chain || ' > ' || e.name FROM employees e JOIN org ON e.manager_id = org.id) SELECT name, chain FROM org; Ada CEO > Ada; Bo CEO > Ada > Bo; Ci CEO > Ada > Ci.",
  },
  {
    id: 'wrr-hd-a2',
    type: 'write',
    topic: 'running distinct count window',
    difficulty: 'hard',
    question: 'Write a query that returns, per item, the cumulative count of DISTINCT days it appeared, up to each row.',
    schema: {
      appearances: {
        columns: ['id', 'item', 'day'],
        rows: [
          [1, 'Pen', 1],
          [2, 'Pen', 1],
          [3, 'Pen', 2],
          [4, 'Cup', 1],
          [5, 'Cup', 3],
        ],
      },
    },
    expected: {
      columns: ['item', 'day', 'seen'],
      rows: [['Pen', '1', '1'], ['Pen', '1', '1'], ['Pen', '2', '2'], ['Cup', '1', '1'], ['Cup', '3', '2']],
      orderMatters: false,
    },
    hint: 'ROW_NUMBER() OVER (PARTITION BY item, day ORDER BY id) = 1 flags first appearance per day; summed over item gives distinct-days-so-far.',
    explanation: "SELECT item, day, SUM(CASE WHEN ROW_NUMBER() OVER (PARTITION BY item, day ORDER BY id) = 1 THEN 1 ELSE 0 END) OVER (PARTITION BY item ORDER BY id) AS seen FROM appearances; Pen day1 twice counts once =1 then day2 +1 =2; Cup day1=1 day3=2.",
  },
  {
    id: 'wrr-hd-a3',
    type: 'write',
    topic: 'pivot counts per month side by side',
    difficulty: 'hard',
    question: 'Write a query that pivots, per store, the count of web sales and the count of phone sales into two separate columns.',
    schema: {
      sales: {
        columns: ['id', 'store', 'channel'],
        rows: [
          [1, 'A', 'web'],
          [2, 'A', 'web'],
          [3, 'A', 'phone'],
          [4, 'B', 'web'],
          [5, 'B', 'phone'],
          [6, 'B', 'phone'],
        ],
      },
    },
    expected: {
      columns: ['store', 'web', 'phone'],
      rows: [['A', '2', '1'], ['B', '1', '2']],
      orderMatters: false,
    },
    hint: "COUNT(CASE WHEN channel = 'web' THEN 1 END) inside a GROUP BY store.",
    explanation: "SELECT store, COUNT(CASE WHEN channel = 'web' THEN 1 END) AS web, COUNT(CASE WHEN channel = 'phone' THEN 1 END) AS phone FROM sales GROUP BY store; A web=2 phone=1, B web=1 phone=2.",
  },
]
