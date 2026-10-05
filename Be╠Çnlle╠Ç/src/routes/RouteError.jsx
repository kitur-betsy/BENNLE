import { useRouteError } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function RouteError() {
  const err = useRouteError()
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-muted">{err?.statusText || err?.message}</p>
        <Button to="/" className="mt-6">Back home</Button>
      </div>
    </div>
  )
}
