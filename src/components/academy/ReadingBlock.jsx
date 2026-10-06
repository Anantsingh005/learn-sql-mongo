import Prose from './Prose.jsx'
import CodeBlock from './CodeBlock.jsx'
import DmlBlock from './DmlBlock.jsx'
import ResultBlock from './ResultBlock.jsx'
import FlowDiagram from './FlowDiagram.jsx'
import SyntaxMap from './SyntaxMap.jsx'
import JoinMap from './JoinMap.jsx'
import Note from './Note.jsx'

export default function ReadingBlock({ block, accent, ink = accent }) {
  switch (block.type) {
    case 'theory':
      return (
        <div className="space-y-3">
          {block.body.map((para, i) => (
            <Prose
              key={i}
              text={para}
              className="text-[15px] leading-[1.75] text-body first:text-[16px]"
            />
          ))}
        </div>
      )

    case 'code':
      return (
        <CodeBlock
          code={block.code}
          caption={block.caption}
          tone={block.tone}
          expect={block.expect}
          expectError={block.expectError}
        />
      )

    case 'dml':
      return (
        <DmlBlock
          code={block.code}
          caption={block.caption}
          tone={block.tone}
          expectError={block.expectError}
          after={block.after}
        />
      )

    case 'result':
      return (
        <ResultBlock
          label={block.label}
          caption={block.caption}
          columns={block.columns}
          rows={block.rows}
        />
      )

    case 'flow':
      return <FlowDiagram steps={block.steps} caption={block.caption} accent={accent} ink={ink} />

    case 'visual':
      if (block.name === 'join-types') return <JoinMap accent={accent} ink={ink} />
      return <SyntaxMap highlight={block.highlight} accent={accent} ink={ink} />

    case 'note':
      return <Note tone={block.tone} title={block.title} body={block.body} />

    default:
      return null
  }
}
