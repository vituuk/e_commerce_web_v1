import type { ColumnDef } from '@tanstack/react-table'
import type { Product } from '@/types/product'
import { format } from 'date-fns'
import { formatUsd } from '@/utils/currency'
import { Edit } from '@/components/Edit'
import { Delete } from '@/components/Delete'
import { StatusBadge } from '@/components/StatusBadge'

export interface ProductColumnsProps {
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  t: (key: string, fallback?: string) => string
}

export const columns = ({
  onEdit,
  onDelete,
  t,
}: ProductColumnsProps): ColumnDef<Product>[] => [
  {
    accessorKey: 'id',
    header: t('ID', 'ID'),
    cell: ({ row }) => <strong>#{row.original.id}</strong>,
  },
  {
    accessorKey: 'name',
    header: t('Product name', 'Product Name'),
    cell: ({ row }) => row.original.name,
  },
  {
    id: 'category',
    header: t('Category', 'Category'),
    cell: ({ row }) => row.original.category?.name || `#${row.original.categoryId}`,
  },
  {
    accessorKey: 'slug',
    header: t('Slug', 'Slug'),
    cell: ({ row }) => <span className="view-code-pill">{row.original.slug}</span>,
  },
  {
    accessorKey: 'base_price',
    header: t('Base price', 'Base Price'),
    cell: ({ row }) => (
      <span className="view-price-value">{formatUsd(row.original.base_price)}</span>
    ),
  },
  {
    accessorKey: 'is_active',
    header: t('Status', 'Status'),
    cell: ({ row }) => (
      <StatusBadge status={row.original.is_active ? 'Active' : 'Inactive'} />
    ),
  },
  {
    accessorKey: 'createdAt',
    header: t('Created at', 'Created At'),
    cell: ({ row }) =>
      row.original.createdAt
        ? format(new Date(row.original.createdAt), 'MMM dd, yyyy')
        : '—',
  },
  {
    id: 'actions',
    header: t('Action', 'Actions'),
    cell: ({ row }) => (
      <div className="row-actions">
        <Edit onClick={() => onEdit(row.original)} />
        <Delete onClick={() => onDelete(row.original)} />
      </div>
    ),
  },
]

