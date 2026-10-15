import TableCard from './TableCard.jsx'

// A reference table from the lesson data (label + columns + rows), shown as the
// styled table card: label chip, header row, zebra rows, horizontal scroll.

export default function ResultBlock({ label, caption, columns, rows }) {
  return (
    <TableCard
      label={label ?? 'Table'}
      caption={caption}
      columns={columns}
      rows={rows}
    />
  )
}
