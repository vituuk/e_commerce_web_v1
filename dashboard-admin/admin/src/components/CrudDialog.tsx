import { type FormEvent, useEffect, useState } from 'react'
import {
  Calendar,
  Check,
  Clock,
  Copy,
  Tag,
  Upload,
} from 'lucide-react'
import { categoryApi, productApi } from '@/api/client'
import { asterLinenFront, ameliaAvatar, editIcon } from '@/assets/img'
import { useI18n } from '@/assets/i18n'
import { generateLiveSlug } from '@/utils/slug'
import { Cancel } from '@/components/Cancel'
import { Close } from '@/components/Close'
import { Delete } from '@/components/Delete'
import { Edit } from '@/components/Edit'
import { Create } from '@/components/Create'

export interface CrudDialogProps {
  mode: 'view' | 'edit' | 'add'
  label: string
  columns: string[]
  row?: string[]
  onClose: () => void
  onSave: (values: string[]) => void
  onDelete?: () => void
  onModeChange?: (mode: 'view' | 'edit' | 'add') => void
}

const READONLY_COLUMNS = new Set(['id', 'created at', 'updated at', 'order date'])

export function isFieldRequired(
  label: string,
  column: string,
  mode: 'view' | 'edit' | 'add',
): boolean {
  if (mode === 'view') return false
  const lbl = label.trim().toLowerCase()
  const col = column.trim().toLowerCase()
  if (READONLY_COLUMNS.has(col) || col === 'paid at') return false

  switch (lbl) {
    case 'category':
      return col === 'category name' || col === 'slug' || col === 'status'
    case 'product':
      return (
        col === 'product name' ||
        col === 'slug' ||
        col === 'base price' ||
        col === 'price' ||
        col === 'stock qty' ||
        col === 'status'
      )
    case 'product variant':
      return col === 'sku' || col === 'product' || col === 'stock qty' || col === 'status'
    case 'product image':
      return col === 'product' || col === 'image url' || col === 'is primary'
    case 'order':
      if (col === 'order #') return mode === 'edit'
      return (
        col === 'user' ||
        col === 'shipping address' ||
        col === 'subtotal' ||
        col === 'total' ||
        col === 'status'
      )
    case 'order item':
      return (
        col === 'order #' ||
        col === 'variant (sku)' ||
        col === 'product name' ||
        col === 'unit price' ||
        col === 'qty' ||
        col === 'amount'
      )
    case 'user':
    case 'customer':
      if (col === 'password hash') return mode === 'add'
      return col === 'email' || col === 'status'
    case 'user profile':
      return col === 'user'
    case 'role':
    case 'roles & access':
      return col === 'role name' || col === 'code' || col === 'status'
    case 'user role':
      return col === 'user' || col === 'role'
    case 'address':
      return (
        col === 'user' ||
        col === 'recipient name' ||
        col === 'phone' ||
        col === 'address line' ||
        col === 'city' ||
        col === 'is default'
      )
    case 'payment':
      return col === 'order #' || col === 'method' || col === 'amount' || col === 'status'
    case 'review':
      return col === 'user' || col === 'product' || col === 'rating'
    case 'cart':
      return col === 'user'
    case 'cart item':
      return col === 'cart id' || col === 'variant (sku)' || col === 'qty'
    case '2fa security':
      return col === 'method' || col === 'email' || col === 'status'
    default:
      return false
  }
}

function getStatusOptions(label: string): string[] {
  const lower = label.trim().toLowerCase()
  if (lower === 'order') {
    return ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled']
  }
  if (lower === 'payment') {
    return ['Pending', 'Succeeded', 'Failed']
  }
  return ['Active', 'Inactive']
}

function buildInitialValues(
  columns: string[],
  label: string,
  row?: string[],
  mode: 'view' | 'edit' | 'add' = 'add',
): string[] {
  if (row) {
    if (mode !== 'edit') return row
    return columns.map((col, idx) => {
      const cell = row[idx] ?? ''
      if (cell === '—' && isFieldRequired(label, col, 'edit')) {
        return ''
      }
      return cell
    })
  }
  const statusOptions = getStatusOptions(label)
  return columns.map((col) => {
    const cl = col.toLowerCase()
    if (cl === 'status') return statusOptions[0]
    if (cl === 'is primary') return 'Yes'
    if (cl === 'is default') return 'No'
    return ''
  })
}

export function CrudDialog({
  mode: initialMode,
  label,
  columns,
  row,
  onClose,
  onSave,
  onDelete,
  onModeChange,
}: CrudDialogProps) {
  const { t } = useI18n()
  const [startedInView] = useState(initialMode === 'view')
  const [currentMode, setCurrentMode] = useState<'view' | 'edit' | 'add'>(initialMode)
  const [values, setValues] = useState<string[]>(() =>
    buildInitialValues(columns, label, row, initialMode),
  )
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [copied, setCopied] = useState(false)
  const [previewImage, setPreviewImage] = useState<{ src: string; title?: string } | null>(null)
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([])
  const [products, setProducts] = useState<Array<{ id: number; name: string }>>([])

  const hasCategoryColumn = columns.some((col) => col.toLowerCase() === 'category')
  const hasProductColumn = columns.some((col) => col.toLowerCase() === 'product')

  useEffect(() => {
    setValues(buildInitialValues(columns, label, row, currentMode))
    setSlugManuallyEdited(currentMode === 'edit' && Boolean(row))
  }, [row, columns, label, currentMode])

  useEffect(() => {
    if (!hasCategoryColumn) return
    let cancelled = false
    categoryApi
      .list({ limit: 100 })
      .then((res) => {
        if (!cancelled) {
          setCategories(
            (res.data || []).map((c: { id: number; name: string }) => ({
              id: Number(c.id),
              name: String(c.name || ''),
            })),
          )
        }
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })
    return () => {
      cancelled = true
    }
  }, [hasCategoryColumn])

  useEffect(() => {
    if (!hasProductColumn) return
    let cancelled = false
    productApi
      .list({ limit: 100 })
      .then((res) => {
        if (!cancelled) {
          setProducts(
            (res.data || []).map((p: { id: number; name: string }) => ({
              id: Number(p.id),
              name: String(p.name || ''),
            })),
          )
        }
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })
    return () => {
      cancelled = true
    }
  }, [hasProductColumn])

  const firstEditableIndex = columns.findIndex(
    (col) => !READONLY_COLUMNS.has(col.toLowerCase()),
  )

  const updateValue = (index: number, value: string) =>
    setValues((current) => {
      const next = current.map((item, itemIndex) => (itemIndex === index ? value : item))
      const colLower = (columns[index] ?? '').toLowerCase().trim()
      const slugIdx = columns.findIndex((c) => c.toLowerCase().trim() === 'slug')

      // Auto-generate slug when Product name or Category name is typed
      if (slugIdx >= 0) {
        if (index === slugIdx) {
          if (!value.trim()) {
            setSlugManuallyEdited(false)
          } else {
            setSlugManuallyEdited(true)
          }
        } else {
          const isNameCol =
            colLower === 'product name' ||
            colLower === 'category name' ||
            colLower === 'name' ||
            (label.toLowerCase() === 'product' && colLower.includes('name')) ||
            (label.toLowerCase() === 'category' && colLower.includes('name'))

          if (isNameCol && (!slugManuallyEdited || currentMode === 'add')) {
            next[slugIdx] = generateLiveSlug(value)
          }
        }
      }

      const subIdx = columns.findIndex((c) => c.toLowerCase() === 'subtotal')
      const discIdx = columns.findIndex((c) => c.toLowerCase() === 'discount')
      const shipIdx = columns.findIndex((c) => c.toLowerCase() === 'shipping fee')
      const totalIdx = columns.findIndex((c) => c.toLowerCase() === 'total')
      if (
        subIdx >= 0 &&
        discIdx >= 0 &&
        shipIdx >= 0 &&
        totalIdx >= 0 &&
        (index === subIdx || index === discIdx || index === shipIdx)
      ) {
        const parseNum = (v: string) => {
          const n = parseFloat(String(v || '').replace(/[^0-9.-]/g, ''))
          return Number.isFinite(n) && n > 0 ? n : 0
        }
        const sub = parseNum(next[subIdx])
        const disc = parseNum(next[discIdx])
        const ship = parseNum(next[shipIdx])
        next[totalIdx] = `$${Math.max(0, sub - disc + ship).toFixed(2)}`
      }

      const unitIdx = columns.findIndex((c) => c.toLowerCase() === 'unit price')
      const qtyIdx = columns.findIndex((c) => c.toLowerCase() === 'qty')
      const amtIdx = columns.findIndex((c) => c.toLowerCase() === 'amount')
      if (unitIdx >= 0 && qtyIdx >= 0 && amtIdx >= 0 && (index === unitIdx || index === qtyIdx)) {
        const unit = parseFloat(String(next[unitIdx] || '').replace(/[^0-9.-]/g, ''))
        const qty = parseInt(String(next[qtyIdx] || '').replace(/[^0-9-]/g, ''), 10)
        if (Number.isFinite(unit) && unit >= 0 && Number.isFinite(qty) && qty > 0) {
          next[amtIdx] = `$${(unit * qty).toFixed(2)}`
        }
      }
      return next
    })

  const handleImageUpload = (
    index: number,
    file?: File,
    inputEl?: HTMLInputElement | null,
  ) => {
    if (!file) return
    inputEl?.setCustomValidity('')
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateValue(index, reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const submitValues = [...values]
    const slugIdx = columns.findIndex((c) => c.toLowerCase().trim() === 'slug')
    const nameIdx = columns.findIndex((c) => {
      const cl = c.toLowerCase().trim()
      return cl === 'product name' || cl === 'category name' || cl === 'name'
    })

    if (slugIdx >= 0) {
      if (!submitValues[slugIdx]?.trim() && nameIdx >= 0 && submitValues[nameIdx]) {
        submitValues[slugIdx] = generateLiveSlug(submitValues[nameIdx]).replace(/-+$/, '')
      } else if (submitValues[slugIdx]) {
        submitValues[slugIdx] = submitValues[slugIdx].trim().replace(/-+$/, '')
      }
    }

    for (let i = 0; i < columns.length; i += 1) {
      const col = columns[i]
      const colLower = col.toLowerCase()
      if (currentMode === 'add' && READONLY_COLUMNS.has(colLower)) continue
      if (!isFieldRequired(label, col, currentMode)) continue

      const val = (submitValues[i] ?? '').trim()
      if (!val || val === '—') {
        const control = event.currentTarget.querySelector<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >(`[data-col-index="${i}"]`)
        if (control) {
          control.setCustomValidity('Please fill out this field.')
          control.reportValidity()
          return
        }
      }
    }
    onSave(submitValues)
  }

  const renderFieldLabel = (column: string, required: boolean) => (
    <span>
      {t(column)}
      {required && (
        <span className="crud-required-mark" aria-hidden="true">
          {' *'}
        </span>
      )}
    </span>
  )

  const handleCopy = () => {
    if (!row) return
    const text = columns.map((col, i) => `${t(col)}: ${row[i] || '—'}`).join('\n')
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Capitalize label for titles
  const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1)

  const renderCellValue = (column: string, value: string) => {
    const colLower = column.toLowerCase()
    const valLower = value?.toLowerCase() || ''

    // Status or boolean badge
    if (
      colLower.includes('status') ||
      colLower === 'is primary' ||
      colLower === 'is default' ||
      colLower === 'is active'
    ) {
      return (
        <span
          className="view-status-pill"
          style={{
            borderRadius: '2px',
            background: 'transparent',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
          }}
        >
          <i className="status-dot" style={{ background: '#64748b' }} />
          {t(value)}
        </span>
      )
    }

    // Price / Total / Amount
    if (
      (value?.startsWith('$') && !value?.startsWith('$2b$')) ||
      ['total', 'price', 'base price', 'unit price', 'subtotal', 'discount', 'shipping fee', 'amount', 'total spent', 'revenue'].includes(colLower)
    ) {
      return (
        <div className="view-price-wrapper">
          <span className="view-price-value" style={{ color: '#0f172a' }}>{value}</span>
          <span className="view-price-currency" style={{ color: '#64748b' }}>USD</span>
        </div>
      )
    }

    // Category
    if (colLower === 'category' || colLower === 'parent category') {
      return (
        <span className="view-category-pill" style={{ borderRadius: '2px', background: 'transparent', color: '#0f172a', border: '1px solid #e2e8f0' }}>
          <Tag className="view-pill-icon" style={{ color: '#64748b' }} />
          <span>{value || 'Uncategorized'}</span>
        </span>
      )
    }

    // Slug
    if (colLower === 'slug') {
      return (
        <span className="view-code-pill view-slug-pill" style={{ borderRadius: '2px', background: 'transparent', color: '#0f172a', border: '1px solid #e2e8f0' }}>
          <span className="view-slug-prefix" style={{ color: '#94a3b8' }}>/</span>
          {value || '—'}
        </span>
      )
    }

    // ID / Code / SKU / Variant SKU
    if (
      /^#[A-Za-z0-9_-]+$/.test(value?.trim() || '') ||
      ['id', 'order #', 'code', 'sku', 'variant (sku)', 'cart id'].includes(colLower)
    ) {
      return (
        <span className="view-code-pill" style={{ borderRadius: '2px', background: 'transparent', color: '#0f172a', border: '1px solid #e2e8f0' }}>
          {value}
        </span>
      )
    }

    // Created At / Updated At timestamps
    if (colLower === 'created at' || colLower === 'updated at' || colLower.includes('date')) {
      return (
        <div className="view-timestamp-wrap" style={{ color: '#0f172a' }}>
          {colLower.includes('update') ? (
            <Clock className="view-timestamp-icon" style={{ color: '#64748b' }} />
          ) : (
            <Calendar className="view-timestamp-icon" style={{ color: '#64748b' }} />
          )}
          <span className="view-text-value" style={{ color: '#0f172a' }}>{value || '—'}</span>
        </div>
      )
    }

    // Description / Notes / Bio
    if (colLower === 'description' || colLower.includes('notes') || colLower === 'bio') {
      return (
        <div className="view-description-content" style={{ borderRadius: '2px', background: 'transparent', color: '#0f172a', border: '1px solid #e2e8f0' }}>
          {value && value !== '—' ? (
            value
          ) : (
            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No description provided</span>
          )}
        </div>
      )
    }

    // Image URL / Avatar (display only image)
    if (colLower === 'image url' || colLower === 'image' || colLower === 'avatar') {
      const isAvatar = colLower === 'avatar'
      const fallbackSrc = isAvatar ? ameliaAvatar : asterLinenFront
      const resolvedSrc = value && value !== '—' ? value : fallbackSrc
      return (
        <img
          src={resolvedSrc}
          alt={column}
          className="table-image-thumb"
          onClick={() =>
            setPreviewImage({
              src: resolvedSrc,
              title: row?.[1] || row?.[0] || formattedLabel,
            })
          }
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = fallbackSrc
          }}
          style={{
            width: isAvatar ? '56px' : '72px',
            height: isAvatar ? '56px' : '72px',
            borderRadius: '2px',
            objectFit: 'cover',
            border: '1px solid #d5e2e8',
            background: '#f4f8fa',
            display: 'block',
          }}
        />
      )
    }

    // Customer / Recipient / User / Reviewer
    if (['customer', 'recipient', 'recipient name', 'user', 'reviewer'].includes(colLower)) {
      const initials = (value || '')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'U'
      return (
        <div className="view-user-row">
          <span className="view-user-avatar" style={{ borderRadius: '2px' }}>{initials}</span>
          <span className="view-text-value" style={{ color: '#0f172a' }}>{value}</span>
        </div>
      )
    }

    return <span className="view-text-value" style={{ color: '#0f172a' }}>{value || '—'}</span>
  }

  return (
    <div
      className="crud-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      {previewImage && (
        <div
          className="crud-backdrop image-popup-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            event.stopPropagation()
            if (event.target === event.currentTarget) setPreviewImage(null)
          }}
        >
          <section
            className="image-popup-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={previewImage.title || 'Image preview'}
          >
            <div className="image-popup-header">
              <strong>{previewImage.title || t('Image')}</strong>
              <Close variant="icon" onClick={() => setPreviewImage(null)} aria-label="Close image preview" />
            </div>
            <div className="image-popup-body">
              <img
                src={previewImage.src}
                alt={previewImage.title || 'Preview'}
                className="image-popup-img"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = asterLinenFront
                }}
              />
            </div>
            <div className="image-popup-footer">
              <Close onClick={() => setPreviewImage(null)} />
            </div>
          </section>
        </div>
      )}
      <section
        className={`crud-dialog ${currentMode === 'view' ? 'crud-dialog-view' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crud-title"
        style={{ borderRadius: '2px' }}
      >
        {/* Header */}
        <div className="crud-dialog-header">
          <div className="crud-header-main">
            {currentMode !== 'view' && (
              <div
                className="crud-header-icon"
                style={{ borderRadius: '2px' }}
              >
                <img src={editIcon} alt="" className="crud-header-icon-img" />
              </div>
            )}
            <div>
              <div className="crud-header-title-row">
                <h2 id="crud-title">
                  {currentMode === 'view'
                    ? `${formattedLabel} details`
                    : currentMode === 'edit'
                      ? `${t('Edit')} ${formattedLabel}`
                      : `New ${formattedLabel}`}
                </h2>
              </div>
              <p className="crud-header-sub">
                {currentMode === 'view'
                  ? `Viewing complete record information for ${label.toLowerCase()}`
                  : currentMode === 'edit'
                    ? `Update record details and save changes`
                    : `Fill in the information below to create a new ${label.toLowerCase()}`}
              </p>
            </div>
          </div>
          <Close
            variant="icon"
            onClick={onClose}
            aria-label="Close dialog"
            style={{ borderRadius: '2px' }}
          />
        </div>

        {/* Content */}
        {currentMode === 'view' ? (
          <>
            <div className="view-cards-grid">
              {columns.map((column, index) => {
                const val = row?.[index] || '—'
                const colLower = column.toLowerCase()
                const isFullWidth =
                  colLower === 'description' ||
                  colLower.includes('notes') ||
                  colLower.includes('address') ||
                  colLower === 'bio'
                return (
                  <div
                    className={`view-card-item ${isFullWidth ? 'view-card-item-full' : ''}`}
                    key={column}
                    style={{ borderRadius: '2px', background: 'transparent' }}
                  >
                    <span className="view-card-label">{t(column)}</span>
                    <div className="view-card-content">{renderCellValue(column, val)}</div>
                  </div>
                )
              })}
            </div>

            {/* Footer actions */}
            <div className="crud-dialog-actions">
              <button
                type="button"
                className="view-copy-button"
                onClick={handleCopy}
                title="Copy all details to clipboard"
                style={{ borderRadius: '2px' }}
              >
                {copied ? <Check /> : <Copy />}
                {copied ? t('Copied details') : t('Copy details')}
              </button>
              <div className="crud-actions-right">
                <Close onClick={onClose} style={{ borderRadius: '2px' }} />
                <Edit
                  onClick={() => {
                    setValues(buildInitialValues(columns, label, row, 'edit'))
                    setCurrentMode('edit')
                    onModeChange?.('edit')
                  }}
                  style={{ borderRadius: '2px' }}
                />
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleFormSubmit}>
            <div className="crud-form-grid">
              {columns.map((column, index) => {
                const colLower = column.toLowerCase()
                const isReadOnly = READONLY_COLUMNS.has(colLower)

                if (currentMode === 'add' && isReadOnly) {
                  return null
                }

                const isRequired = !isReadOnly && isFieldRequired(label, column, currentMode)

                const isImageCol =
                  colLower === 'image url' || colLower === 'image' || colLower === 'avatar'
                const isAvatar = colLower === 'avatar'
                const fallbackSrc = isAvatar ? ameliaAvatar : asterLinenFront

                if (isImageCol) {
                  const hasExistingImage = Boolean(values[index] && values[index] !== '—')
                  return (
                    <div className="crud-field" key={column}>
                      {renderFieldLabel(column, isRequired)}
                      <label className="crud-upload-box" style={{ position: 'relative' }}>
                        <img
                          src={hasExistingImage ? values[index] : fallbackSrc}
                          alt={column}
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = fallbackSrc
                          }}
                          className={`crud-upload-preview ${isAvatar ? 'avatar-preview' : ''}`}
                        />
                        <div className="crud-upload-info">
                          <span className="crud-upload-btn">
                            <Upload />
                            <span>Upload image</span>
                          </span>
                          <small>PNG, JPG, SVG or WEBP</small>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          data-col-index={index}
                          required={isRequired && !hasExistingImage}
                          style={{
                            position: 'absolute',
                            width: '1px',
                            height: '1px',
                            padding: 0,
                            margin: 0,
                            border: 0,
                            opacity: 0,
                            bottom: '4px',
                            left: '50%',
                            pointerEvents: 'none',
                          }}
                          onChange={(event) =>
                            handleImageUpload(index, event.target.files?.[0], event.currentTarget)
                          }
                        />
                      </label>
                    </div>
                  )
                }

                if (colLower === 'category') {
                  const rawCat = (values[index] ?? '').trim()
                  const matchedCat = categories.find(
                    (cat) =>
                      `${cat.name} (#${cat.id})` === rawCat ||
                      cat.name.toLowerCase() === rawCat.toLowerCase() ||
                      `#${cat.id}` === rawCat ||
                      `Category (#${cat.id})` === rawCat,
                  )
                  const selectValue = matchedCat
                    ? `${matchedCat.name} (#${matchedCat.id})`
                    : !rawCat || rawCat.toLowerCase() === 'uncategorized'
                      ? ''
                      : rawCat

                  return (
                    <label className="crud-field" key={column}>
                      {renderFieldLabel(column, isRequired)}
                      <select
                        data-col-index={index}
                        required={isRequired}
                        value={selectValue}
                        onChange={(event) => {
                          event.currentTarget.setCustomValidity('')
                          updateValue(index, event.target.value)
                        }}
                        autoFocus={index === (firstEditableIndex >= 0 ? firstEditableIndex : 0)}
                      >
                        <option value="">{`Select ${t(column).toLowerCase()}`}</option>
                        {!matchedCat && selectValue && (
                          <option value={selectValue}>
                            {selectValue.replace(/\s*\(#\d+\)$/, '')}
                          </option>
                        )}
                        {categories.map((cat) => {
                          const optionValue = `${cat.name} (#${cat.id})`
                          return (
                            <option key={cat.id} value={optionValue}>
                              {cat.name}
                            </option>
                          )
                        })}
                      </select>
                    </label>
                  )
                }

                if (colLower === 'product') {
                  const rawProd = (values[index] ?? '').trim()
                  const matchedProd = products.find(
                    (prod) =>
                      `${prod.name} (#${prod.id})` === rawProd ||
                      prod.name.toLowerCase() === rawProd.toLowerCase() ||
                      `#${prod.id}` === rawProd ||
                      `Product (#${prod.id})` === rawProd,
                  )
                  const selectValue = matchedProd
                    ? `${matchedProd.name} (#${matchedProd.id})`
                    : rawProd === '—'
                      ? ''
                      : rawProd

                  return (
                    <label className="crud-field" key={column}>
                      {renderFieldLabel(column, isRequired)}
                      <select
                        data-col-index={index}
                        required={isRequired}
                        value={selectValue}
                        onChange={(event) => {
                          event.currentTarget.setCustomValidity('')
                          updateValue(index, event.target.value)
                        }}
                        autoFocus={index === (firstEditableIndex >= 0 ? firstEditableIndex : 0)}
                      >
                        <option value="">{`Select ${t(column).toLowerCase()}`}</option>
                        {!matchedProd && selectValue && (
                          <option value={selectValue}>
                            {selectValue.replace(/\s*\(#\d+\)$/, '')}
                          </option>
                        )}
                        {products.map((prod) => {
                          const optionValue = `${prod.name} (#${prod.id})`
                          return (
                            <option key={prod.id} value={optionValue}>
                              {prod.name}
                            </option>
                          )
                        })}
                      </select>
                    </label>
                  )
                }

                if (colLower === 'status') {
                  const statusOptions = getStatusOptions(label)
                  const rawStatus = (values[index] ?? '').trim()
                  const matchedStatus =
                    statusOptions.find((opt) => opt.toLowerCase() === rawStatus.toLowerCase()) ||
                    (['in stock', 'low stock'].includes(rawStatus.toLowerCase())
                      ? 'Active'
                      : undefined) ||
                    statusOptions[0]

                  return (
                    <label className="crud-field" key={column}>
                      {renderFieldLabel(column, isRequired)}
                      <select
                        data-col-index={index}
                        required={isRequired}
                        value={matchedStatus}
                        onChange={(event) => {
                          event.currentTarget.setCustomValidity('')
                          updateValue(index, event.target.value)
                        }}
                        autoFocus={index === (firstEditableIndex >= 0 ? firstEditableIndex : 0)}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {t(opt)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )
                }

                if (colLower === 'is primary' || colLower === 'is default') {
                  const rawBool = (values[index] ?? '').trim().toLowerCase()
                  const selectedBool = ['yes', 'true', '1', 'primary', 'default'].includes(rawBool)
                    ? 'Yes'
                    : 'No'

                  return (
                    <label className="crud-field" key={column}>
                      {renderFieldLabel(column, isRequired)}
                      <select
                        data-col-index={index}
                        required={isRequired}
                        value={selectedBool}
                        onChange={(event) => {
                          event.currentTarget.setCustomValidity('')
                          updateValue(index, event.target.value)
                        }}
                        autoFocus={index === (firstEditableIndex >= 0 ? firstEditableIndex : 0)}
                      >
                        <option value="Yes">{t('Yes')}</option>
                        <option value="No">{t('No')}</option>
                      </select>
                    </label>
                  )
                }

                return (
                  <label className="crud-field" key={column}>
                    {renderFieldLabel(column, isRequired)}
                    <input
                      type={colLower === 'email' ? 'email' : 'text'}
                      data-col-index={index}
                      required={isRequired}
                      value={values[index] ?? ''}
                      readOnly={isReadOnly}
                      onChange={(event) => {
                        event.currentTarget.setCustomValidity('')
                        if (!isReadOnly) updateValue(index, event.target.value)
                      }}
                      autoFocus={index === (firstEditableIndex >= 0 ? firstEditableIndex : 0)}
                      placeholder={
                        isReadOnly
                          ? 'Auto-generated'
                          : `Enter ${t(column).toLowerCase()}`
                      }
                      style={
                        isReadOnly
                          ? { background: '#f4f7f9', color: '#64748b', cursor: 'not-allowed' }
                          : undefined
                      }
                    />
                  </label>
                )
              })}
            </div>

            {/* Footer actions */}
            <div className="crud-dialog-actions">
              {currentMode === 'edit' && onDelete && (
                <Delete onClick={onDelete} style={{ borderRadius: '2px' }} />
              )}
              <div className="crud-actions-right">
                <Cancel
                  style={{ borderRadius: '2px' }}
                  onClick={() => {
                    if (startedInView) {
                      setValues(row ?? columns.map(() => ''))
                      setCurrentMode('view')
                      onModeChange?.('view')
                    } else {
                      onClose()
                    }
                  }}
                />
                {currentMode === 'edit' ? (
                  <Edit
                    type="submit"
                    label="Save changes"
                    className="primary-button"
                    style={{ borderRadius: '2px' }}
                  />
                ) : (
                  <Create
                    type="submit"
                    icon="pencil"
                    style={{ borderRadius: '2px' }}
                  />
                )}
              </div>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
