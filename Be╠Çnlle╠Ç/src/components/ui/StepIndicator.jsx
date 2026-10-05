import { Check } from 'lucide-react'
import { cn } from '../../lib/format'

export default function StepIndicator({ steps, current }) {
  return (
    <ol className="flex items-center gap-2 text-sm" aria-label="Checkout progress">
      {steps.map((s, i) => {
        const done = i < current
        return (
          <li key={s} aria-current={i === current ? 'step' : undefined} className="flex items-center gap-2">
            <span className={cn('grid size-6 place-items-center rounded-full border text-xs font-medium',
              done ? 'border-accent-strong bg-accent-strong text-white' : i === current ? 'border-fg bg-fg text-bg' : 'border-line text-muted')}>
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={cn(i === current ? 'font-medium' : 'text-muted', i !== current && 'hidden sm:inline')}>{s}</span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-line sm:w-10" />}
          </li>
        )
      })}
    </ol>
  )
}
