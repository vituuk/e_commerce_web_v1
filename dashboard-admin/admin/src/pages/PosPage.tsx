import { useCallback, useEffect, useState } from 'react'
import {
  CreditCard,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
} from 'lucide-react'
import { useI18n } from '@/assets/i18n'
import { Cancel } from '@/components/Cancel'
import { Close } from '@/components/Close'
import { Create } from '@/components/Create'
import { Delete } from '@/components/Delete'
import { CrudDialog } from '@/components/CrudDialog'
import {
  cartApi,
  extractErrorMessage,
  orderApi,
  productApi,
  slugify,
  variantApi,
} from '@/api'

interface PosProduct {
  id: string
  variantId?: number
  name: string
  category: string
  price: number
  stock: number
}

export function PosPage({ notify }: { notify: (message: string) => void }) {
  const { t } = useI18n()
  const [products, setProducts] = useState<PosProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<Array<{ product: PosProduct; quantity: number }>>([])
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const loadPosProducts = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await productApi.list({ limit: 50 })
      if (!data || data.length === 0) {
        setProducts([])
        return
      }
      const mapped = await Promise.all(
        data.map(
          async (p: {
            id: number
            name: string
            base_price?: number | string
            category?: { name: string }
          }) => {
            let stock = 0
            let variantId: number | undefined
            let price = Number(p.base_price || 0)
            try {
              const varRes = await variantApi.listByProduct(p.id)
              if (varRes?.variants?.length) {
                variantId = Number(varRes.variants[0].id)
                price = Number(varRes.variants[0].final_price ?? varRes.variants[0].price ?? price)
                stock = varRes.variants.reduce(
                  (sum: number, v: { stock_qty?: number }) => sum + Number(v.stock_qty || 0),
                  0,
                )
              }
            } catch {
              // ignore
            }
            return {
              id: String(p.id),
              variantId,
              name: p.name,
              category: p.category?.name || 'Uncategorized',
              price,
              stock,
            }
          },
        ),
      )
      setProducts(mapped)
    } catch (err) {
      setProducts([])
      notify(extractErrorMessage(err, 'Failed to load POS products from API'))
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    void loadPosProducts()
  }, [loadPosProducts])

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase()),
  )

  const addToCart = (product: PosProduct) => {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id)
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...current, { product, quantity: 1 }]
    })
    notify(`Added ${product.name} to cart`)
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.product.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const removeFromCart = (id: string) => {
    setCart((current) => current.filter((item) => item.product.id !== id))
  }

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  const handleCheckout = async () => {
    if (cart.length === 0) return
    try {
      const itemsWithVariant = cart.filter((i) => i.product.variantId)
      if (itemsWithVariant.length === 0) {
        notify('Selected products have no active variants to checkout')
        return
      }
      await cartApi.clearCart()
      for (const item of itemsWithVariant) {
        if (item.product.variantId) {
          await cartApi.addItem({
            variantId: item.product.variantId,
            quantity: item.quantity,
          })
        }
      }
      const createdOrder = await orderApi.checkout()
      notify(
        `Order ${createdOrder?.order_number || ''} created on server! Total: $${total.toFixed(2)}`,
      )
      setCart([])
      await loadPosProducts()
    } catch (err) {
      notify(extractErrorMessage(err, 'Checkout failed'))
    }
  }

  const handleCreatePosProduct = async (values: string[]) => {
    const name = values[1]?.trim()
    if (!name) return
    const price = parseFloat(values[3]?.replace('$', '') || '0') || 0
    const stock = parseInt(values[4] || '0', 10) || 0
    try {
      const created = await productApi.create({
        name,
        slug: `${slugify(name)}-${Date.now().toString(36)}`,
        base_price: price,
        is_active: true,
      })
      if (created?.id) {
        await variantApi.create(created.id, {
          sku: `POS-${created.id}-${Date.now().toString(36).toUpperCase()}`,
          price,
          stock_qty: stock,
          is_active: true,
        })
      }
      await loadPosProducts()
      notify(`${name} created on server`)
      setAddDialogOpen(false)
    } catch (err) {
      notify(extractErrorMessage(err, 'Failed to create product'))
    }
  }

  return (
    <div className="feature-view">
      {addDialogOpen && (
        <CrudDialog
          mode="add"
          label="product"
          columns={['ID', 'Product name', 'Category', 'Price', 'Stock qty']}
          onClose={() => setAddDialogOpen(false)}
          onSave={(values) => {
            void handleCreatePosProduct(values)
          }}
        />
      )}

      <div className="feature-heading">
        <div>
          <h1>Point of Sale (POS)</h1>
        </div>
        <Create label="Add product" onClick={() => setAddDialogOpen(true)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1fr)', gap: '16px' }}>
        {/* Products catalog section */}
        <div>
          <div className="panel" style={{ marginBottom: '16px', padding: '12px 16px' }}>
            <div className="search-box" style={{ maxWidth: '100%' }}>
              <Search />
              <input
                placeholder={`${t('Search')}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="panel empty-results">
              {loading
                ? 'Loading products from API...'
                : products.length === 0
                  ? 'No products found in database.'
                  : 'No products match your search.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  className="panel"
                  onClick={() => addToCart(product)}
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'transform 0.1s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="product-avatar">
                      <Package />
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
                      {t('Stock')}: {product.stock}
                    </span>
                  </div>
                  <strong style={{ fontSize: '13px', color: '#172638' }}>{product.name}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{product.category}</span>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
                    <strong style={{ color: '#247f75', fontSize: '14px' }}>${product.price.toFixed(2)}</strong>
                    <span style={{ background: '#e0f3ed', color: '#237d70', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                      + Add
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current Order Summary / Cart */}
        <aside className="panel" style={{ height: 'fit-content', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '14px', marginBottom: '14px' }}>
            <ShoppingCart style={{ width: '18px', color: '#247f75' }} />
            <h2 style={{ margin: 0, fontSize: '16px' }}>Current Order</h2>
            {cart.length > 0 && (
              <Delete
                variant="menu"
                label="Clear all"
                onClick={() => setCart([])}
                style={{ marginLeft: 'auto', background: 'transparent', border: 0, color: '#d77c70', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              />
            )}
          </div>

          {cart.length === 0 ? (
            <div style={{ padding: '36px 12px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '12px' }}>
              No items in cart. Click on products to add them to this order.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingBottom: '10px', borderBottom: '1px solid #f0f2f4' }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: '12px', color: '#172638' }}>{item.product.name}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>${item.product.price.toFixed(2)} each</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      className="pagination-button"
                      onClick={() => updateQuantity(item.product.id, -1)}
                      style={{ padding: '4px 6px' }}
                    >
                      <Minus style={{ width: '10px' }} />
                    </button>
                    <span style={{ minWidth: '18px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}>
                      {item.quantity}
                    </span>
                    <button
                      className="pagination-button"
                      onClick={() => updateQuantity(item.product.id, 1)}
                      style={{ padding: '4px 6px' }}
                    >
                      <Plus style={{ width: '10px' }} />
                    </button>
                  </div>

                  <strong style={{ minWidth: '55px', textAlign: 'right', fontSize: '12px' }}>
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </strong>

                  <Close
                    variant="icon"
                    onClick={() => removeFromCart(item.product.id)}
                    aria-label={`Remove ${item.product.name}`}
                    style={{ width: '24px', height: '24px' }}
                  />
                </div>
              ))}

              <div style={{ marginTop: '14px', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted-foreground)' }}>
                  <span>{t('Subtotal')}</span>
                  <strong>${subtotal.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted-foreground)' }}>
                  <span>Tax (8%)</span>
                  <strong>${tax.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                  <span>{t('Total')}</span>
                  <span style={{ color: '#247f75' }}>${total.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <Cancel onClick={() => setCart([])} />
                <Create
                  icon="none"
                  onClick={() => void handleCheckout()}
                  style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
                >
                  <CreditCard style={{ width: '16px' }} /> {t('Create order')} (${total.toFixed(2)})
                </Create>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

export default PosPage
