import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactSchema } from '../../lib/schemas'
import { messagesApi } from '../../api/services'
import { useUI } from '../../store/ui'
import Field from '../ui/Field'
import Button from '../ui/Button'

export default function ContactForm() {
  const notify = useUI((s) => s.notify)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(contactSchema) })
  const onSubmit = async (v) => {
    try { await messagesApi.contact(v); notify('Message sent. We will reply within a day.'); reset() }
    catch (e) { notify(e.message, 'error') }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors.name?.message} {...register('name')} />
        <Field label="Email" type="email" error={errors.email?.message} {...register('email')} />
      </div>
      <Field label="Message" as="textarea" rows={5} error={errors.message?.message} {...register('message')} />
      <Button type="submit" loading={isSubmitting}>Send message</Button>
    </form>
  )
}
