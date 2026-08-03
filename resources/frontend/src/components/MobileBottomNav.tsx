import { useState, useEffect } from 'react'
import { useApp } from '../context'
import { useIsMobile } from '../hooks/useMediaQuery'

export default function MobileBottomNav() {
  const { tokens, page, setPage, theme } = useApp()
  const isMobile = useIsMobile()
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  const isGlass = theme === 'frosted' || theme === 'liquid'
  const isNight = theme === 'nightcity'

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement
      if (!target || !target.scrollTop) return
      const currentScrollY = target.scrollTop
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    const mainElement = document.querySelector('main')
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      if (mainElement) {
        mainElement.removeEventListener('scroll', handleScroll)
      }
    }
  }, [lastScrollY])

  if (!isMobile) return null

  const quickActions = [
    {
      id: 'b3-in',
      title: 'B3 Masuk',
      desc: 'Pencatatan limbah B3 masuk ke TPS',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tokens.chartB3In} strokeWidth="2">
          <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
      ),
      badgeColor: tokens.chartB3In,
    },
    {
      id: 'b3-out',
      title: 'B3 Keluar',
      desc: 'Penyerahan limbah B3 ke Pihak Ke-3',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tokens.chartB3Out} strokeWidth="2">
          <path d="M12 15V3m0 0l-4 4m4-4l4 4" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
      ),
      badgeColor: tokens.chartB3Out,
    },
    {
      id: 'waste-in',
      title: 'Domestik Masuk',
      desc: 'Pencatatan sampah harian (Sesi Pagi/Sore)',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tokens.chartDomMorning} strokeWidth="2">
          <path d="M12 2v10m0 0l-3-3m3 3l3-3" />
          <path d="M3 13.5a9 9 0 1 0 18 0" />
        </svg>
      ),
      badgeColor: tokens.chartDomMorning,
    },
    {
      id: 'waste-out',
      title: 'Domestik Keluar',
      desc: 'Pengolahan & Pengangkutan ke TPA',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tokens.chartDomAfternoon} strokeWidth="2">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
      badgeColor: tokens.chartDomAfternoon,
    },
  ]

  return (
    <>
      {/* Quick Add Bottom Sheet Modal */}
      {showQuickAdd && (
        <div
          onClick={() => setShowQuickAdd(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)', zIndex: 120, display: 'flex',
            alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 500, background: tokens.card,
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              border: `1px solid ${tokens.cardBorder}`, padding: '20px 20px 30px',
              boxShadow: '0 -10px 30px rgba(0,0,0,0.3)', display: 'flex',
              flexDirection: 'column', gap: 14, animation: 'slideUp 0.25s ease-out',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: tokens.text }}>Pilih Jenis Pencatatan</div>
                <div style={{ fontSize: 11, color: tokens.textMuted }}>Pilih formulir pencatatan data sampah</div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                style={{
                  width: 30, height: 30, borderRadius: '50%', background: tokens.inputBg,
                  border: `1px solid ${tokens.border}`, color: tokens.textMuted,
                  fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {quickActions.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => {
                    setPage(act.id as any)
                    setShowQuickAdd(false)
                  }}
                  style={{
                    background: tokens.inputBg, border: `1px solid ${tokens.border}`,
                    borderRadius: tokens.radius, padding: 12, textAlign: 'left',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6,
                    transition: 'transform 0.15s, border-color 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: `${act.badgeColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {act.icon}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: act.badgeColor, background: `${act.badgeColor}15`, padding: '2px 6px', borderRadius: 4 }}>
                      + Input
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: tokens.text }}>{act.title}</div>
                    <div style={{ fontSize: 10, color: tokens.textMuted, marginTop: 2, lineHeight: 1.3 }}>{act.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Mobile Navigation Bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          height: 64,
          background: isGlass ? tokens.glassBg ?? tokens.card : tokens.card,
          backdropFilter: isGlass ? tokens.glassBlur : 'blur(16px)',
          WebkitBackdropFilter: isGlass ? tokens.glassBlur : 'blur(16px)',
          borderTop: `1px solid ${tokens.cardBorder}`,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 8px',
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.28s ease',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* 1. Dasbor */}
        <button
          type="button"
          onClick={() => setPage('dashboard')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: page === 'dashboard' ? tokens.primary : tokens.textMuted,
            width: 56, transition: 'color 0.15s',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={page === 'dashboard' ? '2.5' : '1.8'}>
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </svg>
          <span style={{ fontSize: 10, fontWeight: page === 'dashboard' ? 700 : 500 }}>Dasbor</span>
        </button>

        {/* 2. Limbah B3 */}
        <button
          type="button"
          onClick={() => setPage('b3')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: page === 'b3' ? tokens.primary : tokens.textMuted,
            width: 56, transition: 'color 0.15s',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={page === 'b3' ? '2.5' : '1.8'}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          <span style={{ fontSize: 10, fontWeight: page === 'b3' ? 700 : 500 }}>B3</span>
        </button>

        {/* 3. CENTER FLOATING QUICK ACTION BUTTON */}
        <button
          type="button"
          onClick={() => setShowQuickAdd(true)}
          style={{
            width: 46, height: 46, borderRadius: '50%',
            background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.accent ?? tokens.primary})`,
            color: tokens.textInverse, border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isNight ? `0 0 16px ${tokens.primary}80` : '0 4px 14px rgba(0,0,0,0.25)',
            transform: 'translateY(-10px)', transition: 'transform 0.15s ease',
          }}
          title="Pencatatan Data"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* 4. Domestik */}
        <button
          type="button"
          onClick={() => setPage('domestic')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: page === 'domestic' ? tokens.primary : tokens.textMuted,
            width: 56, transition: 'color 0.15s',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={page === 'domestic' ? '2.5' : '1.8'}>
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.12 2 7 0 6-4 11-10 11z" />
            <path d="M11 20v-6" />
          </svg>
          <span style={{ fontSize: 10, fontWeight: page === 'domestic' ? 700 : 500 }}>Domestik</span>
        </button>

        {/* 5. Pengaturan */}
        <button
          type="button"
          onClick={() => setPage('settings')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: page === 'settings' ? tokens.primary : tokens.textMuted,
            width: 56, transition: 'color 0.15s',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={page === 'settings' ? '2.5' : '1.8'}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span style={{ fontSize: 10, fontWeight: page === 'settings' ? 700 : 500 }}>Pengaturan</span>
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
