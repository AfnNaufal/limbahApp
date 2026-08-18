import { useEffect, useState, type ReactNode } from 'react'
import {
  Bar, BarChart, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useApp } from '../context'
import {
  getDashboardSummary, getDashboardTrends, getDashboardCategoryBreakdown,
  type DashboardSummaryData, type DashboardTrendItem, type CategoryBreakdownItem,
} from '../api'
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery'

type TrendPeriod = 'weekly' | 'monthly' | 'yearly'

interface ChartDataItem {
  name: string
  value: number
}

interface CategoryConfig {
  id: string
  labelKey: string
  color: string
  barData: ChartDataItem[]
  weeklyData: ChartDataItem[]
  monthlyData: ChartDataItem[]
  pieData: ChartDataItem[]
  stats: { total: number; change: number; entries: number }
  unit: string
}

interface CardStatProps {
  value: number
  label: string
  change: number
  tokens: ReturnType<typeof useApp>['tokens']
}

function CardStat({ value, label, change, tokens }: CardStatProps) {
  const isIncreasing = change >= 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: tokens.text, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
        <span style={{ fontSize: 13, fontWeight: 400, color: tokens.textMuted, marginLeft: 4 }}>kg</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
          background: isIncreasing ? '#22c55e22' : '#ef444422',
          color: isIncreasing ? '#16a34a' : '#dc2626',
        }}>
          {isIncreasing ? '▲' : '▼'} {Math.abs(change)}%
        </span>
        <span style={{ fontSize: 11, color: tokens.textMuted }}>tren periode</span>
      </div>

      <div style={{ fontSize: 12, color: tokens.textMuted }}>{label}</div>
    </div>
  )
}

interface ChartCardProps {
  title: string
  children: ReactNode
  tokens: ReturnType<typeof useApp>['tokens']
  onClick?: () => void
}

function ChartCard({ title, children, tokens, onClick }: ChartCardProps) {
  const { theme } = useApp()
  const isGlass = theme === 'frosted' || theme === 'liquid'

  return (
    <div
      onClick={onClick}
      style={{
        background: tokens.card,
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: tokens.radius,
        padding: '14px 16px',
        boxShadow: tokens.shadow,
        backdropFilter: isGlass ? tokens.glassBlur : undefined,
        WebkitBackdropFilter: isGlass ? tokens.glassBlur : undefined,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        fontFamily: tokens.fontFamily,
        minWidth: 0,
      }}
      onMouseEnter={(event) => {
        if (!onClick) return
        event.currentTarget.style.transform = 'translateY(-2px)'
        event.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={(event) => {
        if (!onClick) return
        event.currentTarget.style.transform = 'translateY(0)'
        event.currentTarget.style.boxShadow = tokens.shadow
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: tokens.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

interface TrendToggleProps {
  value: TrendPeriod
  onChange: (value: TrendPeriod) => void
  tokens: ReturnType<typeof useApp>['tokens']
}

function TrendToggle({ value, onChange, tokens }: TrendToggleProps) {
  const { t } = useApp()
  const options: TrendPeriod[] = ['weekly', 'monthly', 'yearly']
  const labels: Record<TrendPeriod, string> = {
    weekly: t('weekly', 'Mingguan'),
    monthly: t('monthly', 'Bulanan'),
    yearly: t('yearly', 'Tahunan'),
  }

  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onChange(option)
          }}
          style={{
            padding: '3px 8px',
            borderRadius: 4,
            border: `1px solid ${tokens.border}`,
            background: value === option ? tokens.primary : 'transparent',
            color: value === option ? tokens.textInverse : tokens.textMuted,
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: tokens.fontFamily,
            fontWeight: value === option ? 600 : 400,
          }}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  )
}

function CategorySection({ config, tokens, onCardClick }: CategorySectionProps) {
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('monthly')
  const [mobileTab, setMobileTab] = useState<'bar' | 'pie' | 'trend'>('bar')
  const { theme, t } = useApp()
  const isNight = theme === 'nightcity'
  const isGlass = theme === 'frosted' || theme === 'liquid'
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  const trendData =
    trendPeriod === 'monthly'
      ? config.monthlyData
      : trendPeriod === 'weekly'
        ? config.weeklyData
        : config.monthlyData.slice(-5)

  const tooltipStyle = {
    contentStyle: {
      background: tokens.tooltipBg,
      border: `1px solid ${tokens.border}`,
      borderRadius: '6px',
      color: tokens.tooltipText,
      fontSize: 12,
      fontFamily: tokens.fontFamily,
    },
    itemStyle: { color: tokens.tooltipText },
    labelStyle: { color: tokens.tooltipText, fontWeight: 600 },
  }

  const pieColors = [config.color, tokens.accent, tokens.warning, tokens.success, '#a78bfa', '#fb923c', '#06b6d4', '#ec4899']
  const totalPie = config.pieData.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)
  const topPieItems = [...config.pieData]
    .sort((a, b) => Number(b.value) - Number(a.value))
    .slice(0, 3)

  // Find max month in barData
  const highestMonth = [...config.barData]
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)[0]

  if (isMobile) {
    return (
      <div
        style={{
          background: tokens.card,
          border: `1px solid ${tokens.cardBorder}`,
          borderRadius: tokens.radius,
          padding: '16px',
          boxShadow: tokens.shadow,
          backdropFilter: isGlass ? tokens.glassBlur : undefined,
          WebkitBackdropFilter: isGlass ? tokens.glassBlur : undefined,
          marginBottom: 16,
          fontFamily: tokens.fontFamily,
        }}
      >
        {/* Mobile Header: Category + Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: config.color, flexShrink: 0, boxShadow: `0 0 6px ${config.color}` }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: tokens.text }}>{config.labelKey}</div>
              <div style={{ fontSize: 11, color: tokens.textMuted }}>{config.stats.entries} transaksi tercatat</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: tokens.text, fontVariantNumeric: 'tabular-nums' }}>
              {config.stats.total.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
              <span style={{ fontSize: 11, color: tokens.textMuted, marginLeft: 2 }}>kg</span>
            </div>
            <button
              type="button"
              onClick={() => onCardClick(config.id)}
              style={{ background: 'none', border: 'none', color: tokens.primary, fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              Detail →
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div style={{ display: 'flex', background: tokens.bgSecondary, padding: 3, borderRadius: 6, gap: 4, marginBottom: 12 }}>
          {[
            { id: 'bar', label: '📊 Volume', title: 'Volume Bulanan' },
            { id: 'pie', label: '🍩 Komposisi', title: 'Komposisi Limbah' },
            { id: 'trend', label: '📈 Tren', title: 'Fluktuasi Tren' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileTab(tab.id as any)}
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: 4,
                border: 'none',
                background: mobileTab === tab.id ? tokens.card : 'transparent',
                color: mobileTab === tab.id ? tokens.text : tokens.textMuted,
                fontWeight: mobileTab === tab.id ? 700 : 500,
                fontSize: 11.5,
                boxShadow: mobileTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                fontFamily: tokens.fontFamily,
                transition: 'background 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Tab View */}
        {mobileTab === 'bar' && (
          <div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={config.barData} barSize={16} margin={{ top: 6, right: 4, bottom: 4, left: -16 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(value) => [`${Number(value).toFixed(1)} kg`, '']} />
                <Bar
                  dataKey="value"
                  fill={config.color}
                  radius={[3, 3, 0, 0]}
                  style={{ filter: isNight ? `drop-shadow(0 0 4px ${config.color})` : undefined }}
                />
              </BarChart>
            </ResponsiveContainer>
            {highestMonth && (
              <div style={{ marginTop: 6, fontSize: 11, color: tokens.textMuted, textAlign: 'center', background: tokens.bgSecondary, padding: '4px 8px', borderRadius: 4 }}>
                🏆 Puncak Tertinggi: <strong style={{ color: tokens.text }}>{highestMonth.name} ({highestMonth.value.toLocaleString('id-ID')} kg)</strong>
              </div>
            )}
          </div>
        )}

        {mobileTab === 'pie' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={config.pieData.length > 0 ? config.pieData : [{ name: 'Belum ada data', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={48}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {config.pieData.map((_, index) => (
                      <Cell key={`${config.id}-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(value, name) => [`${Number(value).toLocaleString('id-ID')} kg`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Mini Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4, borderTop: `1px solid ${tokens.border}`, paddingTop: 8 }}>
              {config.pieData.length === 0 ? (
                <span style={{ fontSize: 11, color: tokens.textMuted, textAlign: 'center' }}>Belum ada data rincian</span>
              ) : (
                (() => {
                  const sorted = [...config.pieData].sort((a, b) => Number(b.value) - Number(a.value))
                  const top3 = sorted.slice(0, 3)
                  const others = sorted.slice(3)
                  const otherTotal = others.reduce((sum, item) => sum + (Number(item.value) || 0), 0)
                  const otherPct = totalPie > 0 ? ((otherTotal / totalPie) * 100).toFixed(0) : '0'

                  return (
                    <>
                      {top3.map((item, idx) => {
                        const pct = totalPie > 0 ? ((Number(item.value) / totalPie) * 100).toFixed(0) : '0'
                        const color = pieColors[idx % pieColors.length]
                        return (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                              <span style={{ color: tokens.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                                {item.name}
                              </span>
                            </div>
                            <span style={{ fontWeight: 600, color: tokens.textMuted, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                              {Number(item.value).toLocaleString('id-ID')} kg ({pct}%)
                            </span>
                          </div>
                        )
                      })}

                      {others.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: tokens.textMuted, borderTop: `1px dashed ${tokens.border}`, paddingTop: 3 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8', flexShrink: 0 }} />
                            <span>Lainnya ({others.length} jenis limbah)</span>
                          </div>
                          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                            {otherTotal.toLocaleString('id-ID')} kg ({otherPct}%)
                          </span>
                        </div>
                      )}
                    </>
                  )
                })()
              )}
            </div>
          </div>
        )}

        {mobileTab === 'trend' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
              <TrendToggle value={trendPeriod} onChange={setTrendPeriod} tokens={tokens} />
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(value, name) => [`${Number(value).toLocaleString('id-ID')} kg`, name]} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={config.color}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: config.color }}
                  style={{ filter: isNight ? `drop-shadow(0 0 4px ${config.color})` : undefined }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    )
  }

  // Desktop & Tablet View
  const rowColumns = isTablet ? '1fr 1fr' : '220px 1fr 220px 1fr'

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ width: 4, height: 20, background: config.color, borderRadius: 2, boxShadow: isNight ? `0 0 8px ${config.color}` : undefined }} />
        <h2 style={{ fontSize: 15, fontWeight: 700, color: tokens.text, margin: 0, fontFamily: tokens.fontFamily }}>
          {config.labelKey}
        </h2>
        <div style={{ fontSize: 12, color: tokens.textMuted }}>
          {config.stats.entries} {t('entries', 'entri')}
        </div>
      </div>

      {/* Row: summary card + bar + pie + trend */}
      <div style={{ display: 'grid', gridTemplateColumns: rowColumns, gap: 12 }}>
        <ChartCard title={t('summary', 'Ringkasan')} tokens={tokens} onClick={() => onCardClick(config.id)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${config.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: config.color }} />
            </div>
            <CardStat
              value={config.stats.total}
              label={`${config.stats.entries} ${t('transactions', 'transaksi')}`}
              change={config.stats.change}
              tokens={tokens}
            />
          </div>
        </ChartCard>

        <ChartCard title="Volume Bulanan" tokens={tokens} onClick={() => onCardClick(config.id)}>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={config.barData} barSize={14} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(value) => [`${Number(value).toFixed(1)} kg`, '']} />
              <Bar
                dataKey="value"
                fill={config.color}
                radius={[2, 2, 0, 0]}
                style={{ filter: isNight ? `drop-shadow(0 0 4px ${config.color})` : undefined }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Komposisi Limbah" tokens={tokens} onClick={() => onCardClick(config.id)}>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie
                data={config.pieData.length > 0 ? config.pieData : [{ name: 'Belum ada data', value: 1 }]}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={48}
                dataKey="value"
                paddingAngle={2}
              >
                {config.pieData.map((_, index) => (
                  <Cell key={`${config.id}-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(value, name) => [`${Number(value).toLocaleString('id-ID')} kg`, name]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fluktuasi Tren" tokens={tokens} onClick={() => onCardClick(config.id)}>
          <TrendToggle value={trendPeriod} onChange={setTrendPeriod} tokens={tokens} />
          <ResponsiveContainer width="100%" height={96}>
            <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(value, name) => [`${Number(value).toLocaleString('id-ID')} kg`, name]} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={config.color}
                strokeWidth={2}
                dot={false}
                style={{ filter: isNight ? `drop-shadow(0 0 4px ${config.color})` : undefined }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

interface QuickPreviewProps {
  category: CategoryConfig | null
  onClose: () => void
  onOpenFull: () => void
}

function QuickPreview({ category, onClose, onOpenFull }: QuickPreviewProps) {
  const { tokens, t, theme } = useApp()
  const isGlass = theme === 'frosted' || theme === 'liquid'

  if (!category) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(400px, 100%)',
          height: '100%',
          background: isGlass ? tokens.glassBg ?? tokens.card : tokens.card,
          backdropFilter: isGlass ? tokens.glassBlur : undefined,
          WebkitBackdropFilter: isGlass ? tokens.glassBlur : undefined,
          borderLeft: `1px solid ${tokens.cardBorder}`,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          fontFamily: tokens.fontFamily,
          overflowY: 'auto',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: tokens.text }}>
            {t('quickPreview', 'Pratinjau Cepat')}: {category.labelKey}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted, fontSize: 18 }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          {[
            { label: 'Total Berat', value: `${category.stats.total.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg` },
            { label: 'Total Entri', value: String(category.stats.entries) },
            { label: 'Perubahan', value: `${category.stats.change >= 0 ? '+' : ''}${category.stats.change}%` },
            { label: 'Satuan', value: 'kg' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: tokens.bgSecondary, borderRadius: tokens.radius, padding: 12 }}>
              <div style={{ fontSize: 11, color: tokens.textMuted, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: tokens.text }}>{value}</div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onOpenFull}
          style={{
            padding: '10px 20px',
            background: tokens.primary,
            color: tokens.textInverse,
            border: 'none',
            borderRadius: tokens.radius,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: tokens.fontFamily,
          }}
        >
          {t('openFullPage', 'Buka Halaman Lengkap')} →
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { tokens, setPage, t, year } = useApp()
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [summaryData, setSummaryData] = useState<DashboardSummaryData | null>(null)
  const [trendsData, setTrendsData] = useState<DashboardTrendItem[] | null>(null)
  const [breakdownData, setBreakdownData] = useState<CategoryBreakdownItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(false)
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setApiError(false)
      const [summary, trends, breakdown] = await Promise.all([
        getDashboardSummary(),
        getDashboardTrends(12, year),
        getDashboardCategoryBreakdown(),
      ])
      setSummaryData(summary)
      setTrendsData(trends)
      setBreakdownData(breakdown)
    } catch (error) {
      console.error('Failed to load dashboard summary:', error)
      setApiError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [year])

  const b3InWeight = Number(summaryData?.b3_in_weight_kg ?? 0)
  const b3OutWeight = Number(summaryData?.b3_out_weight_kg ?? 0)
  const domesticOrganicWeight = Number(summaryData?.domestic_today_organic_kg ?? 0)
  const domesticInorganicWeight = Number(summaryData?.domestic_today_inorganic_kg ?? 0)

  const defaultMonths: ChartDataItem[] = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    .map((name) => ({ name, value: 0 }))

  const monthlyB3In: ChartDataItem[] = trendsData && trendsData.length > 0
    ? trendsData.map((item) => ({ name: item.month_name, value: item.b3_in_weight_kg }))
    : defaultMonths

  const monthlyB3Out: ChartDataItem[] = trendsData && trendsData.length > 0
    ? trendsData.map((item) => ({ name: item.month_name, value: item.b3_out_weight_kg }))
    : defaultMonths

  const monthlyDomOrganic: ChartDataItem[] = trendsData && trendsData.length > 0
    ? trendsData.map((item) => ({ name: item.month_name, value: item.domestic_organic_kg }))
    : defaultMonths

  const monthlyDomInorganic: ChartDataItem[] = trendsData && trendsData.length > 0
    ? trendsData.map((item) => ({ name: item.month_name, value: item.domestic_inorganic_kg }))
    : defaultMonths

  const b3InPieData: ChartDataItem[] = breakdownData && breakdownData.length > 0
    ? breakdownData
        .filter((b) => (b.in_weight_kg !== undefined ? Number(b.in_weight_kg) > 0 : Number(b.total_weight_kg) > 0))
        .map((b) => ({ name: b.category_name, value: Number(b.in_weight_kg !== undefined ? b.in_weight_kg : b.total_weight_kg) }))
    : b3InWeight > 0 ? [{ name: 'Limbah B3 Masuk', value: b3InWeight }] : []

  const b3OutPieData: ChartDataItem[] = breakdownData && breakdownData.length > 0
    ? breakdownData
        .filter((b) => (b.out_weight_kg !== undefined ? Number(b.out_weight_kg) > 0 : Number(b.total_weight_kg) > 0))
        .map((b) => ({ name: b.category_name, value: Number(b.out_weight_kg !== undefined ? b.out_weight_kg : b.total_weight_kg) }))
    : b3OutWeight > 0 ? [{ name: 'Limbah B3 Keluar', value: b3OutWeight }] : []

  const categories: CategoryConfig[] = [
    {
      id: 'b3in',
      labelKey: t('b3InTitle', 'Limbah B3 Masuk'),
      color: tokens.chartB3In,
      barData: monthlyB3In,
      weeklyData: monthlyB3In.slice(-4),
      monthlyData: monthlyB3In,
      pieData: b3InPieData,
      stats: {
        total: b3InWeight,
        change: 0,
        entries: summaryData?.b3_count_in ?? 0,
      },
      unit: 'kg',
    },
    {
      id: 'b3out',
      labelKey: t('b3OutTitle', 'Limbah B3 Keluar'),
      color: tokens.chartB3Out,
      barData: monthlyB3Out,
      weeklyData: monthlyB3Out.slice(-4),
      monthlyData: monthlyB3Out,
      pieData: b3OutPieData,
      stats: {
        total: b3OutWeight,
        change: 0,
        entries: summaryData?.b3_count_out ?? 0,
      },
      unit: 'kg',
    },
    {
      id: 'domMorning',
      labelKey: t('domesticOrganicTitle', 'Limbah Domestik Organik (Pagi)'),
      color: tokens.chartDomMorning,
      barData: monthlyDomOrganic,
      weeklyData: monthlyDomOrganic.slice(-4),
      monthlyData: monthlyDomOrganic,
      pieData: domesticOrganicWeight > 0 ? [{ name: 'Organik', value: domesticOrganicWeight }] : [],
      stats: {
        total: domesticOrganicWeight,
        change: 0,
        entries: summaryData?.domestic_today_organic_kg ? 1 : 0,
      },
      unit: 'kg',
    },
    {
      id: 'domAfternoon',
      labelKey: t('domesticInorganicTitle', 'Limbah Domestik Anorganik (Sore)'),
      color: tokens.chartDomAfternoon,
      barData: monthlyDomInorganic,
      weeklyData: monthlyDomInorganic.slice(-4),
      monthlyData: monthlyDomInorganic,
      pieData: domesticInorganicWeight > 0 ? [{ name: 'Anorganik', value: domesticInorganicWeight }] : [],
      stats: {
        total: domesticInorganicWeight,
        change: 0,
        entries: summaryData?.domestic_today_inorganic_kg ? 1 : 0,
      },
      unit: 'kg',
    },
  ]

  const isGlass = tokens.glassBg !== undefined
  const kpiColumns = isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'

  const connectionColor = loading ? '#f59e0b' : apiError ? '#ef4444' : '#22c55e'
  const connectionText = loading
    ? t('connectingDatabase', 'Memuat data...')
    : apiError
      ? 'Gagal terhubung ke API'
      : t('databaseConnected', 'Terhubung ke Database')

  const activePreviewCategory = categories.find((c) => c.id === previewId) ?? null

  return (
    <div style={{ padding: isMobile ? '16px' : '20px 24px', overflowY: 'auto', flex: 1, fontFamily: tokens.fontFamily }}>
      {/* Analytics Page Top Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 20,
          background: tokens.card,
          border: `1px solid ${tokens.cardBorder}`,
          borderRadius: tokens.radius,
          padding: '16px 20px',
          boxShadow: tokens.shadow,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => setPage('home')}
            style={{
              padding: '6px 12px',
              background: tokens.bgSecondary,
              color: tokens.text,
              border: `1px solid ${tokens.border}`,
              borderRadius: tokens.radius,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span>←</span> {t('home', 'Beranda')}
          </button>

          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? 16 : 18, fontWeight: 800, color: tokens.text }}>
              {t('dashboardAnalytics', 'Dasbor Analitik & Grafik Pemantauan')}
            </h1>
            <span style={{ fontSize: 12, color: tokens.textMuted }}>
              Rekapitulasi visualisasi neraca limbah B3 & Domestik periode tahun {year}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: connectionColor,
              display: 'inline-block',
              boxShadow: `0 0 6px ${connectionColor}`,
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: apiError ? '#ef4444' : tokens.textMuted }}>
            {connectionText}
          </span>
        </div>
      </div>

      {/* Error Alert Banner with Retry */}
      {apiError && (
        <div
          style={{
            background: `${tokens.danger}15`,
            border: `1px solid ${tokens.danger}40`,
            borderRadius: tokens.radius,
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            fontFamily: tokens.fontFamily,
          }}
        >
          <div style={{ color: tokens.danger, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
            <span>⚠️</span>
            <span>Gagal memuat data analitik terbaru dari server. Periksa koneksi API Anda.</span>
          </div>
          <button
            onClick={() => loadDashboard()}
            disabled={loading}
            style={{
              padding: '6px 14px',
              borderRadius: tokens.radius,
              background: tokens.danger,
              color: '#ffffff',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: tokens.fontFamily,
            }}
          >
            {loading ? 'Memuat...' : 'Coba Lagi'}
          </button>
        </div>
      )}

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: kpiColumns, gap: 12, marginBottom: 28 }}>
        {[
          { id: 'b3in', label: t('b3In', 'B3 Masuk'), value: b3InWeight, change: 0, color: tokens.chartB3In },
          { id: 'b3out', label: t('b3Out', 'B3 Keluar'), value: b3OutWeight, change: 0, color: tokens.chartB3Out },
          { id: 'domMorning', label: t('domesticOrganic', 'Domestik Organik'), value: domesticOrganicWeight, change: 0, color: tokens.chartDomMorning },
          { id: 'domAfternoon', label: t('domesticInorganic', 'Domestik Anorganik'), value: domesticInorganicWeight, change: 0, color: tokens.chartDomAfternoon },
        ].map(({ id, label, value, change, color }) => (
          <div
            key={id}
            onClick={() => setPreviewId(id)}
            style={{
              background: tokens.card,
              border: `1px solid ${tokens.cardBorder}`,
              borderRadius: tokens.radius,
              padding: '16px 18px',
              boxShadow: tokens.shadow,
              backdropFilter: isGlass ? tokens.glassBlur : undefined,
              WebkitBackdropFilter: isGlass ? tokens.glassBlur : undefined,
              borderTop: `3px solid ${color}`,
              cursor: 'pointer',
              transition: 'transform 0.15s',
              minWidth: 0,
            }}
            onMouseEnter={(event) => { event.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(event) => { event.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              {label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: tokens.text, fontVariantNumeric: 'tabular-nums' }}>
              {value.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
              <span style={{ fontSize: 12, color: tokens.textMuted, fontWeight: 400, marginLeft: 3 }}>kg</span>
            </div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                background: change >= 0 ? '#22c55e22' : '#ef444422',
                color: change >= 0 ? '#16a34a' : '#dc2626',
              }}>
                {change >= 0 ? '▲' : '▼'} {Math.abs(change)}%
              </span>
              <span style={{ fontSize: 11, color: tokens.textMuted }}>tahun {year}</span>
            </div>
          </div>
        ))}
      </div>

      {categories.map((category) => (
        <CategorySection
          key={category.id}
          config={category}
          tokens={tokens}
          onCardClick={setPreviewId}
        />
      ))}

      {previewId && (
        <QuickPreview
          category={activePreviewCategory}
          onClose={() => setPreviewId(null)}
          onOpenFull={() => {
            const destination = previewId.startsWith('b3') ? 'b3' : 'domestic'
            setPreviewId(null)
            setPage(destination)
          }}
        />
      )}
    </div>
  )
}