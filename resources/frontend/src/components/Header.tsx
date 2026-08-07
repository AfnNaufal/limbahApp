import { useState, useRef, useEffect } from 'react'
import { useApp, getPeriodDateRange, type PageId } from '../context'
import { NOTIFICATIONS, B3_TRANSACTIONS, DOMESTIC_TRANSACTIONS } from '../data'
import { getNotifications, getB3Transactions, getDomesticTransactions, markNotificationAsRead } from '../api'
import { useIsMobile } from '../hooks/useMediaQuery'
import { exportToCSV, exportToPrintPDF } from '../utils/exportUtils'

const PAGE_TITLES: Record<PageId, string> = {
  dashboard: 'dashboard',
  b3: 'b3Waste',
  domestic: 'domesticWaste',
  'b3-in': 'menuB3In',
  'b3-out': 'menuB3Out',
  'waste-in': 'menuWasteIn',
  'waste-out': 'menuWasteOut',
  settings: 'settings',
}

interface DisplayNotification {
  id: number | string
  type: string
  title: string
  message: string
  read: boolean
  timestamp: string
}

function NotificationPanel({
  tokens,
  isMobile,
  notes,
  setNotes,
}: {
  tokens: ReturnType<typeof useApp>['tokens']
  isMobile: boolean
  notes: DisplayNotification[]
  setNotes: React.Dispatch<React.SetStateAction<DisplayNotification[]>>
}) {
  const { t } = useApp()
  const unread = notes.filter((n) => !n.read).length

  const typeColor: Record<string, string> = {
    b3in: tokens.chartB3In,
    b3out: tokens.chartB3Out,
    domestic: tokens.chartDomMorning,
    alert: tokens.danger,
    B3_RECEIVED: tokens.chartB3In,
    B3_DISPATCHED: tokens.chartB3Out,
    B3_EXPIRED: tokens.danger,
    DOMESTIC_SUBMITTED: tokens.chartDomMorning,
    ALERT: tokens.danger,
  }

  const typeIcon: Record<string, string> = {
    b3in: '↓',
    b3out: '↑',
    domestic: '🏠',
    alert: '⚠',
    B3_RECEIVED: '↓',
    B3_DISPATCHED: '↑',
    B3_EXPIRED: '⚠',
    DOMESTIC_SUBMITTED: '🏠',
    ALERT: '⚠',
  }

  const handleMarkAllRead = async () => {
    const unreadItems = notes.filter((n) => !n.read)
    setNotes((prev) => prev.map((x) => ({ ...x, read: true })))
    try {
      await Promise.all(unreadItems.map((item) => markNotificationAsRead(item.id)))
    } catch {
      // Non-blocking fallback
    }
  }

  const handleMarkItemRead = async (n: DisplayNotification) => {
    if (n.read) return
    setNotes((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    try {
      await markNotificationAsRead(n.id)
    } catch {
      // Non-blocking fallback
    }
  }

  const formatDate = (ts: string) => {
    try {
      const d = new Date(ts)
      if (isNaN(d.getTime())) return ts
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    } catch {
      return ts
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: 8,
        width: isMobile ? 'min(340px, calc(100vw - 28px))' : 340,
        maxWidth: 'calc(100vw - 28px)',
        background: tokens.card,
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: tokens.radius,
        boxShadow: `0 8px 32px rgba(0,0,0,0.15)`,
        backdropFilter: tokens.glassBlur,
        WebkitBackdropFilter: tokens.glassBlur,
        overflow: 'hidden',
        zIndex: 100,
        fontFamily: tokens.fontFamily,
      }}
    >
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${tokens.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: tokens.text }}>
          {t('notifications')}
          {unread > 0 && (
            <span style={{ marginLeft: 8, background: tokens.danger, color: '#fff', fontSize: 11, padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>
              {unread}
            </span>
          )}
        </div>
        <button
          onClick={handleMarkAllRead}
          style={{ fontSize: 11, color: tokens.primary, background: 'none', border: 'none', cursor: 'pointer', fontFamily: tokens.fontFamily }}
        >
          {t('markAllRead')}
        </button>
      </div>

      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {notes.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: tokens.textMuted, fontSize: 13 }}>{t('noNotifications')}</div>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${tokens.border}`,
                background: n.read ? 'transparent' : `${tokens.primary}08`,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onClick={() => handleMarkItemRead(n)}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: `${typeColor[n.type] ?? tokens.primary}20`,
                  color: typeColor[n.type] ?? tokens.primary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, flexShrink: 0, fontWeight: 700,
                }}>
                  {typeIcon[n.type] ?? '•'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: tokens.text }}>{n.title}</span>
                    {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: tokens.primary, flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: 12, color: tokens.textMuted, lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 4 }}>
                    {formatDate(n.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function Header() {
  const { tokens, page, setPage, t, theme, sidebarOpen, setSidebarOpen, search, setSearch, year, setYear, periodFilter, setPeriodFilter, user, logout } = useApp()
  const [showNotif, setShowNotif] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [notes, setNotes] = useState<DisplayNotification[]>(
    NOTIFICATIONS.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: Boolean(n.read),
      timestamp: n.timestamp ?? new Date().toISOString(),
    }))
  )
  const notifRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  const fetchLatestNotifications = () => {
    getNotifications({ include_read: true, per_page: 20 })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setNotes(
            data.map((n) => ({
              id: n.id,
              type: n.type,
              title: n.title,
              message: n.message,
              read: Boolean(n.is_read ?? n.read),
              timestamp: n.created_at ?? n.timestamp ?? new Date().toISOString(),
            }))
          )
        }
      })
      .catch(() => {
        // Safe fallback to initial state
      })
  }

  useEffect(() => {
    fetchLatestNotifications()
    const interval = setInterval(fetchLatestNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const unreadCount = notes.filter((n) => !n.read).length

  const isGlass = theme === 'frosted' || theme === 'liquid'

  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleExport = async (format: 'csv' | 'pdf') => {
    setShowExportMenu(false)
    const periodRange = getPeriodDateRange(year, periodFilter)
    const periodLabel = `${periodFilter === 'all' ? '1 Tahun' : periodFilter} ${year}`

    let title = 'Laporan Data Limbah'
    let headers: string[] = []
    let rows: (string | number)[][] = []

    if (page === 'b3' || page === 'b3-in' || page === 'b3-out') {
      title = 'Laporan Transaksi Limbah B3'
      headers = ['ID', 'Tanggal', 'Jenis Limbah', 'Kategori', 'Berat (kg)', 'Status', 'Sumber', 'Tujuan', 'Manifest', 'Transporter']
      try {
        const res = await getB3Transactions({
          per_page: 500,
          from: periodRange.from,
          to: periodRange.to,
        })
        const list = res?.data || B3_TRANSACTIONS
        const filtered = list.filter((tx: any) => {
          if (search) {
            const s = search.toLowerCase()
            return (
              String(tx.id).toLowerCase().includes(s) ||
              String(tx.waste_name || tx.type || '').toLowerCase().includes(s) ||
              String(tx.source || '').toLowerCase().includes(s) ||
              String(tx.destination || '').toLowerCase().includes(s) ||
              String(tx.manifest_number || tx.manifest || '').toLowerCase().includes(s)
            )
          }
          return true
        })

        rows = filtered.map((tx: any) => [
          tx.id ? `B3-${tx.id}` : (tx.id || '-'),
          tx.date || '-',
          tx.waste_name || tx.type || '-',
          tx.transaction_type === 'IN' || tx.category === 'b3in' ? 'Masuk (IN)' : 'Keluar (OUT)',
          Number(tx.weight_kg ?? tx.weightKg ?? tx.amountKg ?? 0).toFixed(1),
          tx.status || 'pending',
          tx.source || '-',
          tx.destination || '-',
          tx.manifest_number || tx.manifest || '-',
          tx.transporter || '-',
        ])
      } catch {
        rows = []
      }
    } else {
      title = 'Laporan Transaksi Limbah Domestik'
      headers = ['ID', 'Tanggal', 'Sesi', 'Organik (kg)', 'Anorganik (kg)', 'Total (kg)', 'Status', 'PIC', 'Catatan']
      try {
        const res = await getDomesticTransactions({
          per_page: 500,
          from: periodRange.from,
          to: periodRange.to,
        })
        const list = res?.data || DOMESTIC_TRANSACTIONS
        const filtered = list.filter((tx: any) => {
          if (search) {
            const s = search.toLowerCase()
            return (
              String(tx.id).toLowerCase().includes(s) ||
              String(tx.pic_name || tx.picName || '').toLowerCase().includes(s) ||
              String(tx.notes || '').toLowerCase().includes(s)
            )
          }
          return true
        })

        rows = filtered.map((tx: any) => [
          tx.id ? `DOM-${tx.id}` : (tx.id || '-'),
          tx.date || '-',
          tx.session === 'MORNING' || tx.session === 'morning' ? 'Pagi' : 'Sore',
          Number(tx.organic_weight_kg ?? tx.organicKg ?? 0).toFixed(1),
          Number(tx.inorganic_weight_kg ?? tx.inorganicKg ?? 0).toFixed(1),
          Number(tx.total_weight_kg ?? tx.totalKg ?? 0).toFixed(1),
          tx.status || 'SUBMITTED',
          tx.pic_name || tx.picName || 'Petugas',
          tx.notes || '-',
        ])
      } catch {
        rows = []
      }
    }

    if (rows.length === 0) {
      alert('Tidak ada data transaksi yang cocok dengan filter saat ini untuk diekspor.')
      return
    }

    if (format === 'csv') {
      const filename = `${title.replace(/\s+/g, '_')}_${periodLabel.replace(/\s+/g, '_')}`
      exportToCSV(filename, headers, rows)
    } else {
      exportToPrintPDF(title, periodLabel, headers, rows)
    }
  }

  const exportBtn = (
    <div ref={exportRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setShowExportMenu((v) => !v)}
        title="Ekspor / Cetak Laporan"
        style={{
          padding: isMobile ? '5px 8px' : '5px 12px',
          background: `${tokens.primary}15`,
          border: `1px solid ${tokens.primary}40`,
          borderRadius: tokens.radius,
          color: tokens.primary,
          fontSize: isMobile ? 12 : 13,
          fontWeight: 600,
          fontFamily: tokens.fontFamily,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>📥 Ekspor</span>
      </button>
      {showExportMenu && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 6,
            background: tokens.card,
            border: `1px solid ${tokens.cardBorder}`,
            borderRadius: tokens.radius,
            boxShadow: tokens.shadow,
            padding: '6px 0',
            minWidth: 150,
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <button
            onClick={() => handleExport('csv')}
            style={{
              padding: '8px 14px',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              color: tokens.text,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: tokens.fontFamily,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${tokens.primary}12` }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <span>📊 Excel / CSV</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            style={{
              padding: '8px 14px',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              color: tokens.text,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: tokens.fontFamily,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${tokens.primary}12` }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <span>📄 Cetak PDF</span>
          </button>
        </div>
      )}
    </div>
  )

  const searchInput = (
    <>
      <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }}
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tokens.text} strokeWidth="2">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        placeholder={t('search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus={isMobile}
        style={{
          width: '100%',
          padding: search ? '6px 28px 6px 32px' : '6px 12px 6px 32px',
          background: tokens.inputBg,
          border: `1px solid ${tokens.border}`,
          borderRadius: tokens.radius,
          fontSize: 13,
          color: tokens.text,
          fontFamily: tokens.fontFamily,
          outline: 'none',
        }}
      />
      {search && (
        <button
          onClick={() => setSearch('')}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: tokens.textMuted,
            cursor: 'pointer',
            fontSize: 12,
            lineHeight: 1,
            padding: '2px 4px',
          }}
          title="Clear search"
        >
          ✕
        </button>
      )}
    </>
  )

  const yearSelect = (
    <select
      value={year}
      onChange={(e) => setYear(e.target.value)}
      style={{
        padding: isMobile ? '5px 4px' : '5px 10px',
        background: tokens.inputBg,
        border: `1px solid ${tokens.border}`,
        borderRadius: tokens.radius,
        color: tokens.text,
        fontSize: isMobile ? 12 : 13,
        fontFamily: tokens.fontFamily,
        cursor: 'pointer',
        outline: 'none',
        flexShrink: 0,
        width: isMobile ? 74 : undefined,
      }}
    >
      {(() => {
        const currentYear = new Date().getFullYear()
        const yearOptions = Array.from({ length: 6 }, (_, i) => (currentYear - 4 + i).toString())
        if (year && !yearOptions.includes(year)) {
          yearOptions.push(year)
          yearOptions.sort()
        }
        return yearOptions.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))
      })()}
    </select>
  )

  const periodSelect = (
    <select
      value={periodFilter}
      onChange={(e) => setPeriodFilter(e.target.value)}
      style={{
        padding: isMobile ? '5px 4px' : '5px 10px',
        background: tokens.inputBg,
        border: `1px solid ${tokens.border}`,
        borderRadius: tokens.radius,
        color: tokens.text,
        fontSize: isMobile ? 12 : 13,
        fontFamily: tokens.fontFamily,
        cursor: 'pointer',
        outline: 'none',
        flexShrink: 0,
        maxWidth: isMobile ? 110 : undefined,
      }}
    >
      <option value="all">Semua Periode</option>
      <optgroup label="Kuartal">
        <option value="Q1">Q1 (Jan - Mar)</option>
        <option value="Q2">Q2 (Apr - Jun)</option>
        <option value="Q3">Q3 (Jul - Sep)</option>
        <option value="Q4">Q4 (Okt - Des)</option>
      </optgroup>
      <optgroup label="Bulan">
        <option value="01">Januari</option>
        <option value="02">Februari</option>
        <option value="03">Maret</option>
        <option value="04">April</option>
        <option value="05">Mei</option>
        <option value="06">Juni</option>
        <option value="07">Juli</option>
        <option value="08">Agustus</option>
        <option value="09">September</option>
        <option value="10">Oktober</option>
        <option value="11">November</option>
        <option value="12">Desember</option>
      </optgroup>
    </select>
  )

  const notifBell = (
    <div ref={notifRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setShowNotif((v) => !v)}
        style={{
          width: 34, height: 34,
          borderRadius: '50%',
          border: `1px solid ${tokens.border}`,
          background: showNotif ? `${tokens.primary}18` : tokens.inputBg,
          color: tokens.text,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.15s',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            width: 15, height: 15,
            background: tokens.danger, color: '#fff',
            borderRadius: '50%', fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{unreadCount}</span>
        )}
      </button>
      {showNotif && <NotificationPanel tokens={tokens} isMobile={isMobile} notes={notes} setNotes={setNotes} />}
    </div>
  )

  const getInitials = (name?: string) => {
    if (!name) return 'US'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  const logoutModal = showLogoutConfirm ? (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '16px',
      }}
      onClick={() => !isLoggingOut && setShowLogoutConfirm(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '380px',
          background: tokens.card,
          border: `1px solid ${tokens.cardBorder}`,
          borderRadius: tokens.radius,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          padding: '24px',
          textAlign: 'center',
          fontFamily: tokens.fontFamily,
          color: tokens.text,
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: `${tokens.danger}18`,
            color: tokens.danger,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: tokens.text }}>
          Konfirmasi Keluar
        </h3>
        <p style={{ fontSize: '13px', color: tokens.textMuted, margin: '0 0 24px', lineHeight: 1.5 }}>
          Apakah Anda yakin ingin keluar dari akun <strong style={{ color: tokens.text }}>{user?.name || 'User'}</strong>? Anda perlu login kembali untuk mengakses sistem.
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={() => setShowLogoutConfirm(false)}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: tokens.radius,
              border: `1px solid ${tokens.border}`,
              background: tokens.inputBg,
              color: tokens.text,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: tokens.fontFamily,
            }}
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={async () => {
              setIsLoggingOut(true)
              try {
                await logout()
              } finally {
                setIsLoggingOut(false)
                setShowLogoutConfirm(false)
              }
            }}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: tokens.radius,
              border: 'none',
              background: `linear-gradient(135deg, ${tokens.danger}, #dc2626)`,
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isLoggingOut ? 'not-allowed' : 'pointer',
              opacity: isLoggingOut ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
              fontFamily: tokens.fontFamily,
            }}
          >
            {isLoggingOut ? 'Keluar...' : 'Ya, Keluar'}
          </button>
        </div>
      </div>
    </div>
  ) : null

  const userAvatar = (
    <div ref={userMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setShowUserMenu((v) => !v)}
        title={`Akun: ${user?.name || 'User'} (${user?.email || ''})`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: showUserMenu ? `${tokens.primary}20` : `${tokens.primary}12`,
          border: `1px solid ${tokens.border}`,
          padding: '3px 8px 3px 4px',
          borderRadius: 99,
          cursor: 'pointer',
          color: tokens.text,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: tokens.fontFamily,
          transition: 'all 0.15s',
        }}
      >
        <div
          style={{
            width: 26, height: 26, borderRadius: '50%',
            background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.accent})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 11, fontWeight: 700,
          }}
        >
          {getInitials(user?.name)}
        </div>
        {!isMobile && (
          <span style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name || 'User'}
          </span>
        )}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.6, transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {showUserMenu && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 8,
            width: 240,
            background: tokens.card,
            border: `1px solid ${tokens.cardBorder}`,
            borderRadius: tokens.radius,
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            backdropFilter: tokens.glassBlur,
            WebkitBackdropFilter: tokens.glassBlur,
            padding: '6px',
            zIndex: 100,
            fontFamily: tokens.fontFamily,
          }}
        >
          {/* User Info Header */}
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${tokens.border}`, marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: tokens.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || 'user@ehs.com'}
            </div>
            <div style={{ marginTop: 6, display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${tokens.primary}18`, color: tokens.primary }}>
              EHS Staff / Operator
            </div>
          </div>

          {/* Menu Items */}
          <button
            onClick={() => {
              setShowUserMenu(false)
              setPage('settings')
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              textAlign: 'left',
              color: tokens.text,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: tokens.fontFamily,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${tokens.primary}12` }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Pengaturan Akun
          </button>

          <div style={{ height: 1, background: tokens.border, margin: '4px 0' }} />

          <button
            onClick={() => {
              setShowUserMenu(false)
              setShowLogoutConfirm(true)
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              textAlign: 'left',
              color: tokens.danger,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: tokens.fontFamily,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${tokens.danger}15` }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Keluar Akun
          </button>
        </div>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '8px 12px 10px',
          gap: 8,
          background: isGlass ? (tokens.glassBg ?? tokens.headerBg) : tokens.headerBg,
          backdropFilter: isGlass ? tokens.glassBlur : undefined,
          WebkitBackdropFilter: isGlass ? tokens.glassBlur : undefined,
          borderBottom: `1px solid ${tokens.headerBorder}`,
          zIndex: 10,
          flexShrink: 0,
          fontFamily: tokens.fontFamily,
        }}
      >
        {/* Row 1: Nav button + Title + Notification & Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Open menu"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: `1px solid ${tokens.border}`,
                background: tokens.inputBg,
                color: tokens.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div style={{
              fontSize: 15,
              fontWeight: 700,
              color: tokens.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {t(PAGE_TITLES[page])}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {exportBtn}
            {notifBell}
            {userAvatar}
          </div>
        </div>

        {/* Row 2: Search Input + Year + Period */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
          <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
            {searchInput}
          </div>
          {yearSelect}
          {periodSelect}
        </div>
      </header>
    )
  }

  return (
    <header
      style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 16,
        background: isGlass ? (tokens.glassBg ?? tokens.headerBg) : tokens.headerBg,
        backdropFilter: isGlass ? tokens.glassBlur : undefined,
        WebkitBackdropFilter: isGlass ? tokens.glassBlur : undefined,
        borderBottom: `1px solid ${tokens.headerBorder}`,
        zIndex: 10,
        flexShrink: 0,
        fontFamily: tokens.fontFamily,
        position: 'relative',
      }}
    >
      {/* Page title */}
      <div style={{
        fontSize: 16,
        fontWeight: 700,
        color: tokens.text,
        flex: '0 0 auto',
        whiteSpace: 'nowrap',
      }}>
        {t(PAGE_TITLES[page])}
      </div>

      {/* ===== SEARCH BAR ===== */}
      <div
        style={{
          marginLeft: "auto",
          flex: 1,
          maxWidth: 320,
          position: "relative",
          minWidth: 120,
        }}
      >
        {searchInput}
      </div>

      {/* Year filter */}
      {yearSelect}

      {/* Period filter (Month/Quarter) */}
      {periodSelect}

      {/* Quick Export button */}
      {exportBtn}

      {/* Notification bell */}
      {notifBell}

      {/* User avatar */}
      {userAvatar}

      {/* Logout confirmation modal */}
      {logoutModal}
    </header>
  )
}