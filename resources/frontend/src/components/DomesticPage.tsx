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
import DomesticFilterBar from './domestic/DomesticFilterBar'
import DomesticTable from './domestic/DomesticTable'
import DomesticEditModal from './domestic/DomesticEditModal'
import DomesticDeleteModal from './domestic/DomesticDeleteModal'

type TrendPeriod = 'weekly' | 'monthly' | 'yearly'

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
        const isMorning = tx.session === 'MORNING' || tx.session === 'morning'
        const title = isMorning ? 'Sesi Pagi Selesai' : 'Sesi Sore Selesai'
        const message = `Pencatatan total ${(tx.totalKg ?? tx.total_weight_kg ?? 0).toFixed(1)} kg (${(tx.organicKg ?? tx.organic_weight_kg ?? 0).toFixed(1)} kg organik)`
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
      session: filterSession === 'all' ? undefined : filterSession.toUpperCase() as 'MORNING' | 'AFTERNOON',
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
            session: item.session === 'MORNING' ? 'morning' : 'afternoon',
            organicKg: Number(item.organic_weight_kg ?? 0),
            inorganicKg: Number(item.inorganic_weight_kg ?? 0),
            totalKg: Number(item.total_weight_kg ?? 0),
            status: (item.status || 'SUBMITTED').toLowerCase(),
            picName: item.pic_name || 'Petugas',
            notes: item.notes || '',
          }))
          setApiData(mapped)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load Domestic transactions:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchData()
  }, [page, filterSession, filterStatus, year, periodFilter])

  const handleOpenEdit = (tx: any) => {
    setEditingTx(tx)
    setEditForm({
      domestic_residue_kg: String(tx.domestic_residue_kg ?? ''),
      status: String(tx.status).toUpperCase(),
      pic_name: tx.picName || tx.pic_name || '',
      notes: tx.notes || '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editingTx) return
    try {
      setSaving(true)
      await updateDomesticTransaction(editingTx.rawId, {
        status: editForm.status,
        pic_name: editForm.pic_name,
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
      if (tx.date < periodRange.from || tx.date > periodRange.to) return false
      if (search) {
        const s = search.toLowerCase()
        return (
          String(tx.id).toLowerCase().includes(s) ||
          String(tx.picName || tx.pic_name).toLowerCase().includes(s) ||
          String(tx.notes).toLowerCase().includes(s)
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
        const weight = Number(tx.totalKg ?? tx.total_weight_kg ?? 0)
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
            {t('domMonthlyTrend')}
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

        {/* Pie Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...cardStyle, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Rasio Organik / Anorganik
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <PieChart>
                <Pie data={PIE_DOM_MORNING} cx="50%" cy="50%" outerRadius={34} dataKey="value" paddingAngle={2}>
                  {PIE_DOM_MORNING.map((_, i) => (
                    <Cell key={i} fill={[tokens.chartDomMorning, tokens.chartDomAfternoon][i % 2]!} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(val, name) => [`${Number(val).toLocaleString('id-ID')} kg`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...cardStyle, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Distribusi per Sesi
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <PieChart>
                <Pie data={PIE_DOM_AFTERNOON} cx="50%" cy="50%" outerRadius={34} dataKey="value" paddingAngle={2}>
                  {PIE_DOM_AFTERNOON.map((_, i) => (
                    <Cell key={i} fill={[tokens.chartDomMorning, tokens.chartDomAfternoon][i % 2]!} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(val, name) => [`${Number(val).toLocaleString('id-ID')} kg`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend Line */}
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

      {/* Table Section */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: tokens.text }}>{t('allTransactions')} — Domestik</div>
          <DomesticFilterBar
            filterSession={filterSession}
            setFilterSession={(val) => { setFilterSession(val); setPage(1) }}
            filterStatus={filterStatus}
            setFilterStatus={(val) => { setFilterStatus(val); setPage(1) }}
            onReset={() => { setSearch(''); setFilterSession('all'); setFilterStatus('all'); setPage(1) }}
          />
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
          <DomesticTable
            paginated={paginated}
            filteredCount={filtered.length}
            page={page}
            totalPages={totalPages}
            setPage={setPage}
            pageSize={PAGE_SIZE}
            onEdit={handleOpenEdit}
            onDelete={(tx) => setDeletingTx(tx)}
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
              background: `${tokens.chartDomMorning}20`,
              color: tokens.chartDomMorning,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>
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
        ))}
      </div>

      {/* Edit Modal */}
      <DomesticEditModal
        editingTx={editingTx}
        editForm={editForm}
        setEditForm={setEditForm}
        onClose={() => setEditingTx(null)}
        onSave={handleSaveEdit}
        saving={saving}
      />

      {/* Delete Confirmation Modal */}
      <DomesticDeleteModal
        deletingTx={deletingTx}
        onClose={() => setDeletingTx(null)}
        onConfirm={handleConfirmDelete}
        saving={saving}
      />
    </div>
  )
}