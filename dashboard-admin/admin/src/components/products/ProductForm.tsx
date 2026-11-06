import { useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useCreateProduct, useUpdateProduct } from '@/hooks/use-product'
import type { Product } from '@/types/product'
import { Close } from '@/components/Close'
import { Cancel } from '@/components/Cancel'
import { Create } from '@/components/Create'
import { Edit } from '@/components/Edit'
import { generateLiveSlug } from '@/utils/slug'
import { toast } from 'sonner'

const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  categoryId: z.number().min(1, 'Category ID is required'),
  base_price: z.number().min(0, 'Base price must be >= 0'),
  slug: z.string().optional(),
  description: z.string().optional(),
})

export interface ProductFormProps {
  open: boolean
  setOpen: (open: boolean) => void
  product?: Product
}

export function ProductForm({ open, setOpen, product }: ProductFormProps) {
  const { mutate: createMutate, isPending: isCreating } = useCreateProduct()
  const { mutate: updateMutate, isPending: isUpdating } = useUpdateProduct()

  const form = useForm({
    defaultValues: {
      name: product?.name || '',
      categoryId: Number(product?.categoryId || 1),
      base_price: Number(product?.base_price || 0),
      slug: product?.slug || '',
      description: product?.description || '',
    },
    validators: {
      onSubmit: productSchema,
    },
    onSubmit: async ({ value }) => {
      const slug =
        value.slug?.trim() ||
        value.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')

      if (product?.id) {
        updateMutate(
          {
            id: product.id,
            request: {
              name: value.name,
              categoryId: Number(value.categoryId),
              base_price: Number(value.base_price),
              slug,
              description: value.description,
            },
          },
          {
            onSuccess: () => {
              toast.success('Product updated successfully')
              setOpen(false)
            },
          },
        )
      } else {
        createMutate(
          {
            name: value.name,
            categoryId: Number(value.categoryId),
            base_price: Number(value.base_price),
            slug,
            description: value.description,
            is_active: true,
          },
          {
            onSuccess: () => {
              toast.success('Product created successfully')
              setOpen(false)
            },
          },
        )
      }
    },
  })

  useEffect(() => {
    form.setFieldValue('name', product?.name || '')
    form.setFieldValue('categoryId', Number(product?.categoryId || 1))
    form.setFieldValue('base_price', Number(product?.base_price || 0))
    form.setFieldValue('slug', product?.slug || '')
    form.setFieldValue('description', product?.description || '')
  }, [product, open])

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
              <h2>{product ? 'Edit Product' : 'New Product'}</h2>
              <p className="crud-header-sub">
                {product ? 'Update product details' : 'Create a new catalog product'}
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
                  <span>Product Name</span>
                  <input
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value)
                      if (!product?.id) {
                        form.setFieldValue('slug', generateLiveSlug(e.target.value))
                      }
                    }}
                    required
                  />
                </label>
              )}
            </form.Field>

            <form.Field name="categoryId">
              {(field) => (
                <label className="crud-field">
                  <span>Category ID</span>
                  <input
                    type="number"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    required
                  />
                </label>
              )}
            </form.Field>

            <form.Field name="base_price">
              {(field) => (
                <label className="crud-field">
                  <span>Base Price ($)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    required
                  />
                </label>
              )}
            </form.Field>

            <form.Field name="slug">
              {(field) => (
                <label className="crud-field">
                  <span>Slug</span>
                  <input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </label>
              )}
            </form.Field>

            <form.Field name="description">
              {(field) => (
                <label className="crud-field" style={{ gridColumn: '1 / -1' }}>
                  <span>Description</span>
                  <input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </label>
              )}
            </form.Field>
          </div>

          <div className="crud-dialog-actions">
            <div className="crud-actions-right">
              <Cancel onClick={() => setOpen(false)} style={{ borderRadius: '2px' }} />
              {product ? (
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

export default ProductForm

