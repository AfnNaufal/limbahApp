import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts'
import { useApp } from '../context'
import { getDashboardSummary, getMonthlyTrends, type DashboardSummaryData } from '../api'
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery'
import {
  MONTHLY_B3_IN, MONTHLY_B3_OUT, MONTHLY_DOM_MORNING, MONTHLY_DOM_AFTERNOON,
  WEEKLY_B3_IN, WEEKLY_B3_OUT, WEEKLY_DOM_MORNING, WEEKLY_DOM_AFTERNOON,
  PIE_B3_IN, PIE_B3_OUT, PIE_DOM_MORNING, PIE_DOM_AFTERNOON,
  SUMMARY_STATS,
} from '../data'

type TrendPeriod = 'weekly' | 'monthly' | 'yearly'

interface CategoryConfig {
  id: string
  labelKey: string
  color: string
  barData: { name: string; value: number }[]
  weeklyData: { name: string; value: number }[]
  monthlyData: { name: string; value: number }[]
  pieData: { name: string; value: number }[]
  stats: { total: number; change: number; entries: number }
  unit: string
}

function CardStat({ value, label, change, tokens }: {
  value: number; label: string; change: number; tokens: ReturnType<typeof useApp>['tokens']
}) {
  const { t } = useApp()
  const up = change >= 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: tokens.text, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
        <span style={{ fontSize: 13, fontWeight: 400, color: tokens.textMuted, marginLeft: 4 }}>kg</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
          background: up ? '#22c55e22' : '#ef444422',
          color: up ? '#16a34a' : '#dc2626',
        }}>
          {up ? '▲' : '▼'} {Math.abs(change)}%
        </span>
        <span style={{ fontSize: 11, color: tokens.textMuted }}>
          {t('fromLastPeriod')}
        </span>
      </div>
      <div style={{ fontSize: 12, color: tokens.textMuted }}>{label}</div>
    </div>
  )
}

function ChartCard({ title, children, tokens, onClick }: {
  title: string; children: React.ReactNode; tokens: ReturnType<typeof useApp>['tokens']; onClick?: () => void
}) {
  const { theme, t } = useApp()
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
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.12)`
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = tokens.shadow
        }
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: tokens.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function TrendToggle({ value, onChange, tokens }: { value: TrendPeriod; onChange: (v: TrendPeriod) => void; tokens: ReturnType<typeof useApp>['tokens'] }) {
  const opts: TrendPeriod[] = ['weekly', 'monthly', 'yearly']
  const { t } = useApp()
  const labels: Record<TrendPeriod, string> = {
    weekly: t('weekly'),
    monthly: t('monthly'),
    yearly: t('yearly')
  }
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
      {opts.map((o) => (
        <button key={o} onClick={(e) => { e.stopPropagation(); onChange(o) }}
          style={{
            padding: '3px 8px', borderRadius: 4, border: `1px solid ${tokens.border}`,
            background: value === o ? tokens.primary : 'transparent',
            color: value === o ? tokens.textInverse : tokens.textMuted,
            fontSize: 11, cursor: 'pointer', fontFamily: tokens.fontFamily, fontWeight: value === o ? 600 : 400,
          }}>
          {labels[o]}
        </button>
      ))}
    </div>
  )
}

function CategorySection({
  config, tokens, onCardClick,
}: {
  config: CategoryConfig; tokens: ReturnType<typeof useApp>['tokens']; onCardClick: (id: string) => void
}) {
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('monthly')
  const { theme, t } = useApp()
  const isNight = theme === 'nightcity'
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  const trendData = trendPeriod === 'monthly'
    ? config.monthlyData
    : trendPeriod === 'weekly'
      ? config.weeklyData
      : config.monthlyData.map((d, i) => ({ ...d, name: `${2020 + i}` })).slice(0, 5)

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

  const rowColumns = isMobile ? '1fr' : isTablet ? '1fr 1fr' : '220px 1fr 200px 1fr'

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ width: 4, height: 20, background: config.color, borderRadius: 2, boxShadow: isNight ? `0 0 8px ${config.color}` : undefined }} />
        <h2 style={{ fontSize: 15, fontWeight: 700, color: tokens.text, margin: 0, fontFamily: tokens.fontFamily }}>
          {config.labelKey}
        </h2>
        <div style={{ fontSize: 12, color: tokens.textMuted }}>
          {config.stats.entries} {t('entries')}
        </div>
      </div>

      {/* Row: summary card + bar + pie + trend */}
      <div style={{ display: 'grid', gridTemplateColumns: rowColumns, gap: 12 }}>
        {/* Summary card */}
        <ChartCard title={t('summary')} tokens={tokens} onClick={() => onCardClick(config.id)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${config.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: config.color }} />
            </div>
            <CardStat
              value={config.stats.total}
              label={`${config.stats.entries} ${t('transactions')}`} change={config.stats.change}
              tokens={tokens}
            />
          </div>
        </ChartCard>

        {/* Bar chart */}
        <ChartCard title={t('barChart')} tokens={tokens} onClick={() => onCardClick(config.id)}>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={config.barData} barSize={14} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toFixed(1)} kg`, '']} />
              <Bar dataKey="value" fill={config.color} radius={[2, 2, 0, 0]}
                style={{ filter: isNight ? `drop-shadow(0 0 4px ${config.color})` : undefined }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pie chart */}
        <ChartCard title={t('distribution')} tokens={tokens} onClick={() => onCardClick(config.id)}>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={config.pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50}
                dataKey="value" paddingAngle={2}>
                {config.pieData.map((_, i) => {
                  const pieColors = [config.color, tokens.accent, tokens.warning, tokens.success, '#a78bfa', '#fb923c']
                  return <Cell key={i} fill={pieColors[i % pieColors.length]} />
                })}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toFixed(1)}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Trend chart */}
        <ChartCard title={t('trend')} tokens={tokens} onClick={() => onCardClick(config.id)}>
          <TrendToggle value={trendPeriod} onChange={setTrendPeriod} tokens={tokens} />
          <ResponsiveContainer width="100%" height={96}>
            <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toFixed(1)} kg`, '']} />
              <Line type="monotone" dataKey="value" stroke={config.color} strokeWidth={2} dot={false}
                style={{ filter: isNight ? `drop-shadow(0 0 4px ${config.color})` : undefined }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

function QuickPreview({ id, onClose, onOpenFull }: { id: string; onClose: () => void; onOpenFull: () => void }) {
  const { tokens, t, theme } = useApp()
  const isGlass = theme === 'frosted' || theme === 'liquid'
  const isMobile = useIsMobile()

  const labels: Record<string, string> = {
    b3in: t('b3In'),
    b3out: t('b3Out'),
    domMorning: t('domesticOrganic'),
    domAfternoon: t('domesticInorganic'),
  }

  const stats = {
    b3in: SUMMARY_STATS.b3In,
    b3out: SUMMARY_STATS.b3Out,
    domMorning: SUMMARY_STATS.domMorning,
    domAfternoon: SUMMARY_STATS.domAfternoon,
  }[id] ?? SUMMARY_STATS.b3In

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      zIndex: 50,
    }} onClick={onClose}>
      <div style={{
        width: isMobile ? '100%' : 400,
        maxWidth: '100vw',
        height: '100%',
        background: isGlass ? (tokens.glassBg ?? tokens.card) : tokens.card,
        backdropFilter: isGlass ? tokens.glassBlur : undefined,
        WebkitBackdropFilter: isGlass ? tokens.glassBlur : undefined,
        borderLeft: `1px solid ${tokens.cardBorder}`,
        padding: 24,
        display: 'flex', flexDirection: 'column', gap: 20,
        fontFamily: tokens.fontFamily,
        overflowY: 'auto',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: tokens.text }}>{t('quickPreview')}: {labels[id]}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted, fontSize: 18 }}>×</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Total Berat', value: `${stats.total.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg` },
            { label: 'Total Entri', value: String(stats.entries) },
            { label: 'Perubahan', value: `${stats.change > 0 ? '+' : ''}${stats.change}%` },
            { label: 'Periode', value: '2024' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: tokens.bgSecondary, borderRadius: tokens.radius, padding: 12 }}>
              <div style={{ fontSize: 11, color: tokens.textMuted, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: tokens.text }}>{value}</div>
            </div>
          ))}
        </div>
        <button
          onClick={onOpenFull}
          style={{
            padding: '10px 20px', background: tokens.primary, color: tokens.textInverse,
            border: 'none', borderRadius: tokens.radius, cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: tokens.fontFamily,
          }}
        >
          {t('openFullPage')} →
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { tokens, setPage, t } = useApp()
  const [preview, setPreview] = useState<string | null>(null)
  const [summaryData, setSummaryData] = useState<DashboardSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  useEffect(() => {
    getDashboardSummary()
      .then((data) => {
        setSummaryData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load dashboard summary:', err)
        setLoading(false)
      })
  }, [])

  const b3InWeight = summaryData?.b3_in_weight_kg ?? SUMMARY_STATS.b3In.total
  const b3OutWeight = summaryData?.b3_out_weight_kg ?? SUMMARY_STATS.b3Out.total
  const domOrganicWeight = summaryData?.domestic_today_organic_kg ?? SUMMARY_STATS.domMorning.total
  const domInorganicWeight = summaryData?.domestic_today_inorganic_kg ?? SUMMARY_STATS.domAfternoon.total

  const categories: CategoryConfig[] = [
    {
      id: 'b3in',
      labelKey: t('b3InTitle'),
      color: tokens.chartB3In,
      barData: MONTHLY_B3_IN.map((d) => ({ name: d.month, value: d.value })),
      weeklyData: WEEKLY_B3_IN.map((d) => ({ name: d.week, value: d.value })),
      monthlyData: MONTHLY_B3_IN.map((d) => ({ name: d.month, value: d.value })),
      pieData: PIE_B3_IN,
      stats: { total: b3InWeight, change: SUMMARY_STATS.b3In.change, entries: summaryData?.b3_count_in ?? SUMMARY_STATS.b3In.entries },
      unit: 'kg',
    },
    {
      id: 'b3out',
      labelKey: t('b3OutTitle'),
      color: tokens.chartB3Out,
      barData: MONTHLY_B3_OUT.map((d) => ({ name: d.month, value: d.value })),
      weeklyData: WEEKLY_B3_OUT.map((d) => ({ name: d.week, value: d.value })),
      monthlyData: MONTHLY_B3_OUT.map((d) => ({ name: d.month, value: d.value })),
      pieData: PIE_B3_OUT,
      stats: { total: b3OutWeight, change: SUMMARY_STATS.b3Out.change, entries: summaryData?.b3_count_out ?? SUMMARY_STATS.b3Out.entries },
      unit: 'kg',
    },
    {
      id: 'domMorning',
      labelKey: t('domesticOrganicTitle'),
      color: tokens.chartDomMorning,
      barData: MONTHLY_DOM_MORNING.map((d) => ({ name: d.month, value: d.value })),
      weeklyData: WEEKLY_DOM_MORNING.map((d) => ({ name: d.week, value: d.value })),
      monthlyData: MONTHLY_DOM_MORNING.map((d) => ({ name: d.month, value: d.value })),
      pieData: PIE_DOM_MORNING,
      stats: { total: domOrganicWeight, change: SUMMARY_STATS.domMorning.change, entries: SUMMARY_STATS.domMorning.entries },
      unit: 'kg',
    },
    {
      id: 'domAfternoon',
      labelKey: t('domesticInorganicTitle'),
      color: tokens.chartDomAfternoon,
      barData: MONTHLY_DOM_AFTERNOON.map((d) => ({ name: d.month, value: d.value })),
      weeklyData: WEEKLY_DOM_AFTERNOON.map((d) => ({ name: d.week, value: d.value })),
      monthlyData: MONTHLY_DOM_AFTERNOON.map((d) => ({ name: d.month, value: d.value })),
      pieData: PIE_DOM_AFTERNOON,
      stats: { total: domInorganicWeight, change: SUMMARY_STATS.domAfternoon.change, entries: SUMMARY_STATS.domAfternoon.entries },
      unit: 'kg',
    },
  ]

  const isGlass = tokens.glassBg !== undefined
  const kpiColumns = isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'

  return (
    <div style={{ padding: isMobile ? '16px' : '20px 24px', overflowY: 'auto', flex: 1, fontFamily: tokens.fontFamily }}>
      {/* Live DB connection badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: loading ? '#f59e0b' : '#22c55e',
            display: 'inline-block',
            boxShadow: loading ? '0 0 6px #f59e0b' : '0 0 6px #22c55e',
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: tokens.textMuted }}>
            {loading
              ? t('connectingDatabase')
              : t('databaseConnected')}
          </span>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: kpiColumns, gap: 12, marginBottom: 28 }}>
        {[
          { label: t('b3In'), value: b3InWeight, change: SUMMARY_STATS.b3In.change, color: tokens.chartB3In },
          { label: t('b3Out'), value: b3OutWeight, change: SUMMARY_STATS.b3Out.change, color: tokens.chartB3Out },
          { label: t('domesticOrganic'), value: domOrganicWeight, change: SUMMARY_STATS.domMorning.change, color: tokens.chartDomMorning },
          { label: t('domesticInorganic'), value: domInorganicWeight, change: SUMMARY_STATS.domAfternoon.change, color: tokens.chartDomAfternoon },
        ].map(({ label, value, change, color }) => (
          <div key={label} style={{
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
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{label}</div>
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
              <span style={{ fontSize: 11, color: tokens.textMuted }}>vs 2023</span>
            </div>
          </div>
        ))}
      </div>

      {/* Category sections */}
      {categories.map((cat) => (
        <CategorySection
          key={cat.id}
          config={cat}
          tokens={tokens}
          onCardClick={(id) => setPreview(id)}
        />
      ))}

      {/* Quick preview panel */}
      {preview && (
        <QuickPreview
          id={preview}
          onClose={() => setPreview(null)}
          onOpenFull={() => {
            setPreview(null)
            setPage(preview.startsWith('b3') ? 'b3' : 'domestic')
          }}
        />
      )}
    </div>
  )
}