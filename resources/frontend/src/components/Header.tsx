import { useState, useRef, useEffect } from 'react'
import { useApp, type PageId } from '../context'
import { NOTIFICATIONS } from '../data'
import { getNotifications, markNotificationAsRead } from '../api'
import { useIsMobile } from '../hooks/useMediaQuery'

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
  id: number
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
  const { tokens, page, t, theme, sidebarOpen, setSidebarOpen, isRTL } = useApp()
  const [showNotif, setShowNotif] = useState(false)
  const [year, setYear] = useState('2024')
  const [search, setSearch] = useState('')
  const [notes, setNotes] = useState<DisplayNotification[]>(
    NOTIFICATIONS.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      timestamp: n.timestamp,
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
              read: Boolean(n.is_read),
              timestamp: n.created_at,
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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
      //if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
      //setMobileSearchOpen(false)
      //}
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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
          padding: '6px 12px 6px 32px',
          background: tokens.inputBg,
          border: `1px solid ${tokens.border}`,
          borderRadius: tokens.radius,
          fontSize: 13,
          color: tokens.text,
          fontFamily: tokens.fontFamily,
          outline: 'none',
        }}
      />
    </>
  )

  return (
    <header
      style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '0 14px' : '0 20px',
        gap: isMobile ? 8 : 16,
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
      {/* Mobile menu button — lives inside the header row so it centers naturally */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Open menu"
          style={{
            width: 36,
            height: 36,
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
      )}

      {/* Page title */}
      <div style={{
        fontSize: isMobile ? 14 : 16,
        fontWeight: 700,
        color: tokens.text,
        flex: isMobile ? '0 1 auto' : '0 0 auto',
        minWidth: isMobile ? 40 : undefined,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {t(PAGE_TITLES[page])}
      </div>

      {/* ===== NEW SEARCH BAR ===== */}

      <div
        style={{
          marginLeft: "auto",
          flex: 1,
          maxWidth: isMobile ? 170 : 320,
          position: "relative",
          minWidth: 120,
        }}
      >
        {searchInput}
      </div>

      {/* Year filter */}
      <select
        value={year}
        onChange={(e) => setYear(e.target.value)}
        style={{
          padding: isMobile ? '5px 6px' : '5px 10px',
          background: tokens.inputBg,
          border: `1px solid ${tokens.border}`,
          borderRadius: tokens.radius,
          color: tokens.text,
          fontSize: 13,
          fontFamily: tokens.fontFamily,
          cursor: 'pointer',
          outline: 'none',
          flexShrink: 0,
        }}
      >
        {['2022', '2023', '2024', '2025'].map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      {/* Notification bell */}
      <div ref={notifRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setShowNotif((v) => !v)}
          style={{
            width: 36, height: 36,
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              width: 16, height: 16,
              background: tokens.danger, color: '#fff',
              borderRadius: '50%', fontSize: 9, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{unreadCount}</span>
          )}
        </button>
        {showNotif && <NotificationPanel tokens={tokens} isMobile={isMobile} notes={notes} setNotes={setNotes} />}
      </div>

      {/* User avatar */}
      <div
        style={{
          width: 34, height: 34, borderRadius: '50%',
          background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.accent})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 13, fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
        }}
        title="Admin EHS"
      >
        AE
      </div>
    </header>
  )
}