import React from 'react'
import { useApp, type PageId } from '../context'
import logo from '../imports/ehs_logo.png'
import { useIsMobile } from '../hooks/useMediaQuery'

const NAV_ITEMS: { id: PageId; icon: string; key: string }[] = [
  { id: 'dashboard', icon: '⬛', key: 'dashboard' },
  { id: 'b3', icon: '⚠', key: 'b3Waste' },
  { id: 'domestic', icon: '🏠', key: 'domesticWaste' },
  { id: 'settings', icon: '⚙', key: 'settings' },
]

function NavIcon({ id }: { id: PageId }) {
  const icons: Record<PageId, React.ReactElement> = {
    dashboard: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    b3: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    domestic: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    settings: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  }
  return icons[id]
}

export default function Sidebar() {
  const { tokens, page, setPage, sidebarOpen, setSidebarOpen, t, isRTL, theme } = useApp()
  const isMobile = useIsMobile()

  // On mobile the sidebar is a full-label drawer (open/hidden), not a mini-rail.
  // On desktop it keeps the original collapsed(64px)/expanded(220px) behavior.
  const collapsed = isMobile ? false : !sidebarOpen
  const isGlass = theme === 'frosted' || theme === 'liquid'
  const isNight = theme === 'nightcity'

  const sidebarBg = isGlass ? (tokens.glassBg ?? tokens.sidebar) : tokens.sidebar
  const blur = isGlass ? (tokens.glassBlur ?? 'blur(16px)') : undefined

  const mobileWidth = 240
  const desktopWidth = collapsed ? 64 : 220

  const asideStyle: React.CSSProperties = isMobile
    ? {
        width: mobileWidth,
        minWidth: mobileWidth,
        position: 'fixed',
        top: 0,
        ...(isRTL ? { right: 0 } : { left: 0 }),
        height: '100vh',
        transform: sidebarOpen ? 'translateX(0)' : `translateX(${isRTL ? '100%' : '-100%'})`,
        transition: 'transform 0.25s ease',
        zIndex: 60,
      }
    : {
        width: desktopWidth,
        minWidth: desktopWidth,
        position: 'relative',
        transition: 'width 0.22s ease, min-width 0.22s ease',
        zIndex: 20,
      }

  return (
    <>
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 55,
          }}
        />
      )}

      <aside
        style={{
          ...asideStyle,
          background: sidebarBg,
          backdropFilter: blur,
          WebkitBackdropFilter: blur,
          borderRight: isRTL ? undefined : `1px solid ${tokens.sidebarBorder}`,
          borderLeft: isRTL ? `1px solid ${tokens.sidebarBorder}` : undefined,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: isMobile
            ? '2px 0 24px rgba(0,0,0,0.25)'
            : (isNight ? `2px 0 20px rgba(0,255,255,0.08)` : undefined),
        }}
      >
        {/* Logo row */}
        <div
          style={{
            padding: collapsed ? '20px 0' : '20px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderBottom: `1px solid ${tokens.sidebarBorder}`,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <img src={logo} alt="EHS" style={{ width: 32, height: 32, flexShrink: 0 }} />
          {!collapsed && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', lineHeight: 1.2, fontFamily: tokens.fontFamily }}>
                {isNight ? <span style={{ color: tokens.primary, textShadow: tokens.neonGlow }}>Monitoring</span> : 'Monitoring'}
              </div>
              <div style={{ fontSize: 11, color: tokens.sidebarText, fontFamily: tokens.fontFamily }}>Limbah EHS</div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV_ITEMS.map(({ id, key }) => {
            const active = page === id
            return (
              <button
                key={id}
                onClick={() => {
                  setPage(id)
                  if (isMobile) setSidebarOpen(false)
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: collapsed ? '11px 0' : '11px 16px',
                  justifyContent: collapsed ? 'center' : (isRTL ? 'flex-end' : 'flex-start'),
                  background: active ? tokens.sidebarActive : 'transparent',
                  color: active ? tokens.sidebarActiveText : tokens.sidebarText,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: tokens.fontFamily,
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  borderRadius: collapsed ? 0 : '0 4px 4px 0',
                  marginBottom: 2,
                  transition: 'all 0.15s',
                  position: 'relative',
                  textShadow: active && isNight ? tokens.neonGlow : undefined,
                  boxShadow: active && isNight ? `inset 0 0 20px ${tokens.primary}22` : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = `${tokens.sidebarActive}22`
                    e.currentTarget.style.color = '#ffffff'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = tokens.sidebarText
                  }
                }}
              >
                {active && !collapsed && (
                  <div style={{
                    position: 'absolute',
                    left: 0, top: 0, bottom: 0,
                    width: 3,
                    background: isNight ? tokens.primary : '#ffffff',
                    borderRadius: '0 2px 2px 0',
                    boxShadow: isNight ? tokens.neonGlow : undefined,
                  }} />
                )}
                <span style={{ opacity: active ? 1 : 0.7, flexShrink: 0 }}><NavIcon id={id} /></span>
                {!collapsed && <span>{t(key)}</span>}
              </button>
            )
          })}
        </nav>

        {/* Collapse / close toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            margin: '12px auto',
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: `1px solid ${tokens.sidebarBorder}`,
            background: 'transparent',
            color: tokens.sidebarText,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
          title={isMobile ? 'Close menu' : (collapsed ? 'Expand sidebar' : 'Collapse sidebar')}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {isMobile ? (
              isRTL ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />
            ) : collapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </button>
      </aside>
    </>
  )
}