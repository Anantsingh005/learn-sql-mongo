// quizHelp.js
// Gives every quiz question a section, a Quick Info line and 3 tips,
// based on its topic text. Rules are checked in order, so the more
// specific ones come first (self join before join, having before group by).
//
// Usage:  const help = getQuizHelp(question);
//         help.section, help.quickInfo, help.tips (array of 3 strings)

export const SECTION_ORDER = [
  "Reading Data",
  "Filtering Data",
  "Sorting Data",
  "Joins & Relationships",
  "Aggregation",
  "Subqueries & Advanced",
  "Changing Data",
  "Database Concepts"
];

const RULES = [
  {
    key: "window",
    section: "Subqueries & Advanced",
    topic: /window|row_number|rank|partition|\bover\b|lag|lead/,
    text: /\bover\s*\(/,
    quickInfo: "A window function works out a value for each row, while still keeping every row in the result.",
    tips: [
      "OVER (...) is what makes it a window function. Without it, it will not run.",
      "PARTITION BY restarts the calculation for each group.",
      "ORDER BY inside OVER decides the ranking order."
    ]
  },
  {
    key: "cte",
    section: "Subqueries & Advanced",
    topic: /\bcte\b|common table|recursive|with clause|^with\b|\bwith\s*·/,
    text: /\bwith\s+\w+\s+as\s*\(/,
    quickInfo: "A CTE (WITH) gives a temporary name to a result, so the next step can use it like a table.",
    tips: [
      "Write the WITH part first, then the main SELECT after it.",
      "Think in two steps: build the result, then use it.",
      "A CTE only exists for that one query."
    ]
  },
  {
    key: "union",
    section: "Subqueries & Advanced",
    topic: /union/,
    text: /\bunion\b/,
    quickInfo: "UNION stacks the results of two queries on top of each other.",
    tips: [
      "Both SELECTs need the same number of columns.",
      "UNION removes duplicates. UNION ALL keeps them.",
      "Column names come from the first SELECT."
    ]
  },
  {
    key: "exists",
    section: "Subqueries & Advanced",
    topic: /exists/,
    text: /\bexists\s*\(/,
    quickInfo: "EXISTS checks whether a subquery returns at least one row.",
    tips: [
      "Use NOT EXISTS to find rows that have no match.",
      "What the subquery selects does not matter, only whether a row comes back.",
      "Do not compare EXISTS with =. Put it straight after WHERE."
    ]
  },
  {
    key: "correlated",
    section: "Subqueries & Advanced",
    topic: /correlated/,
    text: null,
    quickInfo: "A correlated subquery uses a value from the outer row, so it runs again for each row.",
    tips: [
      "Look for a column from the outer table inside the subquery.",
      "Give the outer and inner tables different aliases.",
      "It can be slow on big tables, so a JOIN is sometimes better."
    ]
  },
  {
    key: "subquery",
    section: "Subqueries & Advanced",
    topic: /subquer|scalar|nested/,
    text: /\(\s*select\b/,
    quickInfo: "A subquery is a query inside another query. The inside one runs first.",
    tips: [
      "Always wrap the subquery in parentheses.",
      "With > or =, the subquery must return a single value.",
      "Use IN when the subquery returns a list of values."
    ]
  },
  {
    key: "case",
    section: "Subqueries & Advanced",
    topic: /\bcase\b|coalesce/,
    text: /\bcase\s+when\b|\bcoalesce\s*\(/,
    quickInfo: "CASE works like if/else inside a query. COALESCE swaps NULL for a default value.",
    tips: [
      "A CASE expression must end with END.",
      "Add an ELSE so rows that match nothing still get a value.",
      "Give the result a name with AS."
    ]
  },
  {
    key: "selfjoin",
    section: "Joins & Relationships",
    topic: /self/,
    text: null,
    quickInfo: "A self join joins a table to itself, for example an employee to their manager.",
    tips: [
      "Give the table two different aliases, like e and m.",
      "Match the child column to the parent id: e.manager_id = m.id.",
      "Use LEFT JOIN if you also want people with no manager."
    ]
  },
  {
    key: "leftjoin",
    section: "Joins & Relationships",
    topic: /left join|right join|anti|outer/,
    text: /\b(left|right)\s+join\b/,
    quickInfo: "LEFT JOIN keeps every row from the left table, even when nothing matches on the right.",
    tips: [
      "Missing matches show up as NULL, not as missing rows.",
      "Add WHERE right_table.id IS NULL to find rows with no match.",
      "RIGHT JOIN is the same idea, keeping every row from the right table."
    ]
  },
  {
    key: "join",
    section: "Joins & Relationships",
    topic: /join/,
    text: /\bjoin\b/,
    quickInfo: "A JOIN combines rows from two tables by matching a shared column, like an id.",
    tips: [
      "Check the ON condition matches the right pair of columns.",
      "A plain JOIN drops rows that have no match.",
      "Use short aliases (e, d) so column names stay clear."
    ]
  },
  {
    key: "having",
    section: "Aggregation",
    topic: /having/,
    text: /\bhaving\b/,
    quickInfo: "HAVING filters groups after GROUP BY has worked out the totals.",
    tips: [
      "WHERE filters rows before grouping. HAVING filters groups after.",
      "Use aggregates in HAVING, like COUNT(*) > 2.",
      "HAVING always comes after GROUP BY."
    ]
  },
  {
    key: "groupby",
    section: "Aggregation",
    topic: /group by|grouping/,
    text: /\bgroup\s+by\b/,
    quickInfo: "GROUP BY puts rows into buckets, then gives one result row for each bucket.",
    tips: [
      "Every selected column must be in GROUP BY or inside an aggregate.",
      "Use COUNT, SUM or AVG to summarize each group.",
      "You can group by more than one column."
    ]
  },
  {
    key: "aggregate",
    section: "Aggregation",
    topic: /count|sum|avg|min|max|aggregat|average/,
    text: /\b(count|sum|avg|min|max)\s*\(/,
    quickInfo: "Aggregate functions turn many rows into one value, like a total or an average.",
    tips: [
      "COUNT(*) counts rows. COUNT(column) skips NULLs.",
      "SUM and AVG ignore NULL values.",
      "Without GROUP BY, an aggregate covers the whole table."
    ]
  },
  {
    key: "null",
    section: "Filtering Data",
    topic: /null/,
    text: /\bis\s+(not\s+)?null\b|=\s*null/,
    quickInfo: "NULL means a value is unknown or missing. It is not the same as 0 or an empty text.",
    tips: [
      "Use IS NULL or IS NOT NULL. Never = NULL.",
      "Comparing anything with NULL gives unknown, so the row is dropped.",
      "COALESCE(column, 0) swaps NULL for a default."
    ]
  },
  {
    key: "pattern",
    section: "Filtering Data",
    topic: /\blike\b|^in$|^in\s*\(|between|wildcard|pattern|range/,
    text: /\b(like|between)\b|\bin\s*\(/,
    quickInfo: "LIKE matches text patterns, IN checks a list of values, and BETWEEN checks a range.",
    tips: [
      "% in LIKE matches any number of characters.",
      "IN (1, 3) is a shorter way to write = 1 OR = 3.",
      "BETWEEN includes both the start and the end value."
    ]
  },
  {
    key: "logic",
    section: "Filtering Data",
    topic: /\band\b|\bor\b|\bnot\b|logic|condition/,
    text: null,
    quickInfo: "AND needs both conditions to be true. OR needs only one. NOT flips a condition.",
    tips: [
      "A single row cannot equal two different values, so that needs OR, not AND.",
      "Use parentheses when you mix AND and OR.",
      "NOT goes in front of the condition it flips."
    ]
  },
  {
    key: "where",
    section: "Filtering Data",
    topic: /where|filter|comparison|equality|operator/,
    text: /\bwhere\b/,
    quickInfo: "WHERE keeps only the rows that match a condition and drops the rest.",
    tips: [
      "WHERE runs before SELECT picks the columns.",
      "Text values need single quotes, like 'Sales'.",
      "Use a single = to compare. Two equals signs is not SQL."
    ]
  },
  {
    key: "sorting",
    section: "Sorting Data",
    topic: /order by|limit|offset|sort|\btop\b/,
    text: /\border\s+by\b|\blimit\b/,
    quickInfo: "ORDER BY sorts the rows. LIMIT keeps only the first few.",
    tips: [
      "DESC means highest first. ASC (the default) means lowest first.",
      "LIMIT without ORDER BY gives an unpredictable set of rows.",
      "Sort by several columns by separating them with commas."
    ]
  },
  {
    key: "modify",
    section: "Changing Data",
    topic: /insert|update|delete|dml/,
    text: /\b(insert\s+into|update\s+\w+\s+set|delete\s+from)\b/,
    quickInfo: "INSERT adds rows, UPDATE changes rows, and DELETE removes rows.",
    tips: [
      "Always use WHERE with UPDATE and DELETE, or every row changes.",
      "In INSERT, the column list and the VALUES list must be in the same order.",
      "Run a SELECT with the same WHERE first to see which rows will change."
    ]
  },
  {
    key: "concepts",
    section: "Database Concepts",
    topic: /primary key|foreign key|index|transaction|constraint|normaliz|table creation|acid/,
    text: null,
    quickInfo: "These are the building blocks that keep a database fast, correct and organized.",
    tips: [
      "A primary key uniquely identifies each row.",
      "An index speeds up searches but costs a little extra storage.",
      "A transaction is all-or-nothing: either every step happens or none."
    ]
  },
  {
    key: "comments",
    section: "Reading Data",
    topic: /comment/,
    text: null,
    quickInfo: "Comments are notes for people. The database ignores them completely.",
    tips: [
      "Two dashes (--) start a comment that lasts until the end of the line.",
      "Use /* ... */ for a comment that spans several lines.",
      "Comments never change what the query returns."
    ]
  },
  {
    key: "alias",
    section: "Reading Data",
    topic: /alias|\bas\b|arithmetic|computed|distinct|comment/,
    text: /\bdistinct\b|\bas\s+\w+/,
    quickInfo: "Aliases rename columns or tables in the output. DISTINCT removes repeated rows.",
    tips: [
      "AS gives a column a new name in the result only.",
      "DISTINCT shows each unique value once.",
      "You can do math in SELECT, like salary * 12."
    ]
  },
  {
    key: "select",
    section: "Reading Data",
    topic: /select|table basics|table|read/,
    text: /\bselect\b/,
    quickInfo: "The SELECT statement is used to retrieve data from a table in a database.",
    tips: [
      "Use column names, not table names (in most cases).",
      "You can select multiple columns using commas.",
      "Use * to select all columns."
    ]
  }
];

const FALLBACK = {
  key: "general",
  section: "Reading Data",
  quickInfo: "Read the query slowly, one clause at a time: FROM, then WHERE, then SELECT.",
  tips: [
    "Work out which table the data comes from first.",
    "Check each clause, one at a time, in the order the database runs them.",
    "Eliminate answers that clearly cannot be right, then compare the rest."
  ]
};

function textOf(q) {
  return [q.question, q.buggyQuery, q.solutionQuery, q.explanation]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function getQuizHelp(question) {
  const topic = `${question.topic || ""} ${question.subtopic || ""}`.toLowerCase().trim();

  for (const rule of RULES) {
    if (rule.topic && rule.topic.test(topic)) return pick(rule);
  }
  const text = textOf(question);
  for (const rule of RULES) {
    if (rule.text && rule.text.test(text)) return pick(rule);
  }
  return pick(FALLBACK);
}

function pick(rule) {
  return {
    key: rule.key,
    section: rule.section,
    quickInfo: rule.quickInfo,
    tips: rule.tips
  };
}
