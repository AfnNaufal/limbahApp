import { useState, useRef, useEffect } from 'react'
import { useApp, type PageId } from '../context'
import { NOTIFICATIONS } from '../data'
import type { Notification } from '../data'

const PAGE_TITLES: Record<PageId, string> = {
  dashboard: 'dashboard',
  b3: 'b3Waste',
  domestic: 'domesticWaste',
  settings: 'settings',
}

function NotificationPanel({ tokens }: { tokens: ReturnType<typeof useApp>['tokens'] }) {
  const { t } = useApp()
  const [notes, setNotes] = useState<Notification[]>(NOTIFICATIONS)
  const unread = notes.filter((n) => !n.read).length

  const typeColor: Record<string, string> = {
    b3in: tokens.chartB3In,
    b3out: tokens.chartB3Out,
    domestic: tokens.chartDomMorning,
    alert: tokens.danger,
  }

  const typeIcon: Record<string, string> = {
    b3in: '↓',
    b3out: '↑',
    domestic: '🏠',
    alert: '⚠',
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: 8,
        width: 340,
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
          onClick={() => setNotes((n) => n.map((x) => ({ ...x, read: true })))}
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
              onClick={() => setNotes((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))}
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
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: tokens.text }}>{n.title}</span>
                    {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: tokens.primary, flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: 12, color: tokens.textMuted, lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 4 }}>
                    {new Date(n.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
  const { tokens, page, t, theme } = useApp()
  const [showNotif, setShowNotif] = useState(false)
  const [year, setYear] = useState('2024')
  const [search, setSearch] = useState('')
  const notifRef = useRef<HTMLDivElement>(null)
  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length

  const isGlass = theme === 'frosted' || theme === 'liquid'

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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
      }}
    >
      {/* Page title */}
      <div style={{ fontSize: 16, fontWeight: 700, color: tokens.text, flex: '0 0 auto' }}>
        {t(PAGE_TITLES[page])}
      </div>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 320, position: 'relative' }}>
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }}
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tokens.text} strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder={t('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
      </div>

      <div style={{ flex: 1 }} />

      {/* Year filter */}
      <select
        value={year}
        onChange={(e) => setYear(e.target.value)}
        style={{
          padding: '5px 10px',
          background: tokens.inputBg,
          border: `1px solid ${tokens.border}`,
          borderRadius: tokens.radius,
          color: tokens.text,
          fontSize: 13,
          fontFamily: tokens.fontFamily,
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {['2022', '2023', '2024', '2025'].map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      {/* Notification bell */}
      <div ref={notifRef} style={{ position: 'relative' }}>
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
        {showNotif && <NotificationPanel tokens={tokens} />}
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
