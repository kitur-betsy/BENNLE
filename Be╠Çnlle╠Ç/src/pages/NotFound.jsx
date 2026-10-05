import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useAsync } from '../lib/useAsync'
import { productsApi } from '../api/services'
import Button from '../components/ui/Button'

export default function NotFound() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const cats = useAsync(productsApi.categories)
  const go = (e) => { e.preventDefault(); navigate(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop') }
  const links = [{ to: '/shop', label: 'All products' }, ...(cats.data || []).map((c) => ({ to: `/shop?category=${c.id}`, label: c.label })), { to: '/journal', label: 'Journal' }]
  return (
    <div className="container-site py-20 text-center md:py-28">
      <p className="serif text-8xl italic text-muted/60 md:text-9xl" aria-hidden>404</p>
      <h1 className="serif mt-2 text-3xl md:text-4xl">This page has <em className="italic">dried out</em>.</h1>
      <p className="mx-auto mt-3 max-w-sm text-muted">We could not find what you were looking for, but your skin is still in good hands.</p>
      <form onSubmit={go} role="search" className="mx-auto mt-8 flex max-w-md items-center gap-2 rounded-full border border-line bg-elevated py-1.5 pl-5 pr-1.5 focus-within:border-fg">
        <Search className="size-4 text-muted" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" placeholder="Search for a serum, cleanser…" className="flex-1 bg-transparent text-sm outline-none" />
        <button className="rounded-full bg-inverse px-4 py-2 text-sm font-medium text-inverse-fg">Search</button>
      </form>
      <ul className="mt-6 flex flex-wrap justify-center gap-2">
        {links.map((l) => <li key={l.to}><Link to={l.to} className="rounded-full border border-line px-4 py-1.5 text-sm text-muted transition hover:border-fg hover:text-fg">{l.label}</Link></li>)}
      </ul>
      <Button to="/" variant="ghost" className="mt-8 underline">Back home</Button>
    </div>
  )
}
