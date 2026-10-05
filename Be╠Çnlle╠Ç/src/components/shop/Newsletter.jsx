import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { newsletterSchema } from '../../lib/schemas'
import { messagesApi } from '../../api/services'
import { useUI } from '../../store/ui'
import Button from '../ui/Button'
import { inputCls } from '../ui/Field'

export default function Newsletter() {
  const notify = useUI((s) => s.notify)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(newsletterSchema) })
  const onSubmit = async ({ email }) => {
    try { await messagesApi.subscribe(email); notify('Thanks for subscribing'); reset() }
    catch (e) { notify(e.message, 'error') }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="w-full max-w-sm">
      <div className="flex gap-2">
        <input type="email" placeholder="Your email" aria-label="Email" className={inputCls} {...register('email')} />
        <Button type="submit" loading={isSubmitting}>Join</Button>
      </div>
      {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
    </form>
  )
}
