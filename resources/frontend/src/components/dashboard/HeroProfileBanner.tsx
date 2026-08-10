import { useApp } from '../../context'
import { useIsMobile } from '../../hooks/useMediaQuery'

export default function HeroProfileBanner() {
  const { tokens, year, theme, t } = useApp()
  const isMobile = useIsMobile()

  const isGlass = theme === 'frosted' || theme === 'liquid'
  const isNight = theme === 'nightcity'

  return (
    <div
      style={{
        background: tokens.card,
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: tokens.radius,
        padding: isMobile ? '16px' : '20px 24px',
        boxShadow: tokens.shadow,
        backdropFilter: isGlass ? tokens.glassBlur : undefined,
        WebkitBackdropFilter: isGlass ? tokens.glassBlur : undefined,
        marginBottom: 20,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: tokens.fontFamily,
      }}
    >
      {/* Decorative accent top line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${tokens.primary}, ${tokens.accent}, #10b981)`,
        }}
      />

      <div
        style={{
          display: 'flex',
          gap: 14,
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${tokens.primary}20, ${tokens.accent}30)`,
            border: `1px solid ${tokens.primary}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: isNight ? `0 0 12px ${tokens.primary}40` : undefined,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={tokens.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: tokens.primary,
                background: `${tokens.primary}18`,
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              EHS Waste Portal
            </span>
            <span style={{ fontSize: 12, color: tokens.textMuted }}>
              • {t('periodRunning')}: <strong style={{ color: tokens.text }}>{year}</strong>
            </span>
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: isMobile ? 17 : 20,
              fontWeight: 800,
              color: tokens.text,
              lineHeight: 1.25,
              letterSpacing: '-0.3px',
            }}
          >
            {t('systemPortalTitle')}
          </h1>

          <p
            style={{
              margin: '6px 0 0 0',
              fontSize: 12.5,
              color: tokens.textMuted,
              lineHeight: 1.45,
              maxWidth: 820,
            }}
          >
            {t('systemPortalSubtitle')}
          </p>
        </div>
      </div>
    </div>
  )
}
