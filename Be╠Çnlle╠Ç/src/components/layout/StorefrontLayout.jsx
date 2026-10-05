import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import Toaster from '../ui/Toaster'
import { CartDrawer, MobileNav, SearchModal } from './Drawers'

export default function StorefrontLayout() {
  const { hash } = useLocation()
  useEffect(() => { if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }) }, [hash])
  return (
    <>
      <Header />
      <main><Outlet /></main>
      <Footer />
      <CartDrawer /><MobileNav /><SearchModal /><Toaster />
      <ScrollRestoration getKey={(l) => l.pathname + l.search} />
    </>
  )
}
