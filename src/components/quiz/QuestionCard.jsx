import HintReveal from './HintReveal.jsx'
import SchemaPanel from './SchemaPanel.jsx'

function Chip({ children, color }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${color}`}>
      {children}
    </span>
  )
}

function OptionButton({ label, text, selected, onSelect, disabled }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`group flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        selected
          ? 'border-indigo-500 bg-indigo-500/15 text-indigo-100'
          : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${
          selected ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 group-hover:bg-slate-600'
        }`}
      >
        {label}
      </span>
      <code className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed">{text}</code>
    </button>
  )
}

function QuestTypeIndicator({ type, difficulty, topic }) {
  const typeColor =
    type === 'mc' ? 'bg-sky-500/15 text-sky-300' : type === 'write' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
  const diffColor =
    difficulty === 'easy' ? 'bg-slate-700 text-slate-300' : difficulty === 'medium' ? 'bg-indigo-500/15 text-indigo-300' : 'bg-rose-500/15 text-rose-300'
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <Chip color={typeColor}>{type === 'mc' ? 'Multiple choice' : type === 'write' ? 'Write query' : 'Fix bug'}</Chip>
      <Chip color={diffColor}>{difficulty}</Chip>
      <span className="text-slate-500">{topic}</span>
    </div>
  )
}

function MultipleChoiceView({ question, selectedIndex, onSelect, disabled }) {
  const labels = ['A', 'B', 'C', 'D']
  return (
    <div className="mt-4 flex flex-col gap-2">
      {question.options.map((opt, i) => (
        <OptionButton
          key={i}
          label={labels[i]}
          text={opt}
          selected={i === selectedIndex}
          onSelect={() => onSelect(i)}
          disabled={disabled}
        />
      ))}
    </div>
  )
}

function BuggyQueryView({ question }) {
  return (
    <div className="mt-4">
      <div className="mb-1 text-xs font-medium text-slate-400">Buggy query — find the bug:</div>
      <pre className="overflow-x-auto rounded-lg border border-amber-600/40 bg-amber-500/5 px-3 py-2.5 font-mono text-[13px] leading-relaxed text-amber-200">
        {question.buggyQuery}
      </pre>
    </div>
  )
}

function QuestionCard({ question, selectedIndex, onSelect, disabled, children }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <QuestTypeIndicator type={question.type} difficulty={question.difficulty} topic={question.topic} />
      <h2 className="mt-3 whitespace-pre-wrap font-mono text-lg font-medium leading-relaxed text-slate-100">
        {question.question}
      </h2>

      {question.type === 'mc' && (
        <MultipleChoiceView
          question={question}
          selectedIndex={selectedIndex}
          onSelect={onSelect}
          disabled={disabled}
        />
      )}

      {question.type === 'bug' && <BuggyQueryView question={question} />}

      {(question.type === 'write' || question.type === 'bug') && (
        <>
          <SchemaPanel schema={question.schema} />
          <HintReveal hint={question.hint} />
        </>
      )}

      {children}
    </article>
  )
}

export default QuestionCard