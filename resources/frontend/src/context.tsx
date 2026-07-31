import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { ThemeId, ModeId, ThemeTokens } from './theme'
import { getTokens } from './theme'
import type { LangId } from './i18n'
import { t as translate } from './i18n'

export type PageId = 'dashboard' | 'b3' | 'domestic' | 'b3-in' | 'b3-out' | 'waste-in' | 'waste-out' | 'settings'

interface AppCtx {
  theme: ThemeId
  mode: ModeId
  lang: LangId
  page: PageId
  tokens: ThemeTokens
  sidebarOpen: boolean
  setTheme: (t: ThemeId) => void
  setMode: (m: ModeId) => void
  setLang: (l: LangId) => void
  setPage: (p: PageId) => void
  setSidebarOpen: (o: boolean) => void
  t: (key: string, fallback?: string) => string
  isRTL: boolean
}

const Ctx = createContext<AppCtx>(null as never)

const VALID_PAGES: PageId[] = ['dashboard', 'b3', 'domestic', 'b3-in', 'b3-out', 'waste-in', 'waste-out', 'settings']

function getPageFromHash(): PageId {
  const hash = window.location.hash.replace('#', '')
  return VALID_PAGES.includes(hash as PageId) ? (hash as PageId) : 'dashboard'
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeId>('corporate')
  const [mode, setMode] = useState<ModeId>('light')
  const [lang, setLang] = useState<LangId>('id')
  const [page, setPageState] = useState<PageId>(getPageFromHash)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const setPage = (p: PageId) => {
    setPageState(p)
    if (window.location.hash !== `#${p}`) {
      window.location.hash = p
    }
  }

  useEffect(() => {
    const handleHashChange = () => {
      const newPage = getPageFromHash()
      setPageState(newPage)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const tokens = getTokens(theme, mode)

  const isRTL = lang === 'ar'

  const tFn = (key: string, fallback?: string) => translate(lang, key, fallback)

  return (
    <Ctx.Provider
      value={{
        theme,
        mode,
        lang,
        page,
        tokens,
        sidebarOpen,
        setTheme,
        setMode,
        setLang,
        setPage,
        setSidebarOpen,
        t: tFn,
        isRTL,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useApp() {
  return useContext(Ctx)
}