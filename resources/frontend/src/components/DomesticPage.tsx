import { useState, useMemo, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts'
import { useApp, getPeriodDateRange } from '../context'
import { getDomesticTransactions, updateDomesticTransaction, deleteDomesticTransaction } from '../api'
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery'
import {
  DOMESTIC_TRANSACTIONS, MONTHLY_DOM_MORNING, MONTHLY_DOM_AFTERNOON,
  PIE_DOM_MORNING, PIE_DOM_AFTERNOON, NOTIFICATIONS,
} from '../data'
import EmptyState from './EmptyState'
import SkeletonLoader from './SkeletonLoader'

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
  const { tokens, t, theme, search, setSearch, year, periodFilter } = useApp()
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('monthly')
  const [filterSession, setFilterSession] = useState<'all' | 'morning' | 'afternoon'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processed' | 'disposed'>('all')
  const [page, setPage] = useState(1)
  const [apiData, setApiData] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingTx, setEditingTx] = useState<any | null>(null)
  const [deletingTx, setDeletingTx] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({
    domestic_residue_kg: '',
    status: 'SUBMITTED',
    pic_name: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const PAGE_SIZE = 10

  const recentActivities = useMemo(() => {
    if (apiData && apiData.length > 0) {
      return apiData.slice(0, 5).map((tx) => {
        const sessionLabel = tx.session === 'MORNING' ? 'Sesi Pagi' : (tx.session === 'AFTERNOON' ? 'Sesi Sore' : 'Harian')
        const totalWeight = Number(tx.totalKg || (Number(tx.organicKg || 0) + Number(tx.inorganicKg || 0)))
        const title = `Limbah Domestik (${sessionLabel})`
        const message = `Pencatatan limbah domestik total ${totalWeight.toFixed(1)} kg`
        const timestamp = tx.date || new Date().toISOString()
        return { id: tx.id, type: 'domestic', title, message, timestamp }
      })
    }
    return NOTIFICATIONS.filter((n) => n.type === 'domestic')
  }, [apiData])

  const fetchData = () => {
    setLoading(true)
    const periodRange = getPeriodDateRange(year, periodFilter)
    getDomesticTransactions({
      page,
      per_page: PAGE_SIZE,
      session: filterSession === 'all' ? undefined : (filterSession.toUpperCase() as 'MORNING' | 'AFTERNOON'),
      status: filterStatus === 'all' ? undefined : filterStatus.toUpperCase(),
      from: periodRange.from,
      to: periodRange.to,
    })
      .then((res) => {
        if (res?.data) {
          const mapped = res.data.map((item: any) => ({
            id: `DOM-${item.id}`,
            rawId: item.id,
            date: item.date,
            session: (item.session || 'MORNING').toLowerCase(),
            organicKg: item.organic_weight_kg ?? 0,
            inorganicKg: item.inorganic_weight_kg ?? 0,
            totalKg: item.total_weight_kg ?? (Number(item.organic_weight_kg ?? 0) + Number(item.inorganic_weight_kg ?? 0)),
            picName: item.pic_name || 'Petugas',
            status: item.status || 'SUBMITTED',
            notes: item.notes || '',
          }))
          setApiData(mapped)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load domestic transactions:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchData()
  }, [page, filterSession, filterStatus, year, periodFilter])

  const handleOpenEdit = (tx: any) => {
    setEditingTx(tx)
    setEditForm({
      domestic_residue_kg: String(tx.totalKg || tx.organicKg || 0),
      status: String(tx.status).toUpperCase(),
      pic_name: tx.picName === 'Petugas' ? '' : tx.picName,
      notes: tx.notes === '-' ? '' : tx.notes,
    })
  }

  const handleSaveEdit = async () => {
    if (!editingTx) return
    try {
      setSaving(true)
      await updateDomesticTransaction(editingTx.rawId, {
        domestic_residue_kg: Number(editForm.domestic_residue_kg),
        status: editForm.status,
        pic_name: editForm.pic_name || 'Petugas',
        notes: editForm.notes || null,
      })
      setEditingTx(null)
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan perubahan')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingTx) return
    try {
      setSaving(true)
      await deleteDomesticTransaction(deletingTx.rawId)
      setDeletingTx(null)
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus transaksi')
    } finally {
      setSaving(false)
    }
  }

  const transactionsList = apiData ?? DOMESTIC_TRANSACTIONS
  const isGlass = theme === 'frosted' || theme === 'liquid'

  const filtered = useMemo(() => {
    const periodRange = getPeriodDateRange(year, periodFilter)
    return transactionsList.filter((tx) => {
      if (filterSession !== 'all' && tx.session !== filterSession) return false
      if (filterStatus !== 'all' && tx.status !== filterStatus) return false
      if (tx.date && (tx.date < periodRange.from || tx.date > periodRange.to)) return false
      if (search) {
        const s = search.toLowerCase()
        return (
          String(tx.id).toLowerCase().includes(s) ||
          String(tx.picName || '').toLowerCase().includes(s) ||
          String(tx.processingMethod || tx.processing_method || '').toLowerCase().includes(s) ||
          String(tx.notes || '').toLowerCase().includes(s) ||
          String(tx.session || '').toLowerCase().includes(s)
        )
      }
      return true
    })
  }, [transactionsList, filterSession, filterStatus, search, year, periodFilter])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  const trendData = useMemo(() => {
    if (apiData && apiData.length > 0) {
      const monthMap: Record<string, { morning: number; afternoon: number }> = {}
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      monthNames.forEach((m) => { monthMap[m] = { morning: 0, afternoon: 0 } })

      filtered.forEach((tx) => {
        if (!tx.date) return
        const monthIdx = new Date(tx.date).getMonth()
        const monthName = monthNames[monthIdx] || 'Jan'
        const weight = Number(tx.totalKg ?? (Number(tx.organicKg ?? 0) + Number(tx.inorganicKg ?? 0)))
        if (tx.session === 'morning' || tx.session === 'MORNING') {
          monthMap[monthName].morning += weight
        } else {
          monthMap[monthName].afternoon += weight
        }
      })

      return monthNames.map((m) => ({
        name: m,
        morning: Number(monthMap[m].morning.toFixed(1)),
        afternoon: Number(monthMap[m].afternoon.toFixed(1)),
      }))
    }

    return trendPeriod === 'monthly'
      ? MONTHLY_DOM_MORNING.map((d, i) => ({ name: d.month, morning: d.value, afternoon: MONTHLY_DOM_AFTERNOON[i]?.value ?? 0 }))
      : trendPeriod === 'yearly'
        ? YEARLY_DATA
        : MONTHLY_DOM_MORNING.slice(0, 4).map((d, i) => ({ name: `W${i + 1}`, morning: d.value / 4, afternoon: (MONTHLY_DOM_AFTERNOON[i]?.value ?? 0) / 4 }))
  }, [apiData, filtered, trendPeriod])

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

      {/* Grid Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: chartColumns, gap: 16, marginBottom: 20 }}>
        {/* Main Bar Chart */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 700, color: tokens.text, marginBottom: 12 }}>
            {t('domesticMonthlyTrend')}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData} barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(val) => [`${Number(val).toLocaleString('id-ID')} kg`, '']} />
              <Bar dataKey="morning" fill={tokens.chartDomMorning} radius={[3, 3, 0, 0]} name="Sesi Pagi (kg)" />
              <Bar dataKey="afternoon" fill={tokens.chartDomAfternoon} radius={[3, 3, 0, 0]} name="Sesi Sore (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toLocaleString('id-ID')} kg`, '']} />
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
                <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toLocaleString('id-ID')} kg`, '']} />
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
              <Tooltip {...tooltipStyle} formatter={(val) => [`${Number(val).toLocaleString('id-ID')} kg`, '']} />
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

        {loading && !apiData ? (
          <SkeletonLoader rows={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Tidak Ada Transaksi Domestik"
            message={search ? `Tidak ada data transaksi Domestik yang cocok dengan kata kunci "${search}".` : 'Belum ada transaksi Limbah Domestik yang tersimpan untuk filter saat ini.'}
            icon={search ? 'search' : 'empty'}
          />
        ) : (
          <>
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {paginated.map((tx) => (
                  <div
                    key={tx.id}
                    style={{
                      background: tokens.inputBg,
                      border: `1px solid ${tokens.border}`,
                      borderRadius: tokens.radius,
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: tokens.primary }}>{tx.id}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 3,
                        background: tx.session === 'morning' ? `${tokens.chartDomMorning}22` : `${tokens.chartDomAfternoon}22`,
                        color: tx.session === 'morning' ? tokens.chartDomMorning : tokens.chartDomAfternoon,
                      }}>
                        {tx.session === 'morning' ? '☀ Pagi' : '🌅 Sore'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      <span style={{ color: tokens.textMuted }}>📅 {tx.date}</span>
                      <span style={{ fontWeight: 700, color: tokens.text, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                        Total: {(tx.totalKg ?? 0).toFixed(1)} kg
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, color: tokens.textMuted }}>
                      <div>🌱 Organik: {(tx.organicKg ?? 0).toFixed(1)} kg</div>
                      <div>📦 Anorganik: {(tx.inorganicKg ?? 0).toFixed(1)} kg</div>
                      <div>👤 PIC: {tx.picName}</div>
                      <div>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 3,
                          background: `${STATUS_COLORS[tx.status] || '#3b82f6'}22`, color: STATUS_COLORS[tx.status] || '#3b82f6',
                        }}>{t(tx.status) || tx.status}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4, paddingTop: 8, borderTop: `1px solid ${tokens.border}` }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(tx)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: tokens.primary, fontWeight: 600 }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTx(tx)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: tokens.danger, fontWeight: 600 }}
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: tokens.fontFamily }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${tokens.border}` }}>
                      {['ID', t('date'), t('session'), 'Organik (kg)', 'Anorganik (kg)', 'Total (kg)', t('status'), 'PIC', 'Aksi'].map((h) => (
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
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(tx)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, marginRight: 8, color: tokens.primary, fontWeight: 600 }}
                            title="Edit Transaksi"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTx(tx)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: tokens.danger, fontWeight: 600 }}
                            title="Hapus Transaksi"
                          >
                            🗑️ Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
        {recentActivities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: tokens.textMuted, fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🏠</div>
            Belum ada aktivitas terkini untuk limbah domestik.
          </div>
        ) : (
          recentActivities.map((n) => (
            <div key={n.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${tokens.border}` }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: `${tokens.chartDomMorning}20`, color: tokens.chartDomMorning, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                🏠
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: tokens.text }}>{n.title}</div>
                <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 2 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 4 }}>
                  {(() => {
                    try {
                      const d = new Date(n.timestamp)
                      if (isNaN(d.getTime())) return n.timestamp
                      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    } catch {
                      return n.timestamp
                    }
                  })()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingTx && (
        <div
          onClick={() => setEditingTx(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 110,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 460, background: tokens.card, border: `1px solid ${tokens.cardBorder}`,
              borderRadius: tokens.radius, padding: 20, boxShadow: tokens.shadow, display: 'flex', flexDirection: 'column', gap: 14,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: tokens.text }}>Edit Transaksi {editingTx.id}</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, display: 'block', marginBottom: 4 }}>Total Sampah / Residu (kg)</label>
                <input
                  type="number" step="0.1" min="0"
                  value={editForm.domestic_residue_kg}
                  onChange={(e) => setEditForm({ ...editForm, domestic_residue_kg: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', background: tokens.inputBg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, fontSize: 13, color: tokens.text }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, display: 'block', marginBottom: 4 }}>Status Transaksi</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', background: tokens.inputBg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, fontSize: 13, color: tokens.text }}
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, display: 'block', marginBottom: 4 }}>Nama Petugas (PIC)</label>
                <input
                  type="text"
                  value={editForm.pic_name}
                  onChange={(e) => setEditForm({ ...editForm, pic_name: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', background: tokens.inputBg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, fontSize: 13, color: tokens.text }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, display: 'block', marginBottom: 4 }}>Catatan</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={2}
                  style={{ width: '100%', padding: '7px 10px', background: tokens.inputBg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, fontSize: 13, color: tokens.text, resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                style={{ padding: '7px 14px', background: tokens.inputBg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, fontSize: 12, color: tokens.text, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                style={{ padding: '7px 14px', background: tokens.primary, border: 'none', borderRadius: tokens.radius, fontSize: 12, color: tokens.textInverse, fontWeight: 600, cursor: saving ? 'wait' : 'pointer' }}
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTx && (
        <div
          onClick={() => setDeletingTx(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 110,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 400, background: tokens.card, border: `1px solid ${tokens.cardBorder}`,
              borderRadius: tokens.radius, padding: 20, boxShadow: tokens.shadow, display: 'flex', flexDirection: 'column', gap: 14,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: tokens.danger }}>Konfirmasi Hapus Transaksi Domestik</div>
            <div style={{ fontSize: 13, color: tokens.text }}>
              Apakah Anda yakin ingin menghapus data <strong>{deletingTx.id}</strong> (Total: {deletingTx.totalKg} kg)?
            </div>
            <div style={{ fontSize: 11, color: tokens.textMuted }}>
              Data ini akan diarsipkan (soft delete) dan tetap tersimpan di database untuk audit.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setDeletingTx(null)}
                style={{ padding: '7px 14px', background: tokens.inputBg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, fontSize: 12, color: tokens.text, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={saving}
                style={{ padding: '7px 14px', background: tokens.danger, border: 'none', borderRadius: tokens.radius, fontSize: 12, color: '#fff', fontWeight: 600, cursor: saving ? 'wait' : 'pointer' }}
              >
                {saving ? 'Menghapus...' : 'Ya, Hapus Transaksi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}