import type { ColumnDef } from '@tanstack/react-table'
import type { Category } from '@/types/category'
import { format } from 'date-fns'
import { Edit } from '@/components/Edit'
import { Delete } from '@/components/Delete'
import { StatusBadge } from '@/components/StatusBadge'

export interface CategoryColumnsProps {
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  t: (key: string, fallback?: string) => string
}

export const columns = ({
  onEdit,
  onDelete,
  t,
}: CategoryColumnsProps): ColumnDef<Category>[] => [
  {
    accessorKey: 'id',
    header: t('ID', 'ID'),
    cell: ({ row }) => <strong>#{row.original.id}</strong>,
  },
  {
    accessorKey: 'name',
    header: t('Category name', 'Name'),
    cell: ({ row }) => row.original.name,
  },
  {
    accessorKey: 'slug',
    header: t('Slug', 'Slug'),
    cell: ({ row }) => <span className="view-code-pill">{row.original.slug}</span>,
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
        ? format(new Date(row.original.createdAt), 'MM/dd/yyyy hh:mm a')
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

