import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchTableRows, createRow, updateRow, deleteRow } from '../../lib/admin.js'

const PAGE_SIZE = 25

function coerce(col, raw) {
  if (col.type === 'number') {
    if (raw === '' || raw === undefined || raw === null) return null
    const n = Number(raw)
    if (!Number.isFinite(n)) throw new Error(`${col.label} must be a number`)
    return n
  }
  if (col.type === 'json') {
    if (raw === '') return null
    return JSON.parse(raw)
  }
  return raw
}

function displayValue(col, value) {
  if (value === null || value === undefined) return '—'
  if (col.type === 'datetime') return new Date(value).toLocaleString()
  if (col.type === 'json') return JSON.stringify(value) ?? '—'
  if (col.type === 'uuid') return value
  return String(value)
}

function inputFor(col, value, onChange) {
  const base = 'w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none'
  if (col.type === 'json') {
    return (
      <textarea
        rows={5}
        className={base + ' font-mono text-xs'}
        value={value}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }
  return (
    <input
      type={col.type === 'number' ? 'number' : 'text'}
      className={base}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export default function AdminTable({ meta }) {
  const { columns, rowKey, label, canInsert } = meta

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [opError, setOpError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [editingKey, setEditingKey] = useState(null)
  const [draft, setDraft] = useState({})
  const [inserting, setInserting] = useState(false)
  const [insertDraft, setInsertDraft] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setOpError(null)
    const res = await fetchTableRows(meta)
    setRows(res.data ?? [])
    setError(res.error)
    setLoading(false)
  }, [meta])

  useEffect(() => {
    load()
  }, [load])

  const editableColumns = columns.filter((c) => c.editable)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      columns.some((c) => String(r[c.key] ?? '').toLowerCase().includes(q))
    )
  }, [rows, query, columns])

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const pageRows = visible.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const startEdit = (row) => {
    const d = {}
    editableColumns.forEach((c) => {
      d[c.key] = row[c.key] === null || row[c.key] === undefined ? '' : String(row[c.key])
    })
    setDraft(d)
    setEditingKey(row[rowKey])
    setOpError(null)
  }

  const cancelEdit = () => {
    setEditingKey(null)
    setDraft({})
  }

  const saveEdit = async () => {
    setSaving(true)
    setOpError(null)
    try {
      const patch = {}
      editableColumns.forEach((c) => {
        patch[c.key] = coerce(c, draft[c.key])
      })
      const res = await updateRow(meta.table, { [rowKey]: editingKey }, patch)
      if (res.error) throw res.error
      cancelEdit()
      await load()
    } catch (err) {
      setOpError(err.message ?? String(err))
    } finally {
      setSaving(false)
    }
  }

  const removeRow = async (row) => {
    if (!window.confirm(`Delete this ${label} row?`)) return
    setSaving(true)
    setOpError(null)
    try {
      const res = await deleteRow(meta.table, { [rowKey]: row[rowKey] })
      if (res.error) throw res.error
      if (page !== 0 && pageRows.length === 1) setPage(Math.max(0, page - 1))
      await load()
    } catch (err) {
      setOpError(err.message ?? String(err))
    } finally {
      setSaving(false)
    }
  }

  const startInsert = () => {
    const d = {}
    editableColumns.forEach((c) => {
      d[c.key] = ''
    })
    setInsertDraft(d)
    setInserting(true)
    setOpError(null)
  }

  const cancelInsert = () => {
    setInserting(false)
    setInsertDraft({})
  }

  const saveInsert = async () => {
    setSaving(true)
    setOpError(null)
    try {
      const values = {}
      editableColumns.forEach((c) => {
        values[c.key] = coerce(c, insertDraft[c.key])
      })
      const res = await createRow(meta.table, values)
      if (res.error) throw res.error
      cancelInsert()
      await load()
    } catch (err) {
      setOpError(err.message ?? String(err))
    } finally {
      setSaving(false)
    }
  }

  const renderRow = (row) => {
    const isEditing = !inserting && editingKey === row[rowKey]
    return (
      <tr key={row[rowKey]} className="border-t border-slate-800">
        {columns.map((c) => (
          <td key={c.key} className="px-3 py-2 align-top text-xs text-slate-300">
            {isEditing && c.editable ? inputFor(c, draft[c.key] ?? '', (v) => setDraft((d) => ({ ...d, [c.key]: v }))) : displayValue(c, row[c.key])}
          </td>
        ))}
        <td className="px-3 py-2 align-middle text-right">
          {isEditing ? (
            <div className="flex justify-end gap-1">
              <button type="button" onClick={saveEdit} disabled={saving} className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
                Save
              </button>
              <button type="button" onClick={cancelEdit} className="rounded bg-slate-700 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-600">
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex justify-end gap-1">
              <button type="button" onClick={() => startEdit(row)} disabled={saving} className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                Edit
              </button>
              <button type="button" onClick={() => removeRow(row)} disabled={saving} className="rounded bg-rose-700 px-2 py-1 text-xs font-medium text-white hover:bg-rose-600 disabled:opacity-50">
                Delete
              </button>
            </div>
          )}
        </td>
      </tr>
    )
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">
          {label}
          <span className="ml-2 font-normal text-slate-500">{rows.length} row{rows.length === 1 ? '' : 's'}</span>
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
            placeholder={`Filter ${label.toLowerCase()}…`}
            className="w-52 rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
          {canInsert && !inserting && (
            <button type="button" onClick={startInsert} className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500">
              Add row
            </button>
          )}
        </div>
      </div>

      {opError && (
        <div className="border-b border-rose-900 bg-rose-950/40 px-4 py-2 text-xs text-rose-300">
          {opError}
        </div>
      )}
      {error && (
        <div className="border-b border-rose-900 bg-rose-950/40 px-4 py-2 text-xs text-rose-300">
          Failed to load rows: {error.message ?? String(error)}
        </div>
      )}

      {loading ? (
        <p className="p-6 text-center text-sm text-slate-500">Loading…</p>
      ) : visible.length === 0 && !inserting ? (
        <p className="p-6 text-center text-sm text-slate-500">
          {query ? 'No matching rows.' : 'No rows yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="bg-slate-800/60 text-xs text-slate-400">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-3 py-2 font-medium">
                    {c.label}
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inserting && (
                <tr className="border-t border-indigo-900 bg-indigo-950/30">
                  {columns.map((c) => (
                    <td key={c.key} className="px-3 py-2 align-top">
                      {c.editable ? inputFor(c, insertDraft[c.key] ?? '', (v) => setInsertDraft((d) => ({ ...d, [c.key]: v }))) : <span className="text-xs text-slate-600">{c.label} (auto)</span>}
                    </td>
                  ))}
                  <td className="px-3 py-2 align-middle">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={saveInsert} disabled={saving} className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
                        Save
                      </button>
                      <button type="button" onClick={cancelInsert} className="rounded bg-slate-700 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-600">
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {pageRows.map(renderRow)}
            </tbody>
          </table>
        </div>
      )}

      {!loading && pageCount > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2 text-xs text-slate-400">
          <span>
            Page {page + 1} of {pageCount}
          </span>
          <div className="flex gap-1">
            <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="rounded bg-slate-800 px-2 py-1 disabled:opacity-40">
              Prev
            </button>
            <button type="button" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1} className="rounded bg-slate-800 px-2 py-1 disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}