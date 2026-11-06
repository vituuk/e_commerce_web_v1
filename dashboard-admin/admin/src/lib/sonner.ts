type ToastListener = (message: string) => void

const listeners = new Set<ToastListener>()

export function subscribeToast(listener: ToastListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function emitToast(message: string) {
  listeners.forEach((fn) => fn(message))
}

export const toast = Object.assign(
  (message: string) => {
    emitToast(message)
  },
  {
    success: (message: string) => emitToast(message),
    error: (message: string) => emitToast(message),
    info: (message: string) => emitToast(message),
    warning: (message: string) => emitToast(message),
  },
)

export default toast

