import { Download, RefreshCw } from 'lucide-react'
import { useI18n } from '@/assets/i18n'
import type { RevenueRangeData } from '@/constants/dashboard'

export interface TotalVisitorsChartProps {
  range: string
  onRangeChange: (nextRange: string) => void
  currentSeries: RevenueRangeData
  liveReportSummary?: { revenue: string; orders: string } | null
  hoveredBar: number | null
  onHoverBar: (index: number | null) => void
  syncing?: boolean
  onSync?: () => void
  onExportExcel?: () => void
}

export function TotalVisitorsChart({
  range,
  onRangeChange,
  currentSeries,
  liveReportSummary,
  hoveredBar,
  onHoverBar,
  syncing = false,
  onSync,
  onExportExcel,
}: TotalVisitorsChartProps) {
  const { t } = useI18n()

  return (
    <article className="panel revenue-panel">
      <div className="panel-heading">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2>{t('Revenue overview')}</h2>
            <span className="view-header-id">
              {liveReportSummary
                ? `${liveReportSummary.revenue} • ${liveReportSummary.orders}`
                : `${currentSeries.summaryRevenue} • ${currentSeries.summaryOrders}`}
            </span>
          </div>
          <p>{t("Track your store's revenue and order volume over time")}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onExportExcel && (
            <button
              type="button"
              className="filter-button"
              onClick={onExportExcel}
              title="Download Excel order report from GET /order/admin/report/export"
            >
              <Download style={{ width: 13, height: 13 }} /> .xlsx
            </button>
          )}
          {onSync && (
            <button
              type="button"
              className="filter-button"
              onClick={onSync}
              disabled={syncing}
              title="Refresh metrics from API"
            >
              <RefreshCw style={{ width: 13, height: 13 }} />
            </button>
          )}
          <select
            className="select-button"
            value={range}
            onChange={(event) => onRangeChange(event.target.value)}
          >
            <option value="Last 30 days">{t('Last 30 days')}</option>
            <option value="Last 7 days">{t('Last 7 days')}</option>
            <option value="This year">{t('This year')}</option>
          </select>
        </div>
      </div>
      <div className="chart-legend" style={{ justifyContent: 'space-between', paddingRight: '8px' }}>
        <div style={{ display: 'flex', gap: '17px' }}>
          <span>
            <i className="legend-dot revenue-dot" />
            {t('Revenue')}
          </span>
          <span>
            <i className="legend-dot orders-dot" />
            {t('Orders')}
          </span>
        </div>
        {hoveredBar !== null && currentSeries.points[hoveredBar] && (
          <span
            style={{
              background: '#172638',
              color: '#fff',
              padding: '3px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            {currentSeries.points[hoveredBar].date}: {currentSeries.points[hoveredBar].revenueLabel} (
            {currentSeries.points[hoveredBar].ordersCount} {t('orders')})
          </span>
        )}
      </div>
      <div className="chart">
        <div className="y-axis">
          {currentSeries.yAxis.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="chart-main">
          <div className="grid-lines">
            {[1, 2, 3, 4, 5].map((i) => (
              <i key={i} />
            ))}
          </div>
          <div className="bar-row">
            {currentSeries.points.map((pt, i) => (
              <div
                className="bar-group"
                key={pt.date}
                onMouseEnter={() => onHoverBar(i)}
                onMouseLeave={() => onHoverBar(null)}
                style={{
                  cursor: 'pointer',
                  opacity: hoveredBar === null || hoveredBar === i ? 1 : 0.55,
                  transition: 'opacity 0.15s',
                }}
                title={`${pt.date}: ${pt.revenueLabel} (${pt.ordersCount} ${t('orders')})`}
              >
                <div
                  className="bar revenue-bar"
                  style={{ height: `${pt.revenueBar}%`, transition: 'height 0.25s ease' }}
                />
                <div
                  className="bar order-bar"
                  style={{ height: `${pt.orderBar}%`, transition: 'height 0.25s ease' }}
                />
              </div>
            ))}
          </div>
          <div className="x-axis">
            {currentSeries.xAxis.map((date) => (
              <span key={date}>{date}</span>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

export default TotalVisitorsChart

