import { createContext, useContext, useState, type ReactNode } from 'react'
import type { ThemeId, ModeId, ThemeTokens } from './theme'
import { getTokens } from './theme'
import type { LangId } from './i18n'
import { t as translate } from './i18n'

export type PageId = 'dashboard' | 'b3' | 'domestic' | 'settings'

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

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeId>('corporate')
  const [mode, setMode] = useState<ModeId>('light')
  const [lang, setLang] = useState<LangId>('id')
  const [page, setPage] = useState<PageId>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
