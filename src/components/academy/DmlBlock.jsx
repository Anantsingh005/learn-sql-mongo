import BlockCard from './BlockCard.jsx'
import TableCard from './TableCard.jsx'
import CopyButton from './CopyButton.jsx'
import { CodeIcon } from './BlockIcons.jsx'
import { Badge, Caption, CodeSurface } from './BlockParts.jsx'

// A statement that changes data. Same example-card shape as CodeBlock, but the
// card is amber for a normal write and red when the statement is refused. The
// table after the write is shown as its own result table card.

export default function DmlBlock({ code, caption, tone, expectError, after }) {
  const failed = Boolean(expectError)
  const risky = tone === 'bad' && !failed
  const flagged = failed || risky

  const badge = failed
    ? { tone: 'danger', text: 'Refused' }
    : risky
      ? { tone: 'danger', text: 'Careful' }
      : { tone: 'amber', text: 'Writes' }

  return (
    <BlockCard
      icon={<CodeIcon />}
      title="Example"
      tone={flagged ? 'danger' : 'amber'}
      meta={<Badge tone={badge.tone}>{badge.text}</Badge>}
      actions={<CopyButton text={code} />}
      bodyClassName="space-y-3 p-4 sm:p-5"
    >
      {caption && <Caption text={caption} tone={flagged ? 'danger' : 'plain'} />}
      {failed && !caption && (
        <p className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-[13px] leading-relaxed text-danger-700">
          The database refuses this one, and no rows change.
        </p>
      )}

      <CodeSurface code={code} tone={flagged ? 'danger' : 'plain'} />

      {after && (
        <div className="space-y-2.5">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
            {after.label ?? 'After the write'}
          </div>
          {after.query && <CodeSurface code={after.query} />}
          <TableCard columns={after.columns} rows={after.rows} />
        </div>
      )}
    </BlockCard>
  )
}
