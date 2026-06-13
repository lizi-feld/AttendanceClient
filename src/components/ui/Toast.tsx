import { create } from 'zustand'
import { CheckCircle2, X, XCircle } from 'lucide-react'

// ── Store ──────────────────────────────────────────────────────────────────────

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error'
}

interface ToastStore {
  toasts: ToastItem[]
  show: (message: string, type?: 'success' | 'error') => void
  dismiss: (id: number) => void
}

let _nextId = 0
const DURATION_MS = 4000

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  show: (message, type = 'success') => {
    const id = ++_nextId
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      DURATION_MS
    )
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// ── Renderer — mount once in AppLayout ────────────────────────────────────────

export function Toaster() {
  const { toasts, dismiss } = useToast()
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
            pointer-events-auto animate-fade-in
            ${t.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
        >
          {t.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            : <XCircle className="h-4 w-4 flex-shrink-0" />}
          <span>{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="opacity-70 hover:opacity-100 transition-opacity mr-1"
            aria-label="סגור"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
