import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, X, XCircle } from 'lucide-react'
import { Button, IconButton } from './ui'
import { cn } from '../lib/utils'
import { useToast } from '../store/toast'

const ease = [0.25, 0.46, 0.45, 0.94]

function useOverlay(open, onClose, panelRef) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      // Basic focus trap
      if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    const t = setTimeout(() => panelRef.current?.querySelector('input,select,textarea,button')?.focus(), 50)
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); clearTimeout(t) }
  }, [open, onClose, panelRef])
}

/* Right-side slide-over used for every create/edit form and detail view */
export function Drawer({ open, onClose, title, description, children, footer, width = 'max-w-xl' }) {
  const ref = useRef(null)
  useOverlay(open, onClose, ref)
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <motion.div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease }}
            className={cn('absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl dark:bg-neutral-900', width)}
          >
            <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5 dark:border-neutral-800">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                {description && <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>}
              </div>
              <IconButton icon={X} label="Close" onClick={onClose} />
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
            {footer && <footer className="flex items-center justify-end gap-2 border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">{footer}</footer>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Delete', loading }) {
  const ref = useRef(null)
  useOverlay(open, onClose, ref)
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] grid place-items-center p-4">
          <motion.div className="absolute inset-0 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            ref={ref}
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease }}
            className="relative w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <span className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h2 className="font-semibold tracking-tight">{title}</h2>
            {description && <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{description}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button variant="danger" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export function Toaster() {
  const { toasts, dismiss } = useToast()
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 60, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.35, ease }}
            className="pointer-events-auto flex min-w-64 items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
          >
            {t.tone === 'error'
              ? <XCircle className="h-4 w-4 shrink-0 text-red-500" />
              : <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/* Sticky bar that appears when a form has unsaved changes */
export function SaveBar({ dirty, saving, onSave, onDiscard, extra }) {
  return (
    <AnimatePresence>
      {dirty && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease }}
          className="sticky bottom-4 z-30 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white/90 px-4 py-3 shadow-xl backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/90"
        >
          <p className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Unsaved changes
          </p>
          <div className="flex items-center gap-2">
            {extra}
            <Button variant="ghost" size="sm" onClick={onDiscard}>Discard</Button>
            <Button size="sm" loading={saving} onClick={onSave}>Save changes</Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
