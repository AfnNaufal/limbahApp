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
  search: string
  year: string
  periodFilter: string
  setTheme: (t: ThemeId) => void
  setMode: (m: ModeId) => void
  setLang: (l: LangId) => void
  setPage: (p: PageId) => void
  setSidebarOpen: (o: boolean) => void
  setSearch: (s: string) => void
  setYear: (y: string) => void
  setPeriodFilter: (p: string) => void
  t: (key: string, fallback?: string) => string
  isRTL: boolean
}

const Ctx = createContext<AppCtx>(null as never)

const VALID_PAGES: PageId[] = ['dashboard', 'b3', 'domestic', 'b3-in', 'b3-out', 'waste-in', 'waste-out', 'settings']

function getPageFromHash(): PageId {
  const hash = window.location.hash.replace('#', '')
  return VALID_PAGES.includes(hash as PageId) ? (hash as PageId) : 'dashboard'
}

export function getPeriodDateRange(yearStr: string, periodStr: string): { from: string; to: string } {
  const y = parseInt(yearStr, 10) || new Date().getFullYear()

  if (periodStr === 'Q1') return { from: `${y}-01-01`, to: `${y}-03-31` }
  if (periodStr === 'Q2') return { from: `${y}-04-01`, to: `${y}-06-30` }
  if (periodStr === 'Q3') return { from: `${y}-07-01`, to: `${y}-09-30` }
  if (periodStr === 'Q4') return { from: `${y}-10-01`, to: `${y}-12-31` }

  if (/^\d{2}$/.test(periodStr)) {
    const m = parseInt(periodStr, 10)
    const lastDay = new Date(y, m, 0).getDate()
    const mm = m < 10 ? `0${m}` : `${m}`
    return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${lastDay}` }
  }

  return { from: `${y}-01-01`, to: `${y}-12-31` }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeId>('corporate')
  const [mode, setMode] = useState<ModeId>('light')
  const [lang, setLang] = useState<LangId>('id')
  const [page, setPageState] = useState<PageId>(getPageFromHash)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [year, setYear] = useState(() => new Date().getFullYear().toString())
  const [periodFilter, setPeriodFilter] = useState('all')

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
        search,
        year,
        periodFilter,
        setTheme,
        setMode,
        setLang,
        setPage,
        setSidebarOpen,
        setSearch,
        setYear,
        setPeriodFilter,
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