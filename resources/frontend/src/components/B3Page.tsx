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
import EmptyState from './EmptyState'
import SkeletonLoader from './SkeletonLoader'
import B3StorageAlerts from './b3/B3StorageAlerts'
import B3FilterBar from './b3/B3FilterBar'
import B3Table from './b3/B3Table'
import B3EditModal from './b3/B3EditModal'
import B3DeleteModal from './b3/B3DeleteModal'

type TrendPeriod = 'weekly' | 'monthly' | 'yearly'

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
      page: 1,
      per_page: 1000,
      type: filterCat === 'all' ? undefined : filterCat === 'b3in' ? 'IN' : 'OUT',
      status: filterStatus === 'all' ? undefined : filterStatus.toUpperCase(),
      search: search || undefined,
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
  }, [filterCat, filterStatus, filterFrom, filterTo, search, year, periodFilter])

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

  const trendData = useMemo(() => {
    if (apiData !== null) {
      const monthMap: Record<string, { b3in: number; b3out: number }> = {}
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      monthNames.forEach((m) => { monthMap[m] = { b3in: 0, b3out: 0 } })

      filtered.forEach((tx) => {
        if (!tx.date) return
        const monthIdx = new Date(tx.date).getMonth()
        const monthName = monthNames[monthIdx] || 'Jan'
        const weight = Number(tx.amountKg ?? tx.weightKg ?? 0)
        if (tx.category === 'b3in') {
          monthMap[monthName].b3in += weight
        } else {
          monthMap[monthName].b3out += weight
        }
      })

      return monthNames.map((m) => ({
        name: m,
        b3in: Number(monthMap[m].b3in.toFixed(1)),
        b3out: Number(monthMap[m].b3out.toFixed(1)),
      }))
    }

    return trendPeriod === 'monthly'
      ? MONTHLY_B3_IN.map((d, i) => ({ name: d.month, b3in: d.value, b3out: MONTHLY_B3_OUT[i]?.value ?? 0 }))
      : trendPeriod === 'yearly'
        ? YEARLY_DATA
        : MONTHLY_B3_IN.slice(0, 4).map((d, i) => ({ name: `W${i + 1}`, b3in: d.value / 4, b3out: (MONTHLY_B3_OUT[i]?.value ?? 0) / 4 }))
  }, [apiData, filtered, trendPeriod])

  const dynamicPieIn = useMemo(() => {
    if (apiData !== null) {
      const catMap: Record<string, number> = {}
      filtered.filter((tx) => tx.category === 'b3in').forEach((tx) => {
        const name = tx.type || 'Limbah B3'
        catMap[name] = (catMap[name] || 0) + Number(tx.amountKg ?? tx.weightKg ?? 0)
      })
      const entries = Object.entries(catMap).map(([name, value]) => ({ name, value: Number(value.toFixed(1)) }))
      if (entries.length > 0) return entries
      return [{ name: 'Belum ada data', value: 0 }]
    }
    return PIE_B3_IN
  }, [apiData, filtered])

  const dynamicPieOut = useMemo(() => {
    if (apiData !== null) {
      const destMap: Record<string, number> = {}
      filtered.filter((tx) => tx.category === 'b3out').forEach((tx) => {
        const name = tx.destination || 'Pihak Ke-3'
        destMap[name] = (destMap[name] || 0) + Number(tx.amountKg ?? tx.weightKg ?? 0)
      })
      const entries = Object.entries(destMap).map(([name, value]) => ({ name, value: Number(value.toFixed(1)) }))
      if (entries.length > 0) return entries
      return [{ name: 'Belum ada data', value: 0 }]
    }
    return PIE_B3_OUT
  }, [apiData, filtered])

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

      {/* Storage alerts */}
      <B3StorageAlerts alerts={STORAGE_ALERTS as any} />

      {/* Grid Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: chartColumns, gap: 16, marginBottom: 20 }}>
        {/* Main Bar Chart */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 700, color: tokens.text, marginBottom: 12 }}>
            {t('b3MonthlyTrend')}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData} barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tokens.textMuted, fontFamily: tokens.fontFamily }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(val) => [`${Number(val).toLocaleString('id-ID')} kg`, '']} />
              <Bar dataKey="b3in" fill={tokens.chartB3In} radius={[3, 3, 0, 0]} name="B3 Masuk (kg)" />
              <Bar dataKey="b3out" fill={tokens.chartB3Out} radius={[3, 3, 0, 0]} name="B3 Keluar (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...cardStyle, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Komposisi B3 Masuk
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <PieChart>
                <Pie data={dynamicPieIn} cx="50%" cy="50%" outerRadius={34} dataKey="value" paddingAngle={2}>
                  {dynamicPieIn.map((_, i) => (
                    <Cell key={i} fill={[tokens.chartB3In, tokens.chartB3Out, tokens.accent, tokens.warning, tokens.success, '#a78bfa'][i % 6]!} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(val, name) => [`${Number(val).toLocaleString('id-ID')} kg`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...cardStyle, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Tujuan B3 Keluar
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <PieChart>
                <Pie data={dynamicPieOut} cx="50%" cy="50%" outerRadius={34} dataKey="value" paddingAngle={2}>
                  {dynamicPieOut.map((_, i) => (
                    <Cell key={i} fill={[tokens.chartB3Out, tokens.accent, tokens.chartDomMorning, tokens.warning, '#a78bfa'][i % 5]!} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(val, name) => [`${Number(val).toLocaleString('id-ID')} kg`, name]} />
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
              <Line type="monotone" dataKey="b3in" stroke={tokens.chartB3In} strokeWidth={2} dot={false} name="B3 Masuk" />
              <Line type="monotone" dataKey="b3out" stroke={tokens.chartB3Out} strokeWidth={2} dot={false} name="B3 Keluar" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table Section */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: tokens.text }}>{t('allTransactions')} — B3</div>
          <B3FilterBar
            filterCat={filterCat}
            setFilterCat={(val) => { setFilterCat(val); setPage(1) }}
            filterStatus={filterStatus}
            setFilterStatus={(val) => { setFilterStatus(val); setPage(1) }}
            filterFrom={filterFrom}
            setFilterFrom={(val) => { setFilterFrom(val); setPage(1) }}
            filterTo={filterTo}
            setFilterTo={(val) => { setFilterTo(val); setPage(1) }}
            onReset={() => { setSearch(''); setFilterCat('all'); setFilterStatus('all'); setFilterFrom(''); setFilterTo(''); setPage(1) }}
          />
        </div>

        {loading && !apiData ? (
          <SkeletonLoader rows={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Tidak Ada Transaksi B3"
            message={search ? `Tidak ada data transaksi B3 yang cocok dengan kata kunci "${search}".` : 'Belum ada transaksi Limbah B3 yang tersimpan untuk filter saat ini.'}
            icon={search ? 'search' : 'empty'}
          />
        ) : (
          <B3Table
            paginated={paginated}
            filteredCount={filtered.length}
            page={page}
            totalPages={totalPages}
            setPage={setPage}
            pageSize={PAGE_SIZE}
            onEdit={handleOpenEdit}
            onDelete={(tx) => setDeletingTx(tx)}
            onPreviewImage={(url) => setPreviewImage(url)}
          />
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
      <B3EditModal
        editingTx={editingTx}
        editForm={editForm}
        setEditForm={setEditForm}
        onClose={() => setEditingTx(null)}
        onSave={handleSaveEdit}
        saving={saving}
      />

      {/* Delete Confirmation Modal */}
      <B3DeleteModal
        deletingTx={deletingTx}
        onClose={() => setDeletingTx(null)}
        onConfirm={handleConfirmDelete}
        saving={saving}
      />
    </div>
  )
}