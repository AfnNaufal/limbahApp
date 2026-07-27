import { useState, useMemo, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts'
import { useApp } from '../context'
import { getDomesticTransactions } from '../api'
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery'
import {
  DOMESTIC_TRANSACTIONS, MONTHLY_DOM_MORNING, MONTHLY_DOM_AFTERNOON,
  PIE_DOM_MORNING, PIE_DOM_AFTERNOON, NOTIFICATIONS,
} from '../data'

type TrendPeriod = 'weekly' | 'monthly' | 'yearly'

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processed: '#3b82f6',
  disposed: '#22c55e',
  received: '#3b82f6',
  completed: '#22c55e',
  draft: '#6b7280',
  verified: '#22c55e',
}

const YEARLY_DATA = [
  { name: '2020', morning: 2834.5, afternoon: 1823.2 },
  { name: '2021', morning: 3156.8, afternoon: 2034.6 },
  { name: '2022', morning: 3423.4, afternoon: 2212.8 },
  { name: '2023', morning: 3423.9, afternoon: 2298.4 },
  { name: '2024', morning: 3863.2, afternoon: 2431.4 },
]

export default function DomesticPage() {
  const { tokens, t, theme } = useApp()
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('monthly')
  const [filterSession, setFilterSession] = useState<'all' | 'morning' | 'afternoon'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processed' | 'disposed'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [apiData, setApiData] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const PAGE_SIZE = 10

  useEffect(() => {
    getDomesticTransactions(page, PAGE_SIZE, filterSession)
      .then((res) => {
        if (res?.data) {
          const mapped = res.data.map((item: any) => ({
            id: `DOM-${item.id}`,
            date: item.date,
            session: (item.session || 'MORNING').toLowerCase(),
            organicKg: item.organic_weight_kg,
            inorganicKg: item.inorganic_weight_kg,
            totalKg: item.total_weight_kg,
            picName: item.pic_name || 'Petugas',
            status: item.status === 'VERIFIED' ? 'disposed' : 'pending',
            notes: item.notes || '-',
          }))
          setApiData(mapped)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load domestic transactions:', err)
        setLoading(false)
      })
  }, [page, filterSession])

  const transactionsList = apiData ?? DOMESTIC_TRANSACTIONS
  const isGlass = theme === 'frosted' || theme === 'liquid'

  const filtered = useMemo(() => {
    return transactionsList.filter((tx) => {
      if (filterSession !== 'all' && tx.session !== filterSession) return false
      if (filterStatus !== 'all' && tx.status !== filterStatus) return false
      if (search) {
        const s = search.toLowerCase()
        return String(tx.id).toLowerCase().includes(s) || String(tx.picName).toLowerCase().includes(s)
      }
      return true
    })
  }, [transactionsList, filterSession, filterStatus, search])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  const trendData = trendPeriod === 'monthly'
    ? MONTHLY_DOM_MORNING.map((d, i) => ({ name: d.month, morning: d.value, afternoon: MONTHLY_DOM_AFTERNOON[i]?.value ?? 0 }))
    : trendPeriod === 'yearly'
      ? YEARLY_DATA
      : MONTHLY_DOM_MORNING.slice(0, 4).map((d, i) => ({ name: `W${i + 1}`, morning: d.value / 4, afternoon: (MONTHLY_DOM_AFTERNOON[i]?.value ?? 0) / 4 }))

  const tooltipStyle = {
    contentStyle: {
      background: tokens.tooltipBg, border: `1px solid ${tokens.border}`,
      borderRadius: '6px', color: tokens.tooltipText, fontSize: 12, fontFamily: tokens.fontFamily,
    },
    itemStyle: { color: tokens.tooltipText },
    labelStyle: { color: tokens.tooltipText, fontWeight: 600 },
  }

  const cardStyle = {
    background: tokens.card,
    border: `1px solid ${tokens.cardBorder}`,
    borderRadius: tokens.radius,
    padding: '16px 18px',
    boxShadow: tokens.shadow,
    backdropFilter: isGlass ? tokens.glassBlur : undefined,
    WebkitBackdropFilter: isGlass ? tokens.glassBlur : undefined,
    fontFamily: tokens.fontFamily,
    minWidth: 0,
  }

  const chartColumns = isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 220px 1fr'

  return (
    <div style={{ padding: isMobile ? '16px' : '20px 24px', overflowY: 'auto', flex: 1, fontFamily: tokens.fontFamily }}>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: chartColumns, gap: 14, marginBottom: 20 }}>
        {/* Bar */}
        <div style={cardStyle}>
          <div style={{ fontSize: 12, fontWeight: 600, color: tokens.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Volume Pagi vs Sore (Bulanan)
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MONTHLY_DOM_MORNING.map((d, i) => ({ name: d.month, morning: d.value, afternoon: MONTHLY_DOM_AFTERNOON[i]?.value ?? 0 }))} barSize={10}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="morning" fill={tokens.chartDomMorning} radius={[2, 2, 0, 0]} name="Pagi" />
              <Bar dataKey="afternoon" fill={tokens.chartDomAfternoon} radius={[2, 2, 0, 0]} name="Sore" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ ...cardStyle, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Komposisi Pagi
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <PieChart>
                <Pie data={PIE_DOM_MORNING} cx="50%" cy="50%" outerRadius={34} dataKey="value" paddingAngle={3}>
                  <Cell fill={tokens.success} />
                  <Cell fill={tokens.accent} />
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toFixed(1)}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: tokens.success, display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: tokens.success, display: 'inline-block' }} />Organik</span>
              <span style={{ fontSize: 10, color: tokens.accent, display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: tokens.accent, display: 'inline-block' }} />Anorganik</span>
            </div>
          </div>
          <div style={{ ...cardStyle, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Komposisi Sore
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <PieChart>
                <Pie data={PIE_DOM_AFTERNOON} cx="50%" cy="50%" outerRadius={34} dataKey="value" paddingAngle={3}>
                  <Cell fill={tokens.chartDomAfternoon} />
                  <Cell fill={tokens.warning} />
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toFixed(1)}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tren</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['weekly', 'monthly', 'yearly'] as TrendPeriod[]).map((p) => (
                <button key={p} onClick={() => setTrendPeriod(p)} style={{
                  padding: '2px 7px', borderRadius: 3, border: `1px solid ${tokens.border}`,
                  background: trendPeriod === p ? tokens.primary : 'transparent',
                  color: trendPeriod === p ? tokens.textInverse : tokens.textMuted,
                  fontSize: 10, cursor: 'pointer', fontFamily: tokens.fontFamily,
                }}>
                  {p === 'weekly' ? 'Minggu' : p === 'monthly' ? 'Bulan' : 'Tahun'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="morning" stroke={tokens.chartDomMorning} strokeWidth={2} dot={false} name="Pagi" />
              <Line type="monotone" dataKey="afternoon" stroke={tokens.chartDomAfternoon} strokeWidth={2} dot={false} name="Sore" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: tokens.text }}>{t('allTransactions')} — Domestik</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input type="text" placeholder={t('search')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              style={{ padding: '5px 10px', background: tokens.inputBg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, fontSize: 12, color: tokens.text, fontFamily: tokens.fontFamily, width: isMobile ? '100%' : 160, outline: 'none' }} />
            <select value={filterSession} onChange={(e) => { setFilterSession(e.target.value as typeof filterSession); setPage(1) }}
              style={{ padding: '5px 8px', background: tokens.inputBg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, fontSize: 12, color: tokens.text, fontFamily: tokens.fontFamily, cursor: 'pointer' }}>
              <option value="all">{t('allSessions')}</option>
              <option value="morning">{t('morning')}</option>
              <option value="afternoon">{t('afternoon')}</option>
            </select>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as typeof filterStatus); setPage(1) }}
              style={{ padding: '5px 8px', background: tokens.inputBg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, fontSize: 12, color: tokens.text, fontFamily: tokens.fontFamily, cursor: 'pointer' }}>
              <option value="all">{t('allStatuses')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="processed">{t('processed')}</option>
              <option value="disposed">{t('disposed')}</option>
            </select>
            {(search || filterSession !== 'all' || filterStatus !== 'all') && (
              <button onClick={() => { setSearch(''); setFilterSession('all'); setFilterStatus('all'); setPage(1) }}
                style={{ padding: '5px 10px', background: `${tokens.danger}15`, border: `1px solid ${tokens.danger}40`, borderRadius: tokens.radius, fontSize: 12, color: tokens.danger, cursor: 'pointer', fontFamily: tokens.fontFamily }}>
                {t('reset')}
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: tokens.textMuted, fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            {t('emptyState')}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: tokens.fontFamily }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${tokens.border}` }}>
                    {['ID', t('date'), t('session'), 'Organik (kg)', 'Anorganik (kg)', 'Total (kg)', t('status'), 'PIC'].map((h) => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: tokens.textMuted, fontWeight: 600, whiteSpace: 'nowrap', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((tx, i) => (
                    <tr key={tx.id} style={{ borderBottom: `1px solid ${tokens.border}`, background: i % 2 === 0 ? 'transparent' : `${tokens.border}40`, transition: 'background 0.1s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = `${tokens.primary}10` }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : `${tokens.border}40` }}>
                      <td style={{ padding: '8px 10px', color: tokens.primary, fontWeight: 600 }}>{tx.id}</td>
                      <td style={{ padding: '8px 10px', color: tokens.text, whiteSpace: 'nowrap' }}>{tx.date}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 3,
                          background: tx.session === 'morning' ? `${tokens.chartDomMorning}22` : `${tokens.chartDomAfternoon}22`,
                          color: tx.session === 'morning' ? tokens.chartDomMorning : tokens.chartDomAfternoon,
                        }}>
                          {tx.session === 'morning' ? '☀ Pagi' : '🌅 Sore'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: tokens.text, fontVariantNumeric: 'tabular-nums' }}>{(tx.organicKg ?? 0).toFixed(1)}</td>
                      <td style={{ padding: '8px 10px', color: tokens.text, fontVariantNumeric: 'tabular-nums' }}>{(tx.inorganicKg ?? 0).toFixed(1)}</td>
                      <td style={{ padding: '8px 10px', color: tokens.text, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{(tx.totalKg ?? 0).toFixed(1)}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 3,
                          background: `${STATUS_COLORS[tx.status] || '#3b82f6'}22`, color: STATUS_COLORS[tx.status] || '#3b82f6',
                        }}>{t(tx.status) || tx.status}</span>
                      </td>
                      <td style={{ padding: '8px 10px', color: tokens.textMuted }}>{tx.picName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${tokens.border}`, flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 12, color: tokens.textMuted }}>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '4px 10px', background: tokens.inputBg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, fontSize: 12, color: tokens.text, cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontFamily: tokens.fontFamily }}>
                  ‹
                </button>
                <span style={{ fontSize: 12, color: tokens.textMuted, padding: '4px 8px' }}>{page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: '4px 10px', background: tokens.inputBg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, fontSize: 12, color: tokens.text, cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontFamily: tokens.fontFamily }}>
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Activity */}
      <div style={{ ...cardStyle, marginTop: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: tokens.text, marginBottom: 14 }}>{t('recentActivity')}</div>
        {NOTIFICATIONS.filter((n) => n.type === 'domestic').length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: tokens.textMuted, fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🏠</div>
            Belum ada aktivitas terkini untuk limbah domestik.
          </div>
        ) : (
          NOTIFICATIONS.filter((n) => n.type === 'domestic').map((n) => (
            <div key={n.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${tokens.border}` }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: `${tokens.chartDomMorning}20`, color: tokens.chartDomMorning, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                🏠
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: tokens.text }}>{n.title}</div>
                <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 2 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 4 }}>
                  {new Date(n.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}