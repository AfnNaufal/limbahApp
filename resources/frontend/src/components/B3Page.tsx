import { useState, useMemo, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts'
import { useApp, getPeriodDateRange } from '../context'
import { getB3Transactions, updateB3Transaction, deleteB3Transaction } from '../api'
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery'
import {
  B3_TRANSACTIONS, MONTHLY_B3_IN, MONTHLY_B3_OUT,
  PIE_B3_IN, PIE_B3_OUT, STORAGE_ALERTS, NOTIFICATIONS,
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
  { name: '2020', b3in: 8234.5, b3out: 7123.2 },
  { name: '2021', b3in: 9456.8, b3out: 8234.6 },
  { name: '2022', b3in: 10123.4, b3out: 9012.8 },
  { name: '2023', b3in: 10178.3, b3out: 9079.4 },
  { name: '2024', b3in: 11019.7, b3out: 9291.7 },
]

export default function B3Page() {
  const { tokens, t, theme, search, setSearch, year, periodFilter } = useApp()
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('monthly')
  const [filterCat, setFilterCat] = useState<'all' | 'b3in' | 'b3out'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processed' | 'disposed'>('all')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [page, setPage] = useState(1)
  const [apiData, setApiData] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [editingTx, setEditingTx] = useState<any | null>(null)
  const [deletingTx, setDeletingTx] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({
    weight_kg: '',
    status: 'PENDING',
    source: '',
    destination: '',
    manifest_number: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const PAGE_SIZE = 10

  const recentActivities = useMemo(() => {
    if (apiData && apiData.length > 0) {
      return apiData.slice(0, 5).map((tx) => {
        const isIn = tx.category === 'b3in'
        const type = isIn ? 'b3in' : 'b3out'
        const title = isIn ? 'Transaksi B3 Masuk' : 'Transaksi B3 Keluar'
        const message = `Pencatatan ${tx.type || 'Limbah B3'} (${tx.weightKg} kg)`
        const timestamp = tx.date || new Date().toISOString()
        return { id: tx.id, type, title, message, timestamp }
      })
    }
    return NOTIFICATIONS.filter((n) => n.type === 'b3in' || n.type === 'b3out' || n.type === 'alert')
  }, [apiData])

  const fetchData = () => {
    setLoading(true)
    const periodRange = getPeriodDateRange(year, periodFilter)
    getB3Transactions({
      page,
      per_page: PAGE_SIZE,
      type: filterCat === 'all' ? undefined : filterCat === 'b3in' ? 'IN' : 'OUT',
      status: filterStatus === 'all' ? undefined : filterStatus.toUpperCase(),
      from: filterFrom || periodRange.from,
      to: filterTo || periodRange.to,
    })
      .then((res) => {
        if (res?.data) {
          const mapped = res.data.map((item: any) => ({
            id: `B3-${item.id}`,
            rawId: item.id,
            date: item.date,
            category: item.transaction_type === 'IN' ? 'b3in' : 'b3out',
            type: item.waste_name,
            weightKg: Number(item.weight_kg ?? 0),
            amountKg: Number(item.weight_kg ?? 0),
            status: (item.status || 'pending').toLowerCase(),
            source: item.source || '-',
            destination: item.destination || '-',
            transporter: item.transporter || '-',
            manifest: item.manifest_number || '-',
            scalePhotoUrl: item.scale_photo_url || null,
            notes: item.notes || '',
          }))
          setApiData(mapped)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load B3 transactions:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchData()
  }, [page, filterCat, filterStatus, filterFrom, filterTo, year, periodFilter])

  const handleOpenEdit = (tx: any) => {
    setEditingTx(tx)
    setEditForm({
      weight_kg: String(tx.amountKg ?? tx.weightKg ?? ''),
      status: String(tx.status).toUpperCase(),
      source: tx.source === '-' ? '' : tx.source,
      destination: tx.destination === '-' ? '' : tx.destination,
      manifest_number: tx.manifest === '-' ? '' : tx.manifest,
      notes: tx.notes || '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editingTx) return
    try {
      setSaving(true)
      await updateB3Transaction(editingTx.rawId, {
        weight_kg: Number(editForm.weight_kg),
        status: editForm.status,
        source: editForm.source || null,
        destination: editForm.destination || null,
        manifest_number: editForm.manifest_number || null,
        notes: editForm.notes || null,
      })
      setEditingTx(null)
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Gagal merubah transaksi')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingTx) return
    try {
      setSaving(true)
      await deleteB3Transaction(deletingTx.rawId)
      setDeletingTx(null)
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus transaksi')
    } finally {
      setSaving(false)
    }
  }

  const transactionsList = apiData ?? B3_TRANSACTIONS

  const isGlass = theme === 'frosted' || theme === 'liquid'
  const filtered = useMemo(() => {
    const periodRange = getPeriodDateRange(year, periodFilter)
    return transactionsList.filter((tx) => {
      if (filterCat !== 'all' && tx.category !== filterCat) return false
      if (filterStatus !== 'all' && tx.status !== filterStatus) return false
      if (filterFrom ? tx.date < filterFrom : tx.date < periodRange.from) return false
      if (filterTo ? tx.date > filterTo : tx.date > periodRange.to) return false
      if (search) {
        const s = search.toLowerCase()
        return (
          String(tx.id).toLowerCase().includes(s) ||
          String(tx.type).toLowerCase().includes(s) ||
          String(tx.source).toLowerCase().includes(s) ||
          String(tx.destination).toLowerCase().includes(s) ||
          String(tx.manifest).toLowerCase().includes(s)
        )
      }
      return true
    })
  }, [transactionsList, filterCat, filterStatus, filterFrom, filterTo, search, year, periodFilter])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  const trendData = trendPeriod === 'monthly'
    ? MONTHLY_B3_IN.map((d, i) => ({ name: d.month, b3in: d.value, b3out: MONTHLY_B3_OUT[i]?.value ?? 0 }))
    : trendPeriod === 'yearly'
      ? YEARLY_DATA
      : MONTHLY_B3_IN.slice(0, 4).map((d, i) => ({ name: `W${i + 1}`, b3in: d.value / 4, b3out: (MONTHLY_B3_OUT[i]?.value ?? 0) / 4 }))

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

  const exceeded = STORAGE_ALERTS.filter((a) => a.urgency === 'exceeded')
  const warning = STORAGE_ALERTS.filter((a) => a.urgency === 'warning')

  const chartColumns = isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 220px 1fr'

  return (
    <div style={{ padding: isMobile ? '16px' : '20px 24px', overflowY: 'auto', flex: 1, fontFamily: tokens.fontFamily }}>

      {/* Storage alerts */}
      {STORAGE_ALERTS.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: tokens.text, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={tokens.warning} strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {t('storageAlert')}
            <span style={{ fontSize: 11, background: `${tokens.danger}22`, color: tokens.danger, padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
              {exceeded.length} terlampaui
            </span>
            <span style={{ fontSize: 11, background: `${tokens.warning}22`, color: tokens.warning, padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
              {warning.length} mendekati
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {STORAGE_ALERTS.map((alert) => {
              const urgColor = alert.urgency === 'exceeded' ? tokens.danger : tokens.warning
              const pct = alert.currentStorageKg && alert.storageCapacityKg
                ? Math.min(100, Math.round((alert.currentStorageKg / alert.storageCapacityKg) * 100))
                : 0
              return (
                <div key={alert.id} style={{
                  ...cardStyle,
                  borderLeft: `3px solid ${urgColor}`,
                  padding: '12px 14px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: tokens.text }}>{alert.wasteCode}</div>
                      <div style={{ fontSize: 11, color: tokens.textMuted }}>{alert.type}</div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                      background: `${urgColor}22`, color: urgColor,
                    }}>
                      {alert.urgency === 'exceeded' ? t('exceededLimit') : t('approachingLimit')}
                    </span>
                  </div>
                  {alert.storageCapacityKg && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: tokens.textMuted }}>{t('currentStorage')}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: tokens.text }}>{pct}%</span>
                      </div>
                      <div style={{ height: 6, background: `${urgColor}20`, borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: urgColor, borderRadius: 3, transition: 'width 0.5s' }} />
                      </div>
                      <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 4 }}>
                        {alert.currentStorageKg?.toFixed(1)} / {alert.storageCapacityKg} kg
                        {alert.storageDeadlineDays !== undefined && (
                          <span style={{ marginLeft: 8, color: urgColor, fontWeight: 600 }}>
                            {alert.storageDeadlineDays < 0
                              ? `${Math.abs(alert.storageDeadlineDays)} hari terlampau`
                              : `${alert.storageDeadlineDays} hari tersisa`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: chartColumns, gap: 14, marginBottom: 20 }}>
        {/* Bar: B3 In vs Out */}
        <div style={cardStyle}>
          <div style={{ fontSize: 12, fontWeight: 600, color: tokens.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Perbandingan B3 Masuk vs Keluar (Bulanan)
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MONTHLY_B3_IN.map((d, i) => ({ name: d.month, b3in: d.value, b3out: MONTHLY_B3_OUT[i]?.value ?? 0 }))} barSize={10}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="b3in" fill={tokens.chartB3In} radius={[2, 2, 0, 0]} name="B3 Masuk" />
              <Bar dataKey="b3out" fill={tokens.chartB3Out} radius={[2, 2, 0, 0]} name="B3 Keluar" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ ...cardStyle, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Sumber B3 Masuk
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <PieChart>
                <Pie data={PIE_B3_IN} cx="50%" cy="50%" outerRadius={34} dataKey="value" paddingAngle={2}>
                  {PIE_B3_IN.map((_, i) => (
                    <Cell key={i} fill={[tokens.chartB3In, tokens.chartB3Out, tokens.accent, tokens.warning, tokens.success, '#a78bfa'][i % 6]!} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toFixed(1)}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...cardStyle, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Tujuan B3 Keluar
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <PieChart>
                <Pie data={PIE_B3_OUT} cx="50%" cy="50%" outerRadius={34} dataKey="value" paddingAngle={2}>
                  {PIE_B3_OUT.map((_, i) => (
                    <Cell key={i} fill={[tokens.chartB3Out, tokens.accent, tokens.chartDomMorning, tokens.warning, '#a78bfa'][i % 5]!} />
                  ))}
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
              <Line type="monotone" dataKey="b3in" stroke={tokens.chartB3In} strokeWidth={2} dot={false} name="B3 Masuk" />
              <Line type="monotone" dataKey="b3out" stroke={tokens.chartB3Out} strokeWidth={2} dot={false} name="B3 Keluar" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: tokens.text }}>{t('allTransactions')} — B3</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input type="text" placeholder={t('search')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              style={{ padding: '5px 10px', background: tokens.inputBg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, fontSize: 12, color: tokens.text, fontFamily: tokens.fontFamily, width: isMobile ? '100%' : 180, outline: 'none' }} />
            <select value={filterCat} onChange={(e) => { setFilterCat(e.target.value as typeof filterCat); setPage(1) }}
              style={{ padding: '5px 8px', background: tokens.inputBg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, fontSize: 12, color: tokens.text, fontFamily: tokens.fontFamily, cursor: 'pointer' }}>
              <option value="all">Semua</option>
              <option value="b3in">B3 Masuk</option>
              <option value="b3out">B3 Keluar</option>
            </select>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as typeof filterStatus); setPage(1) }}
              style={{ padding: '5px 8px', background: tokens.inputBg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, fontSize: 12, color: tokens.text, fontFamily: tokens.fontFamily, cursor: 'pointer' }}>
              <option value="all">{t('allStatuses')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="processed">{t('processed')}</option>
              <option value="disposed">{t('disposed')}</option>
            </select>
            <input type="date" value={filterFrom} onChange={(e) => { setFilterFrom(e.target.value); setPage(1) }}
              style={{ padding: '5px 8px', background: tokens.inputBg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, fontSize: 12, color: tokens.text, fontFamily: tokens.fontFamily }} />
            <input type="date" value={filterTo} onChange={(e) => { setFilterTo(e.target.value); setPage(1) }}
              style={{ padding: '5px 8px', background: tokens.inputBg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, fontSize: 12, color: tokens.text, fontFamily: tokens.fontFamily }} />
            {(search || filterCat !== 'all' || filterStatus !== 'all' || filterFrom || filterTo) && (
              <button onClick={() => { setSearch(''); setFilterCat('all'); setFilterStatus('all'); setFilterFrom(''); setFilterTo(''); setPage(1) }}
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
                      <span style={{ fontSize: 13, fontWeight: 700, color: tokens.primary, fontVariantNumeric: 'tabular-nums' }}>{tx.id}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 3,
                        background: `${STATUS_COLORS[tx.status] || '#3b82f6'}22`,
                        color: STATUS_COLORS[tx.status] || '#3b82f6',
                      }}>{t(tx.status) || tx.status}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: tokens.text }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: tx.category === 'b3in' ? tokens.chartB3In : tokens.chartB3Out, flexShrink: 0 }} />
                        {tx.type}
                      </div>
                      <span style={{ fontWeight: 700, color: tokens.text, fontVariantNumeric: 'tabular-nums' }}>
                        {(tx.amountKg ?? tx.weightKg ?? 0).toFixed(1)} kg
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, color: tokens.textMuted }}>
                      <div>📅 {tx.date}</div>
                      <div>📄 Manifest: {tx.manifest}</div>
                      <div>📍 {tx.category === 'b3in' ? `Dari: ${tx.source}` : `Ke: ${tx.destination}`}</div>
                      <div>🚚 Transporter: {tx.transporter}</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 8, borderTop: `1px solid ${tokens.border}` }}>
                      {tx.scalePhotoUrl ? (
                        <img
                          src={tx.scalePhotoUrl}
                          alt="Foto Timbangan"
                          onClick={() => setPreviewImage(tx.scalePhotoUrl)}
                          style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: `1px solid ${tokens.border}` }}
                        />
                      ) : (
                        <span style={{ fontSize: 11, color: tokens.textMuted }}>-</span>
                      )}

                      <div style={{ display: 'flex', gap: 12 }}>
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
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: tokens.fontFamily }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${tokens.border}` }}>
                      {['ID', t('date'), t('type'), t('source'), t('destination'), t('amount'), t('status'), 'Manifest', 'Foto', 'Aksi'].map((h) => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: tokens.textMuted, fontWeight: 600, whiteSpace: 'nowrap', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((tx, i) => (
                      <tr key={tx.id} style={{ borderBottom: `1px solid ${tokens.border}`, background: i % 2 === 0 ? 'transparent' : `${tokens.border}40`, transition: 'background 0.1s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = `${tokens.primary}10` }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : `${tokens.border}40` }}>
                        <td style={{ padding: '8px 10px', color: tokens.primary, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{tx.id}</td>
                        <td style={{ padding: '8px 10px', color: tokens.text, whiteSpace: 'nowrap' }}>{tx.date}</td>
                        <td style={{ padding: '8px 10px', color: tokens.text }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: tx.category === 'b3in' ? tokens.chartB3In : tokens.chartB3Out, flexShrink: 0 }} />
                            {tx.type}
                          </div>
                        </td>
                        <td style={{ padding: '8px 10px', color: tokens.text }}>{tx.source}</td>
                        <td style={{ padding: '8px 10px', color: tokens.text }}>{tx.destination}</td>
                        <td style={{ padding: '8px 10px', color: tokens.text, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                          {(tx.amountKg ?? tx.weightKg ?? 0).toFixed(1)} kg
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 3,
                            background: `${STATUS_COLORS[tx.status] || '#3b82f6'}22`,
                            color: STATUS_COLORS[tx.status] || '#3b82f6',
                          }}>{t(tx.status) || tx.status}</span>
                        </td>
                        <td style={{ padding: '8px 10px', color: tokens.textMuted, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{tx.manifest}</td>
                        <td style={{ padding: '8px 10px' }}>
                          {tx.scalePhotoUrl ? (
                            <img
                              src={tx.scalePhotoUrl}
                              alt="Foto Timbangan"
                              onClick={() => setPreviewImage(tx.scalePhotoUrl)}
                              style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: `1px solid ${tokens.border}` }}
                            />
                          ) : (
                            <span style={{ fontSize: 11, color: tokens.textMuted }}>-</span>
                          )}
                        </td>
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
                Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} data
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '4px 10px', background: tokens.inputBg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, fontSize: 12, color: tokens.text, cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontFamily: tokens.fontFamily }}>
                  ‹ Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                  return (
                    <button key={p} onClick={() => setPage(p)} style={{
                      padding: '4px 8px', background: p === page ? tokens.primary : tokens.inputBg,
                      border: `1px solid ${p === page ? tokens.primary : tokens.border}`,
                      borderRadius: tokens.radius, fontSize: 12,
                      color: p === page ? tokens.textInverse : tokens.text,
                      cursor: 'pointer', fontFamily: tokens.fontFamily, minWidth: 30,
                    }}>{p}</button>
                  )
                })}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: '4px 10px', background: tokens.inputBg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, fontSize: 12, color: tokens.text, cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontFamily: tokens.fontFamily }}>
                  Next ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Activity */}
      <div style={{ ...cardStyle, marginTop: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: tokens.text, marginBottom: 14 }}>{t('recentActivity')}</div>
        {recentActivities.map((n) => (
          <div key={n.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${tokens.border}` }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: n.type === 'alert' ? `${tokens.danger}20` : n.type === 'b3in' ? `${tokens.chartB3In}20` : `${tokens.chartB3Out}20`,
              color: n.type === 'alert' ? tokens.danger : n.type === 'b3in' ? tokens.chartB3In : tokens.chartB3Out,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>
              {n.type === 'alert' ? '⚠' : n.type === 'b3in' ? '↓' : '↑'}
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
        ))}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative', background: tokens.card, border: `1px solid ${tokens.cardBorder}`,
              borderRadius: tokens.radius, padding: 16, maxWidth: '90vw', maxHeight: '90vh',
              boxShadow: tokens.shadow, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}
          >
            <img
              src={previewImage}
              alt="Foto Timbangan Presisi"
              style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: tokens.radius, objectFit: 'contain' }}
            />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              style={{
                padding: '6px 16px', background: tokens.primary, color: tokens.textInverse,
                border: 'none', borderRadius: tokens.radius, cursor: 'pointer', fontSize: 12,
                fontWeight: 600, fontFamily: tokens.fontFamily,
              }}
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}

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
              width: '100%', maxWidth: 480, background: tokens.card, border: `1px solid ${tokens.cardBorder}`,
              borderRadius: tokens.radius, padding: 20, boxShadow: tokens.shadow, display: 'flex', flexDirection: 'column', gap: 14,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: tokens.text }}>Edit Transaksi {editingTx.id}</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, display: 'block', marginBottom: 4 }}>Jumlah Berat (kg)</label>
                <input
                  type="number" step="0.1" min="0"
                  value={editForm.weight_kg}
                  onChange={(e) => setEditForm({ ...editForm, weight_kg: e.target.value })}
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
                  <option value="PENDING">PENDING</option>
                  <option value="RECEIVED">RECEIVED</option>
                  <option value="PROCESSED">PROCESSED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              {editingTx.category === 'b3in' ? (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, display: 'block', marginBottom: 4 }}>Sumber Limbah</label>
                  <input
                    type="text"
                    value={editForm.source}
                    onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', background: tokens.inputBg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, fontSize: 13, color: tokens.text }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, display: 'block', marginBottom: 4 }}>Tujuan Penyerahan</label>
                  <input
                    type="text"
                    value={editForm.destination}
                    onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', background: tokens.inputBg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, fontSize: 13, color: tokens.text }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, display: 'block', marginBottom: 4 }}>Nomor Manifest</label>
                <input
                  type="text"
                  value={editForm.manifest_number}
                  onChange={(e) => setEditForm({ ...editForm, manifest_number: e.target.value })}
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
            <div style={{ fontSize: 16, fontWeight: 700, color: tokens.danger }}>Konfirmasi Hapus Transaksi</div>
            <div style={{ fontSize: 13, color: tokens.text }}>
              Apakah Anda yakin ingin menghapus data transaksi <strong>{deletingTx.id}</strong> ({deletingTx.type})?
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