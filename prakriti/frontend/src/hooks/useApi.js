import { useState, useEffect, useCallback } from 'react'

export function useApi(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const r = await fetchFn()
      setData(r.data)
      setError(null)
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Error loading data')
    } finally {
      setLoading(false)
    }
  }, deps) // eslint-disable-line

  useEffect(() => { load() }, [load])

  return { data, loading, error, refetch: load }
}

export function usePolling(fetchFn, intervalMs = 5000, deps = []) {
  const { data, loading, error, refetch } = useApi(fetchFn, deps)

  useEffect(() => {
    const t = setInterval(refetch, intervalMs)
    return () => clearInterval(t)
  }, [refetch, intervalMs])

  return { data, loading, error, refetch }
}
