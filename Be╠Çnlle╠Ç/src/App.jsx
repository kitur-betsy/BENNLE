import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { useSettings } from './store/settings'
import { initSessionSync } from './api/session'
import { contentApi } from './api/services'
import { applyBrand } from './lib/brand'

export default function App() {
  const { name, description, load } = useSettings()
  useEffect(() => { load() }, [load])
  useEffect(() => initSessionSync(), [])
  useEffect(() => { contentApi.home().then((d) => applyBrand(d.brand)).catch(() => {}) }, [])
  useEffect(() => {
    document.title = `${name} — Natural Skincare`
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [name, description])
  return <RouterProvider router={router} />
}
