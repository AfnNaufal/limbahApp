import { useEffect, useState } from 'react'

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

/**
 * Low-level hook: subscribes to any raw media query string.
 * Used both for width breakpoints and input-capability queries.
 */
function useRawMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setMatches(e.matches)

    handler(mql)

    if (mql.addEventListener) {
      const listener = (e: MediaQueryListEvent) => handler(e)
      mql.addEventListener('change', listener)
      return () => mql.removeEventListener('change', listener)
    } else {
      // Safari fallback (older versions)
      const legacyMql = mql as MediaQueryList & {
        addListener: (l: (e: MediaQueryListEvent) => void) => void
        removeListener: (l: (e: MediaQueryListEvent) => void) => void
      }
      const listener = (e: MediaQueryListEvent) => handler(e)
      legacyMql.addListener(listener)
      return () => legacyMql.removeListener(listener)
    }
  }, [query])

  return matches
}

/**
 * Returns true while viewport width is <= maxWidth.
 * Uses matchMedia so it updates live on resize/rotate.
 */
export function useMediaQuery(maxWidth: number): boolean {
  return useRawMediaQuery(`(max-width: ${maxWidth}px)`)
}

export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_BREAKPOINT)
}

export function useIsTablet(): boolean {
  return useMediaQuery(TABLET_BREAKPOINT)
}

/**
 * Returns true when the primary input has no hover capability and is coarse
 * (i.e. a touchscreen) — regardless of viewport width. This is the correct
 * signal for deciding tap-to-show vs hover-to-show interactions, since a
 * narrow browser window on a desktop with a mouse still supports hover.
 */
export function useIsTouchDevice(): boolean {
  return useRawMediaQuery('(hover: none) and (pointer: coarse)')
}