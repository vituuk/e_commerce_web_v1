export interface ResourceConfig {
  tableName?: string
  columns: string[]
  rows: string[][]
}

export const resourceData: Record<string, ResourceConfig> = {
  Orders: {
    tableName: 'orders',
    columns: [
      'ID',
      'Order #',
      'User',
      'Shipping address',
      'Subtotal',
      'Discount',
      'Shipping fee',
      'Total',
      'Status',
      'Order date',
      'Updated at',
    ],
    rows: [],
  },
  'Order items': {
    tableName: 'order_items',
    columns: ['ID', 'Order #', 'Variant (SKU)', 'Product name', 'Unit price', 'Qty', 'Amount'],
    rows: [],
  },
  Products: {
    tableName: 'products',
    columns: [
      'ID',
      'Product name',
      'Category',
      'Slug',
      'Description',
      'Base price',
      'Status',
      'Created at',
      'Updated at',
    ],
    rows: [],
  },
  'Product variants': {
    tableName: 'product_variants',
    columns: ['ID', 'SKU', 'Product', 'Color', 'Size', 'Price', 'Stock qty', 'Status'],
    rows: [],
  },
  'Product images': {
    tableName: 'product_images',
    columns: ['ID', 'Product', 'Image URL', 'Is primary'],
    rows: [],
  },
  Categories: {
    tableName: 'categories',
    columns: ['ID', 'Category name', 'Slug', 'Parent category', 'Status'],
    rows: [],
  },
  Carts: {
    tableName: 'carts',
    columns: ['ID', 'User', 'Updated at'],
    rows: [],
  },
  'Cart items': {
    tableName: 'cart_items',
    columns: ['ID', 'Cart ID', 'Variant (SKU)', 'Qty'],
    rows: [],
  },
  Users: {
    tableName: 'users',
    columns: [
      'ID',
      'First name',
      'Last name',
      'Email',
      'Password hash',
      'Status',
      'Created at',
      'Updated at',
    ],
    rows: [],
  },
  'User profiles': {
    tableName: 'user_profiles',
    columns: [
      'ID',
      'User',
      'Avatar',
      'Bio',
      'Date of birth',
      'Phone',
      'Created at',
      'Updated at',
    ],
    rows: [],
  },
  Roles: {
    tableName: 'roles',
    columns: ['ID', 'Role name', 'Code', 'Status'],
    rows: [],
  },
  'User roles': {
    tableName: 'user_roles',
    columns: ['ID', 'User', 'Role'],
    rows: [],
  },
  Addresses: {
    tableName: 'addresses',
    columns: [
      'ID',
      'User',
      'Recipient name',
      'Phone',
      'Address line',
      'City',
      'Is default',
      'Created at',
    ],
    rows: [],
  },
  Payments: {
    tableName: 'payments',
    columns: ['ID', 'Order #', 'Method', 'Amount', 'Status', 'Paid at', 'Created at'],
    rows: [],
  },
  Reviews: {
    tableName: 'reviews',
    columns: ['ID', 'User', 'Product', 'Rating', 'Comment', 'Created at'],
    rows: [],
  },
}

// Backwards-compatible aliases for legacy page imports
resourceData['Customers'] = resourceData['Users']
resourceData['Roles & access'] = resourceData['Roles']
