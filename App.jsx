import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { useSettings } from './store/settings'

export default function App() {
  const { name, description, load } = useSettings()
  useEffect(() => { load() }, [load])
  useEffect(() => {
    document.title = `${name} — Natural Skincare`
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [name, description])
  return <RouterProvider router={router} />
}
