import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// When running inside ABA PayWay iframe on continue_success_url, notify top parent immediately
if (typeof window !== 'undefined' && window.self !== window.top) {
  try {
    const params = new URLSearchParams(window.location.search)
    const tranId = params.get('tranId') || params.get('tran_id')
    window.parent?.postMessage({ type: 'ABA_PAYWAY_SUCCESS', tranId }, '*')
    if (typeof (window.parent as unknown as { checkout_callback?: (d?: unknown) => void })?.checkout_callback === 'function') {
      ;(window.parent as unknown as { checkout_callback: (d?: unknown) => void }).checkout_callback({ tranId })
    }
  } catch {
    // ignore cross-origin restrictions
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Failed to find root element')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
