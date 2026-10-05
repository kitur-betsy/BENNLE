import { Link } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import { useSettings } from '../../store/settings'
import { useAsync } from '../../lib/useAsync'
import { contentApi, productsApi } from '../../api/services'
import { copy as defaultCopy } from '../../data/content'
import Newsletter from '../shop/Newsletter'

const year = new Date().getFullYear()

export default function Footer() {
  const { name, description, contact } = useSettings()
  const { data: cats } = useAsync(productsApi.categories)
  const { data: content } = useAsync(contentApi.home)
  const copy = { ...defaultCopy, ...content?.copy }
  const isAdmin = useAuth((s) => s.user?.role === 'admin')
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-site grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-semibold tracking-tight">{name}</p>
          <p className="mt-2 max-w-xs text-sm text-muted">{description}</p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-medium">Shop</p>
          <ul className="space-y-2 text-muted">
            <li><Link className="hover:text-fg" to="/shop">All products</Link></li>
            {cats?.map((c) => <li key={c.id}><Link className="hover:text-fg" to={`/shop?category=${c.id}`}>{c.label}</Link></li>)}
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-medium">Company</p>
          <ul className="space-y-2 text-muted">
            <li><Link className="hover:text-fg" to="/#about">About</Link></li>
            <li><Link className="hover:text-fg" to="/journal">Journal</Link></li>
            <li><Link className="hover:text-fg" to="/track">Track your order</Link></li>
            <li><Link className="hover:text-fg" to="/#contact">Contact</Link></li>
            <li>{contact.email}</li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-medium">{copy.newsletterTitle}</p>
          <p className="mb-3 text-muted">{copy.newsletterText}</p>
          <Newsletter />
        </div>
      </div>
      <div className="container-site flex flex-col items-center justify-between gap-2 border-t border-line py-6 text-xs text-muted sm:flex-row">
        <span>© {year} {name}. All rights reserved.</span>
        <Link to={isAdmin ? '/admin' : '/admin/login'} className="underline-offset-4 hover:text-fg hover:underline">{isAdmin ? 'Admin dashboard' : 'Admin login'}</Link>
      </div>
    </footer>
  )
}
