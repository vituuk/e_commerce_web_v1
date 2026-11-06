import {
  LayoutDashboard,
  ShoppingCart,
  ListOrdered,
  Package,
  Layers,
  Image,
  Users,
  UserCheck,
  ShoppingBag,
  ListPlus,
  Tags,
  CreditCard,
  Star,
  Truck,
  Shield,
  UserCog,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import {
  dashboardIcon,
  ordersIcon,
  orderItemsIcon,
  productsIcon,
  productVariantsIcon,
  productImagesIcon,
  categoriesIcon,
  cartsIcon,
  cartItemsIcon,
  usersIcon,
  userProfilesIcon,
  rolesIcon,
  userRolesIcon,
  addressesIcon,
  paymentsIcon,
  reviewsIcon,
  settingsIcon,
} from '@/assets/img'

export interface NavItem {
  label: string
  icon: LucideIcon
  iconSrc?: string
  count?: string
  table?: string
}

export const navigation: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, iconSrc: dashboardIcon },
  { label: 'Orders', icon: ShoppingCart, iconSrc: ordersIcon, table: 'orders' },
  { label: 'Order items', icon: ListOrdered, iconSrc: orderItemsIcon, table: 'order_items' },
  { label: 'Products', icon: Package, iconSrc: productsIcon, table: 'products' },
  { label: 'Product variants', icon: Layers, iconSrc: productVariantsIcon, table: 'product_variants' },
  { label: 'Product images', icon: Image, iconSrc: productImagesIcon, table: 'product_images' },
  { label: 'Categories', icon: Tags, iconSrc: categoriesIcon, table: 'categories' },
  { label: 'Carts', icon: ShoppingBag, iconSrc: cartsIcon, table: 'carts' },
  { label: 'Cart items', icon: ListPlus, iconSrc: cartItemsIcon, table: 'cart_items' },
]

export const management: NavItem[] = [
  { label: 'Users', icon: Users, iconSrc: usersIcon, table: 'users' },
  { label: 'User profiles', icon: UserCheck, iconSrc: userProfilesIcon, table: 'user_profiles' },
  { label: 'Roles', icon: Shield, iconSrc: rolesIcon, table: 'roles' },
  { label: 'User roles', icon: UserCog, iconSrc: userRolesIcon, table: 'user_roles' },
  { label: 'Addresses', icon: Truck, iconSrc: addressesIcon, table: 'addresses' },
  { label: 'Payments', icon: CreditCard, iconSrc: paymentsIcon, table: 'payments' },
  { label: 'Reviews', icon: Star, iconSrc: reviewsIcon, table: 'reviews' },
  { label: 'Settings', icon: Settings, iconSrc: settingsIcon },
]


