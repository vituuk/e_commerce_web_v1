import {
  CircleDollarSign,
  ShoppingCart,
  Users,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'

export interface StatCardItem {
  label: string
  value: string
  Icon: LucideIcon
  tone: 'green' | 'violet' | 'orange' | 'blue'
  change: string
  isDown?: boolean
  targetResource?: string
}

export const overviewStats: StatCardItem[] = [
  { label: 'Total revenue', value: '$0.00', Icon: CircleDollarSign, tone: 'green', change: '0.0%', targetResource: 'Payments' },
  { label: 'Total orders', value: '0', Icon: ShoppingCart, tone: 'violet', change: '0.0%', targetResource: 'Orders' },
  { label: 'New customers', value: '0', Icon: Users, tone: 'orange', change: '0.0%', targetResource: 'Users' },
  { label: 'Avg. order value', value: '$0.00', Icon: BarChart3, tone: 'blue', change: '0.0%', targetResource: 'Order items' },
]

export interface PopularProductItem {
  id: string
  product: string
  sku: string
  category: string
  price: string
  image: string
  units: string
  revenue: string
  share: number
  rating: string
  stock?: string
  status: string
}

export const popularProducts: PopularProductItem[] = []

export interface ActivityFeedItem {
  id: string
  title: string
  detail: string
  time: string
  Icon: LucideIcon
  tone: 'green' | 'violet' | 'orange' | 'blue'
  targetResource: string
}

export const recentActivityItems: ActivityFeedItem[] = []

export const recentActivity: string[] = []

export interface ChartBarPoint {
  date: string
  revenueBar: number
  orderBar: number
  revenueLabel: string
  ordersCount: number
}

export interface RevenueRangeData {
  summaryRevenue: string
  summaryOrders: string
  yAxis: string[]
  xAxis: string[]
  points: ChartBarPoint[]
}

const emptyRangeSeries: RevenueRangeData = {
  summaryRevenue: '$0.00',
  summaryOrders: '0 orders',
  yAxis: ['$1k', '$750', '$500', '$250', '$0'],
  xAxis: [],
  points: [],
}

export const revenueSeriesByRange: Record<string, RevenueRangeData> = {
  'Last 30 days': emptyRangeSeries,
  'Last 7 days': emptyRangeSeries,
  'This year': emptyRangeSeries,
}

export const revenueChartBars: number[] = []

export const revenueChartXAxis: string[] = []

export interface OrderPipelineItem {
  status: string
  count: number
  percentage: number
  amount: string
}

export const orderPipeline: OrderPipelineItem[] = [
  { status: 'Paid', count: 0, percentage: 0, amount: '$0.00' },
  { status: 'Shipped', count: 0, percentage: 0, amount: '0 orders' },
  { status: 'Processing', count: 0, percentage: 0, amount: '0 pending' },
]

