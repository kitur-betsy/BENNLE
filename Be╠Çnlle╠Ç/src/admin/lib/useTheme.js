import { useUI } from '../../store/ui'

// Shares the storefront theme store; null means "follow the system".
export function useTheme() {
  const stored = useUI((s) => s.theme)
  const toggle = useUI((s) => s.toggleTheme)
  const theme = stored ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  return { theme, toggle }
}
