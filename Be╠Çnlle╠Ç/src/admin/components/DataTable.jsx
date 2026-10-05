import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react'
import { Card, EmptyState, ErrorState, Skeleton } from './ui'
import { cn } from '../lib/utils'

/**
 * Reusable admin table.
 * columns: [{ key, header, cell?(row), sortValue?(row), sortable?, align?, className?, hideOn? }]
 * selectable + selected/onSelect enable bulk actions; bulkBar renders above the table when rows are selected.
 */
export function DataTable({
  columns, rows, loading, error, onRetry, onRowClick, rowKey = (r) => r.id,
  pageSize = 10, empty, selectable, selected = [], onSelect, bulkBar, toolbar, initialSort,
}) {
  const [sort, setSort] = useState(initialSort || null)
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => {
    if (!rows || !sort) return rows || []
    const col = columns.find((c) => c.key === sort.key)
    const get = col?.sortValue || ((r) => r[sort.key])
    return [...rows].sort((a, b) => {
      const x = get(a), y = get(b)
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''))
      return sort.dir === 'asc' ? r : -r
    })
  }, [rows, sort, columns])

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  useEffect(() => { if (page > pages) setPage(1) }, [pages, page])
  const visible = sorted.slice((page - 1) * pageSize, page * pageSize)

  const toggleSort = (key) =>
    setSort((s) => (s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' }))

  const allOnPage = visible.length > 0 && visible.every((r) => selected.includes(rowKey(r)))
  const toggleAll = () => {
    const ids = visible.map(rowKey)
    onSelect(allOnPage ? selected.filter((id) => !ids.includes(id)) : [...new Set([...selected, ...ids])])
  }
  const toggleOne = (id) => onSelect(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  const hide = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' }

  return (
    <Card className="overflow-hidden">
      {toolbar && <div className="flex flex-col gap-3 border-b border-neutral-200 p-4 sm:flex-row sm:items-center dark:border-neutral-800">{toolbar}</div>}
      {selectable && selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm dark:border-neutral-800 dark:bg-neutral-800/50">
          <span className="font-medium">{selected.length} selected</span>
          <div className="flex flex-wrap gap-2">{bulkBar}</div>
          <button className="ml-auto text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white" onClick={() => onSelect([])}>Clear</button>
        </div>
      )}

      {error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-neutral-50 text-left text-xs uppercase tracking-wider text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                {selectable && (
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" aria-label="Select all on page" checked={allOnPage} onChange={toggleAll} className="h-4 w-4 accent-neutral-900 dark:accent-white" />
                  </th>
                )}
                {columns.map((c) => (
                  <th key={c.key} scope="col" className={cn('whitespace-nowrap px-4 py-3 font-medium', c.align === 'right' && 'text-right', hide[c.hideOn], c.className)}>
                    {c.sortable ? (
                      <button onClick={() => toggleSort(c.key)} className={cn('inline-flex items-center gap-1 uppercase hover:text-neutral-900 dark:hover:text-white', c.align === 'right' && 'flex-row-reverse')}>
                        {c.header}
                        {sort?.key === c.key ? (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
                      </button>
                    ) : c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {loading && !rows
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {selectable && <td className="px-4 py-4"><Skeleton className="h-4 w-4" /></td>}
                      {columns.map((c) => (
                        <td key={c.key} className={cn('px-4 py-4', hide[c.hideOn])}><Skeleton className="h-4 w-full max-w-32" /></td>
                      ))}
                    </tr>
                  ))
                : visible.map((row) => {
                    const id = rowKey(row)
                    const isSel = selected.includes(id)
                    return (
                      <tr
                        key={id}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        className={cn(
                          'transition-colors',
                          onRowClick && 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                          isSel && 'bg-neutral-50 dark:bg-neutral-800/50',
                        )}
                      >
                        {selectable && (
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" aria-label="Select row" checked={isSel} onChange={() => toggleOne(id)} className="h-4 w-4 accent-neutral-900 dark:accent-white" />
                          </td>
                        )}
                        {columns.map((c) => (
                          <td key={c.key} className={cn('px-4 py-3', c.align === 'right' && 'text-right tabular-nums', hide[c.hideOn], c.className)}>
                            {c.cell ? c.cell(row) : row[c.key]}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
            </tbody>
          </table>
          {!loading && rows && rows.length === 0 && (empty || <EmptyState title="Nothing here yet" />)}
        </div>
      )}

      {rows && sorted.length > pageSize && (
        <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800">
          <p className="text-neutral-500 dark:text-neutral-400">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <button aria-label="Previous page" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-neutral-200 disabled:opacity-40 dark:border-neutral-700">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 tabular-nums">{page} / {pages}</span>
            <button aria-label="Next page" disabled={page === pages} onClick={() => setPage((p) => p + 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-neutral-200 disabled:opacity-40 dark:border-neutral-700">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
