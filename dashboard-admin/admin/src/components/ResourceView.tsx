import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
  RefreshCw,
  Search,
} from 'lucide-react'
import { useDebounce } from 'use-debounce'
import { useQueryClient } from '@tanstack/react-query'
import { resourceData, type ResourceConfig } from '@/constants'
import { StatusBadge } from '@/components/StatusBadge'
import { CrudDialog } from '@/components/CrudDialog'
import { Create } from '@/components/Create'
import { Edit } from '@/components/Edit'
import { Delete } from '@/components/Delete'
import { ImagePreviewModal } from '@/components/products/ImagePreviewModal'
import { asterLinenFront, ameliaAvatar } from '@/assets/img'
import { useI18n } from '@/assets/i18n'
import {
  categoryApi,
  extractErrorMessage,
  fetchPaginatedResourceRows,
  parseId,
  type ResourceQueryParams,
} from '@/api'
import {
  useCreateResourceRow,
  useDeleteResourceRow,
  usePaginatedResourceRows,
  useUpdateResourceRow,
} from '@/hooks/use-resource'
import { useExportDashboardReport } from '@/hooks/use-dashboard'
import { useDownloadOrderInvoice } from '@/hooks/useOrder'
import {
  ADMIN_LAST_PATH_KEY,
  buildAdminResourcePath,
  doesRowMatchSlug,
  normalizeAdminLabel,
  parseAdminPathname,
} from '@/utils'

export interface ResourceViewProps {
  resourceKey: string
  title?: string
  addLabelText?: string
  notify: (message: string) => void
  customData?: ResourceConfig
}

const PAGE_LIMIT = 10
const STATUS_COLUMNS = new Set(['status', 'is active', 'is default', 'is primary'])
const ORDERS_HIDDEN_TABLE_COLUMNS = new Set([
  'order #',
  'subtotal',
  'discount',
  'shipping fee',
])

export function ResourceView({
  resourceKey,
  title,
  addLabelText,
  notify,
  customData,
}: ResourceViewProps) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const data = customData || resourceData[resourceKey]
  const [tableRows, setTableRows] = useState<string[][]>(customData ? customData.rows : [])
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebounce(query, 200)
  const [filter, setFilter] = useState('All status')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categoryOptions, setCategoryOptions] = useState<Array<{ id: number; name: string }>>([])
  const [page, setPage] = useState<number>(() => {
    if (typeof window === 'undefined' || customData) return 1
    const parsed = parseAdminPathname(window.location.pathname)
    if (parsed.label !== normalizeAdminLabel(resourceKey)) return 1
    const p = Number(new URLSearchParams(window.location.search).get('page'))
    return Number.isFinite(p) && p >= 1 ? Math.floor(p) : 1
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dialog, setDialog] = useState<{
    mode: 'view' | 'edit' | 'add'
    row?: string[]
    rowIndex?: number
  } | null>(null)
  const [menu, setMenu] = useState<number | null>(null)
  const [previewImage, setPreviewImage] = useState<{ src: string; title?: string } | null>(null)
  const prevResourceKeyRef = useRef<string>(resourceKey)
  const resolvedSlugLookupRef = useRef<string>('')

  const effectiveQuery = query.trim() === '' ? '' : debouncedQuery.trim()

  const isServerPaginated =
    !customData && (resourceKey === 'Products' || resourceKey === 'Categories')

  const queryParams = useMemo<ResourceQueryParams>(
    () =>
      isServerPaginated
        ? {
            page,
            limit: PAGE_LIMIT,
            q: effectiveQuery || undefined,
            status: filter !== 'All status' ? filter : undefined,
            categoryId:
              resourceKey === 'Products' && categoryFilter ? categoryFilter : undefined,
          }
        : { limit: PAGE_LIMIT },
    [isServerPaginated, page, effectiveQuery, filter, resourceKey, categoryFilter],
  )

  const {
    data: fetchedResult,
    isLoading: loading,
    isFetching,
  } = usePaginatedResourceRows(customData ? '' : resourceKey, queryParams)

  const { mutateAsync: createRowMutate } = useCreateResourceRow(resourceKey)
  const { mutateAsync: updateRowMutate } = useUpdateResourceRow(resourceKey)
  const { mutateAsync: deleteRowMutate } = useDeleteResourceRow(resourceKey)
  const { mutateAsync: exportReportMutate } = useExportDashboardReport()
  const { mutateAsync: downloadInvoiceMutate } = useDownloadOrderInvoice()

  const openDialogWithUrl = useCallback(
    (
      nextDialog: {
        mode: 'view' | 'edit' | 'add'
        row?: string[]
        rowIndex?: number
      } | null,
      replaceHistory = false,
    ) => {
      setDialog(nextDialog)
      if (typeof window === 'undefined' || customData) return
      const currentParsed = parseAdminPathname(window.location.pathname)
      if (currentParsed.label !== normalizeAdminLabel(resourceKey)) return
      const targetPath = buildAdminResourcePath(
        resourceKey,
        nextDialog ? nextDialog.mode : null,
        data?.columns,
        nextDialog?.row,
      )
      const targetFullUrl = `${targetPath}${window.location.search}`
      try {
        window.sessionStorage.setItem(ADMIN_LAST_PATH_KEY, targetFullUrl)
      } catch {
        // ignore storage errors
      }
      if (`${window.location.pathname}${window.location.search}` !== targetFullUrl) {
        if (replaceHistory) {
          window.history.replaceState(
            { fromAdminApp: true, page: resourceKey },
            '',
            targetFullUrl,
          )
        } else {
          window.history.pushState(
            { fromAdminApp: true, page: resourceKey },
            '',
            targetFullUrl,
          )
        }
      }
    },
    [customData, data?.columns, resourceKey],
  )

  useEffect(() => {
    if (customData) {
      setTableRows(customData.rows)
      return
    }
    if (prevResourceKeyRef.current === resourceKey) {
      return
    }
    prevResourceKeyRef.current = resourceKey
    resolvedSlugLookupRef.current = ''
    setTableRows([])
    setQuery('')
    setFilter('All status')
    setCategoryFilter('')
    setPage(1)
    setIsRefreshing(false)
    setDialog(null)
    setMenu(null)
    setPreviewImage(null)
  }, [resourceKey, customData])

  useEffect(() => {
    if (typeof window === 'undefined' || customData) return
    const parsed = parseAdminPathname(window.location.pathname)
    if (parsed.label !== normalizeAdminLabel(resourceKey)) return
    const params = new URLSearchParams(window.location.search)
    if (page > 1) {
      params.set('page', String(page))
    } else {
      params.delete('page')
    }
    const nextSearch = params.toString() ? `?${params.toString()}` : ''
    const nextFullUrl = `${window.location.pathname}${nextSearch}`
    try {
      window.sessionStorage.setItem(ADMIN_LAST_PATH_KEY, nextFullUrl)
    } catch {
      // ignore storage errors
    }
    if (`${window.location.pathname}${window.location.search}` !== nextFullUrl) {
      window.history.replaceState(
        { fromAdminApp: true, page: resourceKey },
        '',
        nextFullUrl,
      )
    }
  }, [customData, page, resourceKey])

  useEffect(() => {
    if (typeof window === 'undefined' || customData || !data) return

    const syncDialogFromUrl = () => {
      const parsed = parseAdminPathname(window.location.pathname)
      if (parsed.label !== normalizeAdminLabel(resourceKey)) return

      const urlPage = Number(new URLSearchParams(window.location.search).get('page'))
      const normalizedUrlPage =
        Number.isFinite(urlPage) && urlPage >= 1 ? Math.floor(urlPage) : 1
      setPage((prev) => (prev === normalizedUrlPage ? prev : normalizedUrlPage))

      if (!parsed.action) {
        resolvedSlugLookupRef.current = ''
        setDialog(null)
        return
      }
      if (parsed.action === 'add') {
        setDialog({ mode: 'add' })
        return
      }
      if (parsed.itemSlug && tableRows.length > 0) {
        const matchedIdx = tableRows.findIndex((r) =>
          doesRowMatchSlug(data.columns, r, parsed.itemSlug),
        )
        if (matchedIdx !== -1) {
          setDialog({
            mode: parsed.action === 'edit' ? 'edit' : 'view',
            row: tableRows[matchedIdx],
            rowIndex: matchedIdx,
          })
          return
        }
        const lookupKey = `${resourceKey}:${parsed.itemSlug}`
        if (isServerPaginated && !loading && !isFetching && resolvedSlugLookupRef.current !== lookupKey) {
          resolvedSlugLookupRef.current = lookupKey
          void fetchPaginatedResourceRows(resourceKey, { page: 1, limit: 200 })
            .then((allResult) => {
              const allRows = allResult?.rows || []
              const found = allRows.find((r) =>
                doesRowMatchSlug(data.columns, r, parsed.itemSlug),
              )
              if (found) {
                setDialog({
                  mode: parsed.action === 'edit' ? 'edit' : 'view',
                  row: found,
                })
              }
            })
            .catch(() => {
              // ignore fallback lookup error
            })
        }
      }
    }

    syncDialogFromUrl()
    window.addEventListener('popstate', syncDialogFromUrl)
    window.addEventListener('commerceos-route-change', syncDialogFromUrl)
    return () => {
      window.removeEventListener('popstate', syncDialogFromUrl)
      window.removeEventListener('commerceos-route-change', syncDialogFromUrl)
    }
  }, [customData, data, isFetching, isServerPaginated, loading, resourceKey, tableRows])

  useEffect(() => {
    if (resourceKey !== 'Products') {
      setCategoryOptions([])
      return
    }
    let cancelled = false
    categoryApi
      .list({ limit: 100 })
      .then((res) => {
        if (!cancelled) {
          setCategoryOptions(
            (res.data || []).map((c: { id: number; name: string }) => ({
              id: Number(c.id),
              name: String(c.name || ''),
            })),
          )
        }
      })
      .catch(() => {
        if (!cancelled) setCategoryOptions([])
      })
    return () => {
      cancelled = true
    }
  }, [resourceKey])

  useEffect(() => {
    if (customData) {
      setTableRows(customData.rows)
      return
    }
    if (fetchedResult?.rows) {
      setTableRows(fetchedResult.rows)
    }
  }, [customData, fetchedResult])

  const handleRefresh = async () => {
    if (isRefreshing) return
    setMenu(null)

    if (customData) {
      setIsRefreshing(true)
      await new Promise((resolve) => window.setTimeout(resolve, 250))
      setQuery('')
      setFilter('All status')
      setCategoryFilter('')
      setPage(1)
      setTableRows(customData.rows)
      setIsRefreshing(false)
      notify(`Refreshed ${(title || resourceKey).toLowerCase()} (${customData.rows.length} records)`)
      return
    }

    setIsRefreshing(true)
    try {
      queryClient.removeQueries({ queryKey: ['resource', resourceKey] })
      const freshParams: ResourceQueryParams = isServerPaginated
        ? { page: 1, limit: PAGE_LIMIT }
        : { limit: PAGE_LIMIT }

      const [nextResult, freshCategories] = await Promise.all([
        fetchPaginatedResourceRows(resourceKey, freshParams),
        resourceKey === 'Products'
          ? categoryApi.list({ limit: 100 }).catch(() => null)
          : Promise.resolve(null),
        new Promise((resolve) => window.setTimeout(resolve, 300)),
      ])

      setQuery('')
      setFilter('All status')
      setCategoryFilter('')
      setPage(1)

      if (resourceKey === 'Products' && freshCategories?.data) {
        setCategoryOptions(
          freshCategories.data.map((c: { id: number; name: string }) => ({
            id: Number(c.id),
            name: String(c.name || ''),
          })),
        )
      }

      if (nextResult?.rows) {
        queryClient.setQueryData(['resource', resourceKey, freshParams], nextResult)
        setTableRows(nextResult.rows)
        const totalCount = nextResult.pagination?.total ?? nextResult.rows.length
        notify(`Refreshed ${(title || resourceKey).toLowerCase()} (${totalCount} records)`)
      } else {
        notify(`Failed to refresh ${(title || resourceKey).toLowerCase()} from API`)
      }
    } catch (err) {
      notify(extractErrorMessage(err, `Failed to refresh ${(title || resourceKey).toLowerCase()} from API`))
    } finally {
      setIsRefreshing(false)
    }
  }

  const statusColIndex = useMemo(() => {
    if (!data) return -1
    return data.columns.findIndex((col) => STATUS_COLUMNS.has(col.toLowerCase()))
  }, [data])

  const statusOptions = useMemo(() => {
    if (statusColIndex === -1) return []
    if (isServerPaginated) return ['Active', 'Inactive']
    return [...new Set(tableRows.map((row) => row[statusColIndex]).filter(Boolean))]
  }, [isServerPaginated, tableRows, statusColIndex])

  const filteredClientRows = useMemo(() => {
    if (!data) return []
    if (isServerPaginated) return tableRows
    return tableRows
      .filter((row) => row.join(' ').toLowerCase().includes(effectiveQuery.toLowerCase()))
      .filter((row) => {
        if (filter === 'All status' || statusColIndex === -1) return true
        return row[statusColIndex] === filter
      })
  }, [data, isServerPaginated, tableRows, effectiveQuery, filter, statusColIndex])

  const totalRecords = isServerPaginated
    ? (fetchedResult?.pagination?.total ?? tableRows.length)
    : filteredClientRows.length

  const totalPages = isServerPaginated
    ? Math.max(1, fetchedResult?.pagination?.total_pages ?? 1)
    : Math.max(1, Math.ceil(totalRecords / PAGE_LIMIT))

  useEffect(() => {
    if (!loading && !isFetching && !isRefreshing && page > totalPages) {
      setPage(totalPages)
    }
  }, [loading, isFetching, isRefreshing, page, totalPages])

  const currentPage = Math.min(Math.max(1, page), totalPages)
  const hasPrev = isServerPaginated
    ? (fetchedResult?.pagination?.has_prev ?? currentPage > 1)
    : currentPage > 1
  const hasNext = isServerPaginated
    ? (fetchedResult?.pagination?.has_next ?? currentPage < totalPages)
    : currentPage < totalPages

  const rows = useMemo(() => {
    if (isServerPaginated) return tableRows
    const startIdx = (currentPage - 1) * PAGE_LIMIT
    return filteredClientRows.slice(startIdx, startIdx + PAGE_LIMIT)
  }, [isServerPaginated, tableRows, filteredClientRows, currentPage])

  const pageNumbers = useMemo(() => {
    const pages: number[] = []
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, start + 4)
    const adjustedStart = Math.max(1, end - 4)
    for (let p = adjustedStart; p <= end; p++) {
      pages.push(p)
    }
    return pages
  }, [currentPage, totalPages])

  if (!data) {
    return <div className="feature-view">Resource "{resourceKey}" not found</div>
  }

  const displayTitle = title || resourceKey
  const singularLabel =
    resourceKey === 'Roles & access'
      ? 'role'
      : resourceKey === 'Addresses'
        ? 'address'
        : resourceKey.endsWith('ies')
          ? `${resourceKey.slice(0, -3).toLowerCase()}y`
          : resourceKey.replace(/s$/i, '').toLowerCase()

  const addLabel =
    addLabelText ||
    (resourceKey === 'Orders' ? 'Create order' : `Add ${singularLabel}`)

  const exportRows = () => {
    const exportTarget = isServerPaginated ? rows : filteredClientRows
    const escapeCsvCell = (cell: string) => `"${String(cell ?? '').replace(/"/g, '""')}"`
    const csv =
      '\uFEFF' +
      [data.columns, ...exportTarget]
        .map((row) => row.map(escapeCsvCell).join(','))
        .join('\r\n')

    const fileName = `${(data.tableName || displayTitle).toLowerCase().replace(/\s+/g, '_')}_export.csv`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    navigator.clipboard?.writeText(csv)
    notify(`Exported ${fileName} (${exportTarget.length} records)`)
  }

  const handleExportExcelReport = async () => {
    try {
      await exportReportMutate(undefined)
      notify('Downloaded order report (.xlsx) from backend API')
    } catch (err) {
      notify(extractErrorMessage(err, 'Failed to export Excel report'))
    }
  }

  const handleDownloadInvoice = async (orderRow: string[]) => {
    const orderId = parseId(orderRow[0])
    if (!orderId) return
    try {
      await downloadInvoiceMutate(orderId)
      notify(`Downloaded invoice for ${orderRow[1] || orderRow[0]} (.docx)`)
    } catch (err) {
      notify(extractErrorMessage(err, 'Failed to download invoice'))
    }
  }

  const handleSaveDialog = async (values: string[]) => {
    if (!dialog) return
    try {
      if (dialog.mode === 'add') {
        await createRowMutate(values)
        notify(`${values[1] || values[0] || 'Record'} created on server`)
      } else {
        await updateRowMutate({ values, oldRow: dialog.row || [] })
        notify(`${values[1] || values[0] || 'Record'} updated on server`)
      }
      openDialogWithUrl(null, true)
    } catch (err) {
      const msg = extractErrorMessage(err)
      notify(`API error: ${msg}`)
    }
  }

  const handleDeleteRow = async (targetRow: string[]) => {
    try {
      await deleteRowMutate(targetRow)
      notify(`${targetRow[1] || targetRow[0] || 'Record'} deleted from server`)
    } catch (err) {
      notify(`API error: ${extractErrorMessage(err, 'Failed to delete record')}`)
    }
  }

  return (
    <div className="feature-view">
      <ImagePreviewModal
        previewImage={previewImage}
        onClose={() => setPreviewImage(null)}
      />
      {dialog && (
        <CrudDialog
          mode={dialog.mode}
          label={singularLabel}
          columns={data.columns}
          row={dialog.row}
          onClose={() => openDialogWithUrl(null)}
          onModeChange={(nextMode) =>
            openDialogWithUrl(dialog ? { ...dialog, mode: nextMode } : null, true)
          }
          onSave={(values) => {
            void handleSaveDialog(values)
          }}
          onDelete={() => {
            if (dialog.row) {
              void handleDeleteRow(dialog.row)
            }
            openDialogWithUrl(null, true)
          }}
        />
      )}
      <div className="feature-heading">
        <div>
          <h1>{t(displayTitle)}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="filter-button"
            onClick={() => void handleRefresh()}
            disabled={loading || isRefreshing}
            title="Refresh from backend API"
          >
            <RefreshCw
              className={isRefreshing || isFetching ? 'refresh-icon-spin' : undefined}
              style={{ width: 14, height: 14 }}
            />
            {isRefreshing ? 'Refreshing...' : loading ? 'Loading...' : 'Refresh'}
          </button>
          <Create label={addLabel} onClick={() => openDialogWithUrl({ mode: 'add' })} />
        </div>
      </div>
      <article className="panel resource-panel">
        <div className="resource-toolbar">
          <div className="search-box">
            <Search />
            <input
              aria-label={`${t('Search')} ${t(displayTitle)}`}
              placeholder={`${t('Search')} ${t(displayTitle).toLowerCase()}...`}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
            />
          </div>
          {resourceKey === 'Products' && (
            <select
              className="filter-button"
              aria-label="Filter category"
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value)
                setPage(1)
              }}
            >
              <option value="">{t('All categories')}</option>
              {categoryOptions.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
          {statusColIndex !== -1 && (
            <select
              className="filter-button"
              aria-label="Filter status"
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value)
                setPage(1)
              }}
            >
              <option value="All status">{t('All status')}</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {t(status)}
                </option>
              ))}
            </select>
          )}
          {resourceKey === 'Orders' && (
            <button className="filter-button" onClick={() => void handleExportExcelReport()}>
              <FileSpreadsheet /> Export Report (.xlsx)
            </button>
          )}
          <button className="filter-button" onClick={exportRows}>
            <Download /> {t('Export')}
          </button>
        </div>
        <div className={`table-wrap${isRefreshing ? ' table-wrap-refreshing' : ''}`}>
          <table>
            <thead>
              <tr>
                {data.columns.map((column) => {
                  if (
                    resourceKey === 'Orders' &&
                    ORDERS_HIDDEN_TABLE_COLUMNS.has(column.toLowerCase())
                  ) {
                    return null
                  }
                  return <th key={column}>{t(column)}</th>
                })}
                <th>{t('Action')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row[0]}-${index}`}>
                  {row.map((cell, cellIndex) => {
                    const colLower = data.columns[cellIndex]?.toLowerCase() ?? ''
                    if (resourceKey === 'Orders' && ORDERS_HIDDEN_TABLE_COLUMNS.has(colLower)) {
                      return null
                    }
                    const isImageCol =
                      colLower === 'image url' || colLower === 'image' || colLower === 'avatar'
                    const isAvatar = colLower === 'avatar'
                    const fallbackImg = isAvatar ? ameliaAvatar : asterLinenFront

                    return (
                      <td key={`${cell}-${cellIndex}`}>
                        {cellIndex === 0 ? (
                          <strong className="order-id">{cell}</strong>
                        ) : resourceKey === 'Orders' && cellIndex === 2 ? (
                          <div className="order-user-stack">
                            <strong>
                              {(cell || '').replace(/\s*\(#\d+\)$/, '').trim() || cell || '—'}
                            </strong>
                            <small>{(row[1] || row[0] || '').replace(/^#/, '')}</small>
                          </div>
                        ) : cellIndex === statusColIndex ? (
                          <StatusBadge status={cell} />
                        ) : isImageCol ? (
                          <img
                            src={cell || fallbackImg}
                            alt={row[1] || 'Preview'}
                            className="table-image-thumb"
                            onClick={() =>
                              setPreviewImage({
                                src: cell || fallbackImg,
                                title: row[1] || row[0] || t(displayTitle),
                              })
                            }
                            onError={(e) => {
                              e.currentTarget.onerror = null
                              e.currentTarget.src = fallbackImg
                            }}
                            style={{
                              width: isAvatar ? '38px' : '48px',
                              height: isAvatar ? '38px' : '48px',
                              borderRadius: isAvatar ? '50%' : '10px',
                              objectFit: 'cover',
                              border: '1px solid #dce6ec',
                              background: '#f4f8fa',
                              display: 'block',
                            }}
                          />
                        ) : colLower === 'shipping address' ? (
                          <span className="truncate-address-cell" title={cell}>
                            {cell}
                          </span>
                        ) : (
                          cell
                        )}
                      </td>
                    )
                  })}
                  <td className="row-actions">
                    <button
                      className="row-view"
                      aria-label={`View ${row[0]}`}
                      onClick={() => openDialogWithUrl({ mode: 'view', row, rowIndex: index })}
                    >
                      <Eye />
                    </button>
                    <div className="row-menu-wrap">
                      <button
                        className="row-menu"
                        aria-label={`More options for ${row[0]}`}
                        onClick={() => setMenu(menu === index ? null : index)}
                      >
                        <MoreHorizontal />
                      </button>
                      {menu === index && (
                        <div className="row-popover">
                          {resourceKey === 'Orders' && (
                            <button
                              type="button"
                              className="popover-item"
                              onClick={() => {
                                void handleDownloadInvoice(row)
                                setMenu(null)
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                width: '100%',
                                padding: '8px 12px',
                                border: 0,
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '12px',
                                textAlign: 'left',
                              }}
                            >
                              <FileText style={{ width: 14, height: 14 }} />
                              <span>Invoice (.docx)</span>
                            </button>
                          )}
                          <Edit
                            variant="menu"
                            onClick={() => {
                              openDialogWithUrl({ mode: 'edit', row, rowIndex: index })
                              setMenu(null)
                            }}
                          />
                          <Delete
                            variant="menu"
                            onClick={() => {
                              void handleDeleteRow(row)
                              setMenu(null)
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="empty-results">
            {loading || isRefreshing
              ? `Loading ${t(displayTitle).toLowerCase()} from API...`
              : totalRecords === 0 && !effectiveQuery && filter === 'All status' && !categoryFilter
                ? `No ${t(displayTitle).toLowerCase()} found in database.`
                : `No ${t(displayTitle).toLowerCase()} match your search.`}
          </div>
        )}
        <div className="table-footer">
          <span>
            {t('Showing')} {rows.length} {t('of')} {totalRecords} {t('records')}
          </span>
          <div>
            <button
              className="pagination-button"
              disabled={!hasPrev}
              onClick={() => {
                if (hasPrev) setPage(currentPage - 1)
              }}
              style={{ opacity: hasPrev ? 1 : 0.5, cursor: hasPrev ? 'pointer' : 'not-allowed' }}
            >
              {t('Previous')}
            </button>
            {pageNumbers.map((pageNum) => (
              <button
                key={pageNum}
                className={`pagination-button ${pageNum === currentPage ? 'active-page' : ''}`}
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}
            <button
              className="pagination-button"
              disabled={!hasNext}
              onClick={() => {
                if (hasNext) setPage(currentPage + 1)
              }}
              style={{ opacity: hasNext ? 1 : 0.5, cursor: hasNext ? 'pointer' : 'not-allowed' }}
            >
              {t('Next')}
            </button>
          </div>
        </div>
      </article>
    </div>
  )
}
