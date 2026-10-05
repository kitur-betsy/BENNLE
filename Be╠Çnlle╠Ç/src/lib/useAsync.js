import { useEffect, useState } from 'react'

// Minimal data hook: swap for React Query / loaders when the backend lands.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  useEffect(() => {
    let live = true
    setState((s) => ({ ...s, loading: true, error: null }))
    fn().then((data) => live && setState({ data, error: null, loading: false }))
      .catch((error) => live && setState({ data: null, error, loading: false }))
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}

// useAsync plus a retry() that re-runs the request, for error states.
export function useRetryAsync(fn, deps = []) {
  const [n, setN] = useState(0)
  const state = useAsync(fn, [...deps, n])
  return { ...state, retry: () => setN((x) => x + 1) }
}
