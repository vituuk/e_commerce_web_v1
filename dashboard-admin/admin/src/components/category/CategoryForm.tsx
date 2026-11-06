import { useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useCreateCategory, useUpdateCategory } from '@/hooks/use-category'
import type { Category } from '@/types/category'
import { Close } from '@/components/Close'
import { Cancel } from '@/components/Cancel'
import { Create } from '@/components/Create'
import { Edit } from '@/components/Edit'
import { generateLiveSlug } from '@/utils/slug'
import { toast } from 'sonner'

const categorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required'),
  is_active: z.boolean().optional(),
})

export interface CategoryFormProps {
  open: boolean
  setOpen: (open: boolean) => void
  category?: Category
}

export function CategoryForm({ open, setOpen, category }: CategoryFormProps) {
  const { mutate: createMutate, isPending: isCreating } = useCreateCategory()
  const { mutate: updateMutate, isPending: isUpdating } = useUpdateCategory()

  const form = useForm({
    defaultValues: {
      name: category?.name || '',
      slug: category?.slug || '',
      is_active: category?.is_active ?? true,
    },
    validators: {
      onSubmit: categorySchema,
    },
    onSubmit: async ({ value }) => {
      const slug =
        value.slug?.trim() ||
        value.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')

      if (category?.id) {
        updateMutate(
          {
            id: category.id,
            request: { name: value.name, slug, is_active: value.is_active },
          },
          {
            onSuccess: () => {
              toast.success('Category updated successfully')
              setOpen(false)
            },
          },
        )
      } else {
        createMutate(
          { name: value.name, slug, is_active: value.is_active },
          {
            onSuccess: () => {
              toast.success('Category created successfully')
              setOpen(false)
            },
          },
        )
      }
    },
  })

  useEffect(() => {
    form.setFieldValue('name', category?.name || '')
    form.setFieldValue('slug', category?.slug || '')
    form.setFieldValue('is_active', category?.is_active ?? true)
  }, [category, open])

  if (!open) return null

  return (
    <div
      className="crud-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      <section className="crud-dialog" role="dialog" aria-modal="true" style={{ borderRadius: '2px' }}>
        <div className="crud-dialog-header">
          <div className="crud-header-main">
            <div>
              <h2>{category ? 'Edit Category' : 'New Category'}</h2>
              <p className="crud-header-sub">
                {category
                  ? 'Update category details and save changes'
                  : 'Create a new product category'}
              </p>
            </div>
          </div>
          <Close variant="icon" onClick={() => setOpen(false)} style={{ borderRadius: '2px' }} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void form.handleSubmit()
          }}
        >
          <div className="crud-form-grid">
            <form.Field name="name">
              {(field) => (
                <label className="crud-field">
                  <span>
                    Category Name
                    <span className="crud-required-mark" aria-hidden="true"> *</span>
                  </span>
                  <input
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value)
                      if (!category?.id) {
                        form.setFieldValue('slug', generateLiveSlug(e.target.value))
                      }
                    }}
                    placeholder="Enter category name"
                    required
                  />
                </label>
              )}
            </form.Field>

            <form.Field name="slug">
              {(field) => (
                <label className="crud-field">
                  <span>
                    Slug
                    <span className="crud-required-mark" aria-hidden="true"> *</span>
                  </span>
                  <input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="enter-category-slug"
                    required
                  />
                </label>
              )}
            </form.Field>
          </div>

          <div className="crud-dialog-actions">
            <div className="crud-actions-right">
              <Cancel onClick={() => setOpen(false)} style={{ borderRadius: '2px' }} />
              {category ? (
                <Edit
                  type="submit"
                  label={isUpdating ? 'Saving...' : 'Save changes'}
                  className="primary-button"
                  style={{ borderRadius: '2px' }}
                />
              ) : (
                <Create
                  type="submit"
                  label={isCreating ? 'Creating...' : 'Create'}
                  style={{ borderRadius: '2px' }}
                />
              )}
            </div>
          </div>
        </form>
      </section>
    </div>
  )
}

export default CategoryForm

