import { useApp } from '../context'
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery'
import HeroProfileBanner from './dashboard/HeroProfileBanner'

export default function HomePage() {
  const { tokens, setPage, theme, t } = useApp()
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  const isGlass = theme === 'frosted' || theme === 'liquid'
  const isNight = theme === 'nightcity'

  const pillarColumns = isMobile ? '1fr' : 'repeat(2, 1fr)'
  const statChipsColumns = isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'

  const cardBaseStyle = {
    background: tokens.card,
    border: `1px solid ${tokens.cardBorder}`,
    borderRadius: tokens.radius,
    padding: isMobile ? '20px' : '26px',
    boxShadow: tokens.shadow,
    backdropFilter: isGlass ? tokens.glassBlur : undefined,
    WebkitBackdropFilter: isGlass ? tokens.glassBlur : undefined,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    gap: 20,
    transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
    minWidth: 0,
  }

  const statChipStyle = {
    background: tokens.card,
    border: `1px solid ${tokens.cardBorder}`,
    borderRadius: tokens.radius,
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    boxShadow: tokens.shadow,
    backdropFilter: isGlass ? tokens.glassBlur : undefined,
    WebkitBackdropFilter: isGlass ? tokens.glassBlur : undefined,
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
      {/* 1. Hero Profile Banner */}
      <HeroProfileBanner />

      {/* 2. Quick Live Status Chips */}
      <div style={{ display: 'grid', gridTemplateColumns: statChipsColumns, gap: 14, marginBottom: 24 }}>
        {/* Chip 1: TPS B3 */}
        <div style={statChipStyle}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: `${tokens.chartB3In}18`,
              color: tokens.chartB3In,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: tokens.textMuted, letterSpacing: '0.5px' }}>
              TPS Limbah B3
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: tokens.text, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Neraca Logbook Aktif
            </div>
          </div>
        </div>

        {/* Chip 2: Status Masa Simpan */}
        <div style={statChipStyle}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: `${tokens.primary}18`,
              color: tokens.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: tokens.textMuted, letterSpacing: '0.5px' }}>
              Masa Simpan (PP 22/2021)
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: tokens.primary, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>●</span> Terpantau Aman
            </div>
          </div>
        </div>

        {/* Chip 3: Domestik 3R */}
        <div style={statChipStyle}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: `${tokens.chartDomMorning}18`,
              color: tokens.chartDomMorning,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: tokens.textMuted, letterSpacing: '0.5px' }}>
              Limbah Domestik 3R
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: tokens.text, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Sesi Pagi & Sore
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section Title: Dua Pilar Utama */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 4, height: 20, background: tokens.primary, borderRadius: 2 }} />
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: tokens.text, margin: 0 }}>
            {t('quickAccessTitle', 'Pusat Pengelolaan Modul Limbah')}
          </h2>
          <span style={{ fontSize: 13, color: tokens.textMuted }}>
            Pilih pilar modul limbah di bawah untuk membuka tabel monitoring atau melakukan pencatatan transaksi
          </span>
        </div>
      </div>

      {/* 4. Dual Core Pillars (B3 vs Domestik) */}
      <div style={{ display: 'grid', gridTemplateColumns: pillarColumns, gap: 20, marginBottom: 24 }}>
        {/* PILAR 1: Limbah B3 */}
        <div
          style={{ ...cardBaseStyle, borderTop: `4px solid ${tokens.chartB3In}` }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)'
            e.currentTarget.style.boxShadow = isNight ? `0 10px 28px ${tokens.chartB3In}30` : '0 10px 28px rgba(0,0,0,0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = tokens.shadow
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: `${tokens.chartB3In}18`,
                  color: tokens.chartB3In,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: tokens.chartB3In, background: `${tokens.chartB3In}18`, padding: '4px 10px', borderRadius: 6, border: `1px solid ${tokens.chartB3In}35` }}>
                TPS B3 &bull; PP 22/2021
              </span>
            </div>

            <div style={{ fontSize: 19, fontWeight: 800, color: tokens.text, marginBottom: 8 }}>
              {t('b3Waste', 'Limbah Bahan Berbahaya & Beracun (B3)')}
            </div>
            <div style={{ fontSize: 13.5, color: tokens.textMuted, lineHeight: 1.6, marginBottom: 16 }}>
              {t('b3ModuleDesc', 'Monitoring neraca logbook TPS B3, kepatuhan batas masa simpan 90/180/365 hari, dan manifest pengangkutan resmi.')}
            </div>

            {/* Quick feature indicators */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 11.5, color: tokens.text, background: tokens.inputBg, border: `1px solid ${tokens.border}`, padding: '3px 9px', borderRadius: 4, fontWeight: 600 }}>
                ✓ Logbook Masuk & Keluar
              </span>
              <span style={{ fontSize: 11.5, color: tokens.text, background: tokens.inputBg, border: `1px solid ${tokens.border}`, padding: '3px 9px', borderRadius: 4, fontWeight: 600 }}>
                ✓ Alarm Batas Waktu Simpan
              </span>
              <span style={{ fontSize: 11.5, color: tokens.text, background: tokens.inputBg, border: `1px solid ${tokens.border}`, padding: '3px 9px', borderRadius: 4, fontWeight: 600 }}>
                ✓ Foto Bukti Timbangan
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => setPage('b3')}
              style={{
                width: '100%',
                padding: '13px 16px',
                background: tokens.chartB3In,
                color: '#ffffff',
                border: 'none',
                borderRadius: tokens.radius,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: `0 4px 14px ${tokens.chartB3In}35`,
                transition: 'all 0.15s',
              }}
            >
              <span>{t('openB3Monitoring', 'Buka Monitoring & Neraca B3')}</span>
              <span style={{ fontSize: 16 }}>→</span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                onClick={() => setPage('b3-in')}
                style={{
                  padding: '11px 8px',
                  background: `${tokens.chartB3In}15`,
                  color: tokens.chartB3In,
                  border: `1px solid ${tokens.chartB3In}45`,
                  borderRadius: tokens.radius,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${tokens.chartB3In}25` }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${tokens.chartB3In}15` }}
              >
                + Input B3 Masuk
              </button>
              <button
                type="button"
                onClick={() => setPage('b3-out')}
                style={{
                  padding: '11px 8px',
                  background: `${tokens.chartB3Out}15`,
                  color: tokens.chartB3Out,
                  border: `1px solid ${tokens.chartB3Out}45`,
                  borderRadius: tokens.radius,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${tokens.chartB3Out}25` }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${tokens.chartB3Out}15` }}
              >
                + Input B3 Keluar
              </button>
            </div>
          </div>
        </div>

        {/* PILAR 2: Limbah Domestik */}
        <div
          style={{ ...cardBaseStyle, borderTop: `4px solid ${tokens.chartDomMorning}` }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)'
            e.currentTarget.style.boxShadow = isNight ? `0 10px 28px ${tokens.chartDomMorning}30` : '0 10px 28px rgba(0,0,0,0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = tokens.shadow
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: `${tokens.chartDomMorning}18`,
                  color: tokens.chartDomMorning,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: tokens.chartDomMorning, background: `${tokens.chartDomMorning}18`, padding: '4px 10px', borderRadius: 6, border: `1px solid ${tokens.chartDomMorning}35` }}>
                Non-B3 &bull; Pemilahan 3R
              </span>
            </div>

            <div style={{ fontSize: 19, fontWeight: 800, color: tokens.text, marginBottom: 8 }}>
              {t('domesticWaste', 'Limbah Padat Domestik & Daur Ulang')}
            </div>
            <div style={{ fontSize: 13.5, color: tokens.textMuted, lineHeight: 1.6, marginBottom: 16 }}>
              {t('domesticModuleDesc', 'Pencatatan timbulan sampah harian terpilah (organik, anorganik, residu) sesi pagi dan sore menuju zero waste.')}
            </div>

            {/* Quick feature indicators */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 11.5, color: tokens.text, background: tokens.inputBg, border: `1px solid ${tokens.border}`, padding: '3px 9px', borderRadius: 4, fontWeight: 600 }}>
                ✓ Pemilahan 15 Kategori Rinci
              </span>
              <span style={{ fontSize: 11.5, color: tokens.text, background: tokens.inputBg, border: `1px solid ${tokens.border}`, padding: '3px 9px', borderRadius: 4, fontWeight: 600 }}>
                ✓ Pencatatan Sesi Pagi / Sore
              </span>
              <span style={{ fontSize: 11.5, color: tokens.text, background: tokens.inputBg, border: `1px solid ${tokens.border}`, padding: '3px 9px', borderRadius: 4, fontWeight: 600 }}>
                ✓ Rasio Residu & Daur Ulang
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => setPage('domestic')}
              style={{
                width: '100%',
                padding: '13px 16px',
                background: tokens.primary,
                color: tokens.textInverse,
                border: 'none',
                borderRadius: tokens.radius,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                transition: 'all 0.15s',
              }}
            >
              <span>{t('openDomesticMonitoring', 'Buka Monitoring Domestik')}</span>
              <span style={{ fontSize: 16 }}>→</span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                onClick={() => setPage('waste-in')}
                style={{
                  padding: '11px 8px',
                  background: `${tokens.chartDomMorning}15`,
                  color: tokens.chartDomMorning,
                  border: `1px solid ${tokens.chartDomMorning}45`,
                  borderRadius: tokens.radius,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${tokens.chartDomMorning}25` }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${tokens.chartDomMorning}15` }}
              >
                + Input Domestik Masuk
              </button>
              <button
                type="button"
                onClick={() => setPage('waste-out')}
                style={{
                  padding: '11px 8px',
                  background: `${tokens.chartDomAfternoon}15`,
                  color: tokens.chartDomAfternoon,
                  border: `1px solid ${tokens.chartDomAfternoon}45`,
                  borderRadius: tokens.radius,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${tokens.chartDomAfternoon}25` }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${tokens.chartDomAfternoon}15` }}
              >
                + Input Domestik Keluar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Banner Navigasi ke Dasbor Analitik & Grafik */}
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
