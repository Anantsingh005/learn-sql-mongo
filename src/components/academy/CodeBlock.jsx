import BlockCard from './BlockCard.jsx'
import TableCard from './TableCard.jsx'
import CopyButton from './CopyButton.jsx'
import { CodeIcon } from './BlockIcons.jsx'
import { Badge, Caption, CodeSurface } from './BlockParts.jsx'

// A runnable example. The card shows the intro line first, then the SQL, then
// the table it is expected to return. A failing example (expectError) or a trap
// (tone 'bad') is tinted red and its explaining caption becomes the error
// message. The code itself is only displayed — it is verified at build time.

export default function CodeBlock({ code, caption, tone, expect, expectError }) {
  const failed = Boolean(expectError)
  const risky = tone === 'bad' && !failed
  const flagged = failed || risky

  const badge = failed
    ? { tone: 'danger', text: 'Refused' }
    : risky
      ? { tone: 'danger', text: 'Careful' }
      : expect
        ? { tone: 'leaf', text: 'Runs' }
        : null

  return (
    <BlockCard
      icon={<CodeIcon />}
      title="Example"
      tone={flagged ? 'danger' : 'plum'}
      meta={badge ? <Badge tone={badge.tone}>{badge.text}</Badge> : null}
      actions={<CopyButton text={code} />}
      bodyClassName="space-y-3 p-4 sm:p-5"
    >
      {caption && <Caption text={caption} tone={flagged ? 'danger' : 'plain'} />}
      {failed && !caption && (
        <p className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-[13px] leading-relaxed text-danger-700">
          This example is meant to fail — the engine refuses it before anything runs.
        </p>
      )}

      <CodeSurface code={code} tone={flagged ? 'danger' : 'plain'} />

      {expect && (
        <TableCard
          label={expect.label ?? 'Result'}
          columns={expect.columns}
          rows={expect.rows}
        />
      )}
    </BlockCard>
  )
}
