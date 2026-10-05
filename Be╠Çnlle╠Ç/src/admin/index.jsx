import { lazy, Suspense } from 'react'
import { AdminRoute } from './layout/AdminRoute'
import AdminLayout from './layout/AdminLayout'
import RouteError from '../routes/RouteError'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Products = lazy(() => import('./pages/Products'))
const Orders = lazy(() => import('./pages/Orders'))
const Payments = lazy(() => import('./pages/Payments'))
const Customers = lazy(() => import('./pages/Customers'))
const Website = lazy(() => import('./pages/Website'))
const Journal = lazy(() => import('./pages/Journal'))
const Messages = lazy(() => import('./pages/Messages'))
const Settings = lazy(() => import('./pages/Settings'))
const Payouts = lazy(() => import('./pages/Payouts'))
const Interest = lazy(() => import('./pages/Interest'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))

// Spread into your router: createBrowserRouter([...storeRoutes, ...adminRoutes])
export const adminRoutes = [
  { path: '/admin/login', element: <Suspense fallback={null}><Login /></Suspense> },
  { path: '/admin/reset-password', element: <Suspense fallback={null}><ResetPassword /></Suspense> },
  {
    path: '/admin',
    element: <AdminRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'products', element: <Products /> },
          { path: 'orders', element: <Orders /> },
          { path: 'payments', element: <Payments /> },
          { path: 'customers', element: <Customers /> },
          { path: 'website', element: <Website /> },
          { path: 'journal', element: <Journal /> },
          { path: 'messages', element: <Messages /> },
          { path: 'settings', element: <Settings /> },
          { path: 'payouts', element: <Payouts /> },
          { path: 'interest', element: <Interest /> },
        ],
      },
    ],
  },
]
