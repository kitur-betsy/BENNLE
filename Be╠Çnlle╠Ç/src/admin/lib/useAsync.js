import { useCallback, useEffect, useState } from 'react'

// Small data-fetching hook: { data, setData, loading, error, reload }
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps)

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await run()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error }))
    }
  }, [run])

  useEffect(() => { reload() }, [reload])

  const setData = useCallback((updater) =>
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })), [])

  return { ...state, setData, reload }
}
