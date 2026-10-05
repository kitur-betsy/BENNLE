import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { useUI } from '../../store/ui'
import { toast } from '../../lib/motion'

export default function Toaster() {
  const toasts = useUI((s) => s.toasts)
  const dismiss = useUI((s) => s.dismiss)
  return (
    <div className="fixed top-20 right-6 z-[100] space-y-2" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} layout variants={toast} initial="hidden" animate="show" exit="exit"
            className="flex items-center gap-3 rounded-xl border border-line bg-elevated px-4 py-3 text-sm shadow-lift">
            {t.type === 'error' ? <AlertCircle className="size-4 text-danger" /> : <CheckCircle2 className="size-4 text-accent" />}
            {t.message}
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss"><X className="size-4 text-muted" /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
