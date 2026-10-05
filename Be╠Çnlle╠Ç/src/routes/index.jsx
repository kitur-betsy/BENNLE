import { createBrowserRouter, Navigate } from 'react-router-dom'
import StorefrontLayout from '../components/layout/StorefrontLayout'
import CheckoutLayout from '../components/layout/CheckoutLayout'
import { adminRoutes } from '../admin'
import RouteError from './RouteError'

// Route modules are lazy-loaded; each page is its own chunk.
const page = (loader) => async () => ({ Component: (await loader()).default })

export const router = createBrowserRouter([
  {
    element: <StorefrontLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, lazy: page(() => import('../pages/Home')) },
      { path: 'shop', lazy: page(() => import('../pages/Shop')) },
      { path: 'product/:slug', lazy: page(() => import('../pages/ProductDetail')) },
      { path: 'journal', lazy: page(() => import('../pages/Journal')) },
      { path: 'journal/:slug', lazy: page(() => import('../pages/JournalPost')) },
      { path: 'order/:id', lazy: page(() => import('../pages/OrderConfirmation')) },
      { path: 'wishlist', lazy: page(() => import('../pages/Wishlist')) },
      { path: 'track', lazy: page(() => import('../pages/TrackOrder')) },
      // Shoppers do not have accounts: old account links lead to guest order tracking.
      { path: 'account/*', element: <Navigate to="/track" replace /> },
      { path: 'login', element: <Navigate to="/" replace /> },
      { path: 'register', element: <Navigate to="/" replace /> },
      { path: '*', lazy: page(() => import('../pages/NotFound')) },
    ],
  },
  // Payment flow: minimal header, no footer.
  { element: <CheckoutLayout />, errorElement: <RouteError />, children: [{ path: 'checkout', lazy: page(() => import('../pages/Checkout')) }] },
  ...adminRoutes,
])
