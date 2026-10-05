import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/format'

// Single-open accordion built on native buttons: keyboard accessible, aria-expanded wired.
export default function Accordion({ items, defaultOpen = 0, className }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={cn('divide-y divide-line border-y border-line', className)}>
      {items.map((it, i) => {
        const isOpen = open === i
        return (
          <div key={it.title}>
            <h3>
              <button type="button" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen} aria-controls={`acc-${i}`}
                className="flex w-full items-center justify-between py-4 text-left text-sm font-medium">
                {it.title}
                <ChevronDown className={cn('size-4 text-muted transition-transform', isOpen && 'rotate-180')} />
              </button>
            </h3>
            <div id={`acc-${i}`} role="region" hidden={!isOpen} className="pb-5 text-sm leading-relaxed text-muted">{it.content}</div>
          </div>
        )
      })}
    </div>
  )
}
