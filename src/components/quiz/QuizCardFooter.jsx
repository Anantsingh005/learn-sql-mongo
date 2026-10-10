function QuizCardFooter({ status, statusTone = 'text-muted', detail, children }) {
  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${statusTone}`}>{status}</p>
        {detail}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

export default QuizCardFooter
