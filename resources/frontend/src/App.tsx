import { useState, useEffect } from 'react'
import { AppProvider, useApp } from './context'
import SplashScreen from './components/SplashScreen'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import B3Page from './components/B3Page'
import DomesticPage from './components/DomesticPage'
import SettingsPage from './components/SettingsPage'

function MainLayout() {
  const { tokens, page, isRTL, theme } = useApp()

  const isGrad = tokens.bg.includes('gradient') || tokens.bg.includes('linear')
  const isNight = theme === 'nightcity'

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: isGrad ? tokens.bg : undefined,
        backgroundColor: isGrad ? undefined : tokens.bg,
        fontFamily: tokens.fontFamily,
        color: tokens.text,
        position: 'relative',
      }}
    >
      {/* Night city background grid */}
      {isNight && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} />
      )}

      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <Header />
        <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {page === 'dashboard' && <Dashboard />}
          {page === 'b3' && <B3Page />}
          {page === 'domestic' && <DomesticPage />}
          {page === 'settings' && <SettingsPage />}
        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${tokens.scrollbarThumb}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${tokens.textMuted}; }
        input::placeholder { color: ${tokens.textMuted}; opacity: 0.7; }
        input, select, button { font-family: ${tokens.fontFamily}; }
        ${isNight ? `
          @keyframes neon-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        ` : ''}
      `}</style>
    </div>
  )
}

function App() {
  const [splashDone, setSplashDone] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <AppProvider>
      <AppInner splashDone={splashDone} setSplashDone={setSplashDone} />
    </AppProvider>
  )
}

function AppInner({ splashDone, setSplashDone }: { splashDone: boolean; setSplashDone: (v: boolean) => void }) {
  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      <div style={{ opacity: splashDone ? 1 : 0, transition: 'opacity 0.4s ease 0.1s', height: '100vh' }}>
        <MainLayout />
      </div>
    </>
  )
}

export default App