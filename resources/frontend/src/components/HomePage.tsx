import { useApp } from '../context'
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery'
import HeroProfileBanner from './dashboard/HeroProfileBanner'

export default function HomePage() {
  const { tokens, setPage, theme, t } = useApp()
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  const isGlass = theme === 'frosted' || theme === 'liquid'
  const isNight = theme === 'nightcity'

  const gridColumns = isMobile
    ? '1fr'
    : isTablet
      ? 'repeat(2, 1fr)'
      : 'repeat(3, 1fr)'

  const cardBaseStyle = {
    background: tokens.card,
    border: `1px solid ${tokens.cardBorder}`,
    borderRadius: tokens.radius,
    padding: isMobile ? '18px' : '22px',
    boxShadow: tokens.shadow,
    backdropFilter: isGlass ? tokens.glassBlur : undefined,
    WebkitBackdropFilter: isGlass ? tokens.glassBlur : undefined,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    gap: 18,
    transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
    minWidth: 0,
  }

  return (
    <div
      style={{
        padding: isMobile ? '16px' : '24px 28px',
        overflowY: 'auto',
        flex: 1,
        fontFamily: tokens.fontFamily,
      }}
    >
      {/* 1. Hero Profile Banner (Web Profile Overview) */}
      <HeroProfileBanner />

      {/* 2. Section Header: Menu Navigasi Fitur */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 20, background: tokens.primary, borderRadius: 2 }} />
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: tokens.text, margin: 0 }}>
              {t('quickAccessTitle')}
            </h2>
            <span style={{ fontSize: 13, color: tokens.textMuted }}>
              Pilih menu fitur di bawah ini untuk memulai pemantauan atau pencatatan limbah
            </span>
          </div>
        </div>
      </div>

      {/* 3. Tiga Kartu Navigasi Fitur Utama (Limbah B3, Limbah Domestik, Pencatatan Data) */}
      <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: 18, marginBottom: 24 }}>
        {/* KARTU 1: Limbah B3 */}
        <div
          style={{ ...cardBaseStyle, borderTop: `4px solid ${tokens.chartB3In}` }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)'
            e.currentTarget.style.boxShadow = isNight ? `0 8px 24px ${tokens.chartB3In}30` : '0 8px 24px rgba(0,0,0,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = tokens.shadow
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: `${tokens.chartB3In}18`,
                  color: tokens.chartB3In,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: tokens.chartB3In, background: `${tokens.chartB3In}15`, padding: '3px 8px', borderRadius: 4 }}>
                TPS B3
              </span>
            </div>

            <div style={{ fontSize: 17, fontWeight: 800, color: tokens.text, marginBottom: 6 }}>
              {t('b3Waste')}
            </div>
            <div style={{ fontSize: 13.5, color: tokens.text, opacity: 0.8, lineHeight: 1.55 }}>
              {t('b3ModuleDesc')}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setPage('b3')}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: tokens.primary,
                color: tokens.textInverse,
                border: 'none',
                borderRadius: tokens.radius,
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s',
              }}
            >
              <span>{t('openB3Monitoring')}</span>
              <span style={{ fontSize: 16 }}>→</span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                onClick={() => setPage('b3-in')}
                style={{
                  padding: '10px 6px',
                  background: `${tokens.chartB3In}15`,
                  color: tokens.chartB3In,
                  border: `1px solid ${tokens.chartB3In}45`,
                  borderRadius: tokens.radius,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 0.15s',
                }}
              >
                {t('inputB3In')}
              </button>
              <button
                type="button"
                onClick={() => setPage('b3-out')}
                style={{
                  padding: '10px 6px',
                  background: `${tokens.chartB3Out}15`,
                  color: tokens.chartB3Out,
                  border: `1px solid ${tokens.chartB3Out}45`,
                  borderRadius: tokens.radius,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 0.15s',
                }}
              >
                {t('inputB3Out')}
              </button>
            </div>
          </div>
        </div>

        {/* KARTU 2: Limbah Domestik */}
        <div
          style={{ ...cardBaseStyle, borderTop: `4px solid ${tokens.chartDomMorning}` }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)'
            e.currentTarget.style.boxShadow = isNight ? `0 8px 24px ${tokens.chartDomMorning}30` : '0 8px 24px rgba(0,0,0,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = tokens.shadow
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: `${tokens.chartDomMorning}18`,
                  color: tokens.chartDomMorning,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: tokens.chartDomMorning, background: `${tokens.chartDomMorning}15`, padding: '3px 8px', borderRadius: 4 }}>
                Organik & Anorganik
              </span>
            </div>

            <div style={{ fontSize: 17, fontWeight: 800, color: tokens.text, marginBottom: 6 }}>
              {t('domesticWaste')}
            </div>
            <div style={{ fontSize: 13.5, color: tokens.text, opacity: 0.8, lineHeight: 1.55 }}>
              {t('domesticModuleDesc')}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setPage('domestic')}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: tokens.primary,
                color: tokens.textInverse,
                border: 'none',
                borderRadius: tokens.radius,
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s',
              }}
            >
              <span>{t('openDomesticMonitoring')}</span>
              <span style={{ fontSize: 16 }}>→</span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                onClick={() => setPage('waste-in')}
                style={{
                  padding: '10px 6px',
                  background: `${tokens.chartDomMorning}15`,
                  color: tokens.chartDomMorning,
                  border: `1px solid ${tokens.chartDomMorning}45`,
                  borderRadius: tokens.radius,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 0.15s',
                }}
              >
                {t('inputDomIn')}
              </button>
              <button
                type="button"
                onClick={() => setPage('waste-out')}
                style={{
                  padding: '10px 6px',
                  background: `${tokens.chartDomAfternoon}15`,
                  color: tokens.chartDomAfternoon,
                  border: `1px solid ${tokens.chartDomAfternoon}45`,
                  borderRadius: tokens.radius,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 0.15s',
                }}
              >
                {t('inputDomOut')}
              </button>
            </div>
          </div>
        </div>

        {/* KARTU 3: Pusat Pencatatan Data */}
        <div
          style={{ ...cardBaseStyle, borderTop: `4px solid ${tokens.accent}` }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)'
            e.currentTarget.style.boxShadow = isNight ? `0 8px 24px ${tokens.accent}30` : '0 8px 24px rgba(0,0,0,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = tokens.shadow
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: `${tokens.accent}18`,
                  color: tokens.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: tokens.accent, background: `${tokens.accent}15`, padding: '3px 8px', borderRadius: 4 }}>
                Input Cepat
              </span>
            </div>

            <div style={{ fontSize: 17, fontWeight: 800, color: tokens.text, marginBottom: 6 }}>
              {t('inputDataGroup')}
            </div>
            <div style={{ fontSize: 13.5, color: tokens.text, opacity: 0.8, lineHeight: 1.55 }}>
              {t('quickInputModuleDesc')}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setPage('b3-in')}
              style={{
                padding: '11px 8px',
                background: `${tokens.chartB3In}14`,
                color: tokens.text,
                border: `1px solid ${tokens.chartB3In}45`,
                borderRadius: tokens.radius,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${tokens.chartB3In}25` }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${tokens.chartB3In}14` }}
            >
              <span style={{ color: tokens.chartB3In, fontSize: 14 }}>●</span> B3 Masuk
            </button>

            <button
              type="button"
              onClick={() => setPage('b3-out')}
              style={{
                padding: '11px 8px',
                background: `${tokens.chartB3Out}14`,
                color: tokens.text,
                border: `1px solid ${tokens.chartB3Out}45`,
                borderRadius: tokens.radius,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${tokens.chartB3Out}25` }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${tokens.chartB3Out}14` }}
            >
              <span style={{ color: tokens.chartB3Out, fontSize: 14 }}>●</span> B3 Keluar
            </button>

            <button
              type="button"
              onClick={() => setPage('waste-in')}
              style={{
                padding: '11px 8px',
                background: `${tokens.chartDomMorning}14`,
                color: tokens.text,
                border: `1px solid ${tokens.chartDomMorning}45`,
                borderRadius: tokens.radius,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${tokens.chartDomMorning}25` }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${tokens.chartDomMorning}14` }}
            >
              <span style={{ color: tokens.chartDomMorning, fontSize: 14 }}>●</span> Dom Masuk
            </button>

            <button
              type="button"
              onClick={() => setPage('waste-out')}
              style={{
                padding: '11px 8px',
                background: `${tokens.chartDomAfternoon}14`,
                color: tokens.text,
                border: `1px solid ${tokens.chartDomAfternoon}45`,
                borderRadius: tokens.radius,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${tokens.chartDomAfternoon}25` }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${tokens.chartDomAfternoon}14` }}
            >
              <span style={{ color: tokens.chartDomAfternoon, fontSize: 14 }}>●</span> Dom Keluar
            </button>
          </div>
        </div>
      </div>

      {/* 4. Banner Navigasi ke Dasbor Analitik & Grafik */}
      <div
        style={{
          background: `linear-gradient(135deg, ${tokens.card}, ${tokens.bgSecondary})`,
          border: `1px solid ${tokens.cardBorder}`,
          borderRadius: tokens.radius,
          padding: isMobile ? '18px' : '22px 26px',
          boxShadow: tokens.shadow,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 14 }}>
          <div
            style={{
              width: isMobile ? 44 : 52,
              height: isMobile ? 44 : 52,
              borderRadius: 12,
              background: `${tokens.primary}20`,
              color: tokens.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width={isMobile ? "24" : "28"} height={isMobile ? "24" : "28"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          </div>

          <div>
            <h3 style={{ margin: 0, fontSize: isMobile ? 15 : 16, fontWeight: 800, color: tokens.text }}>
              Ingin Melihat Statistik & Grafik Pemantauan?
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.4 }}>
              Buka <strong>Dasbor Analitik</strong> untuk melihat grafik batang bulanan, distribusi komposisi limbah, dan tren data komprehensif.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPage('analytics')}
          style={{
            width: isMobile ? '100%' : 'auto',
            padding: '12px 22px',
            background: tokens.primary,
            color: tokens.textInverse,
            border: 'none',
            borderRadius: tokens.radius,
            fontSize: 13.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            transition: 'all 0.15s',
          }}
        >
          <span>Buka Dasbor Analitik</span>
          <span style={{ fontSize: 16 }}>→</span>
        </button>
      </div>
    </div>
  )
}
