import { useState } from 'react'
import { useDebounce } from 'use-debounce'
import { useCategory, useDeleteCategory } from '@/hooks/use-category'
import { DataTable } from '@/components/data-table/data-table'
import { columns } from '@/components/category/Columns'
import { CategoryForm } from '@/components/category/CategoryForm'
import { ConfirmDelete } from '@/components/category/ConfirmDelete'
import type { Category } from '@/types/category'
import { toast } from 'sonner'

export function TestCategoryTable() {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch] = useDebounce(searchInput, 500)

  const { data } = useCategory(debouncedSearch)
  const { mutate: deleteMutate } = useDeleteCategory()

  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const handleDeleteConfirm = () => {
    deleteMutate(
      { id: selectedCategory?.id },
      {
        onSuccess: () => toast.success('Category deleted successfully'),
      },
    )
  }

  return (
    <div className="panel resource-panel">
      <div className="resource-toolbar">
        <div className="resource-search">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search category..."
          />
        </div>
      </div>

      <DataTable
        columns={columns({
          onEdit: (cat) => {
            setSelectedCategory(cat)
            setIsFormOpen(true)
          },
          onDelete: (cat) => {
            setSelectedCategory(cat)
            setIsDeleteOpen(true)
          },
          t: (_k, fb) => fb || _k,
        })}
        data={data?.data ?? []}
      />

      <CategoryForm
        open={isFormOpen}
        setOpen={setIsFormOpen}
        category={selectedCategory}
      />

      <ConfirmDelete
        isOpen={isDeleteOpen}
        setIsOpen={setIsDeleteOpen}
        confirmDelete={handleDeleteConfirm}
      />
    </div>
  )
}

export default TestCategoryTable

