import { Link, Outlet, ScrollRestoration } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useSettings } from '../../store/settings'
import Toaster from '../ui/Toaster'

// Minimal shell for the payment flow: brand, a reassurance label and nothing else.
export default function CheckoutLayout() {
  const name = useSettings((s) => s.name)
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line">
        <div className="container-site flex h-16 items-center justify-between">
          <Link to="/" className="text-lg font-semibold tracking-tight">{name}</Link>
          <p className="flex items-center gap-1.5 text-sm text-muted"><Lock className="size-4" /> Secure checkout</p>
        </div>
      </header>
      <main><Outlet /></main>
      <Toaster />
      <ScrollRestoration />
    </div>
  )
}
