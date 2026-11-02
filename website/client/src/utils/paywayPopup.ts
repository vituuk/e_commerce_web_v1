import { extractErrorMessage } from '@/services/client'
import { checkoutPaywayPayment, verifyPaywayPayment } from '@/services/payment.service'
import { playPaymentSuccessSound } from './voice'
import type { AbaPaywayInstance } from '@/types/aba-payway'
import type { ToastType } from '@/types/navigation'
import type { Order } from '@/types/order'
import type { PaymentRecord, PaywayCheckoutResponse } from '@/types/payment'

const ABA_PLUGIN_SRC = 'https://checkout.payway.com.kh/plugins/checkout2-0.js'

let activePollTimer: ReturnType<typeof setInterval> | null = null
let activeTimeoutTimer: ReturnType<typeof setTimeout> | null = null
let activeMessageListener: ((e: MessageEvent) => void) | null = null
let isOpeningPopup = false

/**
 * Resolves ABA PayWay's checkout2-0.js global object whether declared in
 * global lexical scope (`class AbaPayway` / `const AbaPayway`) or on `window`.
 */
export function getAbaPayway(): AbaPaywayInstance | undefined {
  if (typeof AbaPayway !== 'undefined' && AbaPayway && typeof AbaPayway.checkout === 'function') {
    return AbaPayway
  }
  if (
    typeof window !== 'undefined' &&
    window.AbaPayway &&
    typeof window.AbaPayway.checkout === 'function'
  ) {
    return window.AbaPayway
  }
  try {
    const lexical = new Function(
      'return typeof AbaPayway !== "undefined" ? AbaPayway : undefined',
    )() as AbaPaywayInstance | undefined
    if (lexical && typeof lexical.checkout === 'function') {
      return lexical
    }
  } catch {
    // Ignore eval/CSP errors; typeof AbaPayway above already resolves standard global bindings
  }
  return undefined
}

async function ensureAbaPluginReady(): Promise<AbaPaywayInstance | undefined> {
  const ready = getAbaPayway()
  if (ready) return ready

  if (typeof document !== 'undefined') {
    const existingScript = document.querySelector('script[src*="checkout2-0.js"]')
    if (!existingScript) {
      const script = document.createElement('script')
      script.src = ABA_PLUGIN_SRC
      script.defer = true
      document.body.appendChild(script)
    }
  }

  return new Promise((resolve) => {
    let attempts = 0
    const timer = setInterval(() => {
      attempts += 1
      const aba = getAbaPayway()
      if (aba) {
        clearInterval(timer)
        resolve(aba)
      } else if (attempts >= 50) {
        clearInterval(timer)
        resolve(undefined)
      }
    }, 100)
  })
}

export function stopPaywayPolling(): void {
  if (activePollTimer) {
    clearInterval(activePollTimer)
    activePollTimer = null
  }
  if (activeTimeoutTimer) {
    clearTimeout(activeTimeoutTimer)
    activeTimeoutTimer = null
  }
  if (activeMessageListener && typeof window !== 'undefined') {
    window.removeEventListener('message', activeMessageListener)
    activeMessageListener = null
  }
}

/**
 * Completely closes and destroys the ABA PayWay KHQR popup modal and all its
 * overlay/backdrop elements from the DOM, leaving no blank cards or stuck modals.
 */
export function closeAbaPopupInPlace(): void {
  if (typeof document === 'undefined') return

  const aba = getAbaPayway()
  if (aba && typeof aba.closeCheckout === 'function') {
    try {
      aba.closeCheckout(false)
    } catch {
      // ignore
    }
  }
  if (aba && typeof aba.closeCheckoutByContinueUrl === 'function') {
    try {
      aba.closeCheckoutByContinueUrl()
    } catch {
      // ignore
    }
  }

  const iframe = document.querySelector<HTMLIFrameElement>('iframe[name="aba_webservice"]')
  if (iframe) {
    try {
      iframe.src = 'about:blank'
    } catch {
      // Ignore cross-origin frame access
    }
    let p = iframe.parentElement
    while (p && p !== document.body) {
      const nextP = p.parentElement
      if (
        p.id?.toLowerCase().includes('aba') ||
        p.className?.toLowerCase().includes('aba') ||
        p.className?.toLowerCase().includes('modal')
      ) {
        p.remove()
      }
      p = nextP
    }
    iframe.remove()
  }

  // Remove any modal, overlay or backdrop containers created by PayWay outside #root
  document
    .querySelectorAll<HTMLElement>(
      '#aba_main_modal, [id*="aba"], [class*="aba-modal"], [class*="aba_modal"], .modal-backdrop, .aba-modal-backdrop',
    )
    .forEach((el) => {
      if (el.id !== 'root' && !el.closest('#root')) {
        el.remove()
      }
    })

  document.getElementById('aba_merchant_request')?.remove()
  document.body.classList.remove('aba-modal-open', 'modal-open')
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
}

export interface OpenAbaPaywayPopupParams {
  order: Order
  onPaymentSuccess?: (payment?: PaymentRecord) => void
  onPaymentUpdated?: (payment?: PaymentRecord) => void
  showToast: (message: string, type?: ToastType) => void
}

/**
 * Directly requests a signed KHQR payload for `order`, builds `#aba_merchant_request`,
 * opens the official ABA PayWay KHQR popup overlay (`AbaPayway.checkout()`) on top of
 * the current page, polls verification, and navigates home upon success.
 */
export async function openAbaPaywayKhqrPopup({
  order,
  onPaymentSuccess,
  onPaymentUpdated,
  showToast,
}: OpenAbaPaywayPopupParams): Promise<void> {
  if (!order?.id || isOpeningPopup) return
  isOpeningPopup = true

  try {
    stopPaywayPolling()

    const aba = await ensureAbaPluginReady()
    if (!aba) {
      showToast(
        'ABA PayWay checkout plugin is still loading. Please try again in a moment.',
        'error',
      )
      return
    }

    const data: PaywayCheckoutResponse | null = await checkoutPaywayPayment({
      orderId: order.id,
      payment_option: 'abapay_khqr',
    })

    if (!data) {
      throw new Error('Failed to create ABA PayWay KHQR payment')
    }

    const actionUrl = data.payway?.action || data.action_url || ''
    const method = data.payway?.method || data.method || 'POST'
    const target = data.payway?.target || data.target || 'aba_webservice'
    const allFields: Record<string, unknown> = {
      ...(data.fields || {}),
      ...(data.payway?.fields || {}),
      // Force ABA PayWay modal popup view (these two fields are NOT part of HMAC hash)
      view_type: 'popup',
      payment_gate: 0,
    }

    const tranId = String(
      data.payment?.paywayTranId ||
        allFields.tran_id ||
        '',
    )

    // Remove any previous #aba_merchant_request form so ABA reads the new tran_id
    document.getElementById('aba_merchant_request')?.remove()

    // Clear inline display:none from any previous popup close before calling aba.checkout()
    document
      .querySelectorAll<HTMLElement>('#aba_main_modal, .aba-modal, .aba-checkout-modal, #aba-modal')
      .forEach((el) => {
        el.style.removeProperty('display')
      })

    const form = document.createElement('form')
    form.id = 'aba_merchant_request'
    form.name = 'aba_merchant_request'
    form.method = method
    form.action = actionUrl
    form.target = target

    Object.entries(allFields).forEach(([key, val]) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = key
      input.value = String(val ?? '')
      form.appendChild(input)
    })

    document.body.appendChild(form)

    let completed = false

    const completeVerifiedPayment = (verifiedPayment: PaymentRecord) => {
      if (completed) return
      completed = true
      stopPaywayPolling()
      closeAbaPopupInPlace()
      playPaymentSuccessSound()
      showToast('Payment approved! Order is now marked as PAID.', 'success')
      onPaymentUpdated?.(verifiedPayment)
      onPaymentSuccess?.(verifiedPayment)
    }

    // Called if the iframe redirects to continue_success_url and posts a message
    activeMessageListener = async (event: MessageEvent) => {
      if (event.data?.type === 'ABA_PAYWAY_SUCCESS') {
        const id = String(event.data?.tranId || tranId)
        if (id && !completed) {
          try {
            const verified = await verifyPaywayPayment(id)
            if (verified?.status === 'success') {
              completeVerifiedPayment(verified)
            }
          } catch {
            // retry in background poll
          }
        }
      }
    }
    window.addEventListener('message', activeMessageListener)

    // Called by ABA's checkout2-0.js when customer finishes payment inside the popup
    window.checkout_callback = async () => {
      if (completed || !tranId) return
      for (let attempt = 0; attempt < 3; attempt += 1) {
        if (completed) return
        try {
          const verified = await verifyPaywayPayment(tranId)
          if (verified?.status === 'success') {
            completeVerifiedPayment(verified)
            return
          }
        } catch {
          // Retry briefly while ABA settles transaction status
        }
        await new Promise((r) => setTimeout(r, 1000))
      }
    }

    // Poll backend check-transaction-2 every 2.5s while customer scans KHQR in ABA Mobile
    if (tranId) {
      activePollTimer = setInterval(async () => {
        if (completed) {
          stopPaywayPolling()
          return
        }
        try {
          const updated = await verifyPaywayPayment(tranId)
          if (updated?.status === 'success') {
            completeVerifiedPayment(updated)
          } else if (updated?.status === 'failed') {
            completed = true
            stopPaywayPolling()
            closeAbaPopupInPlace()
            showToast(`Payment failed: ${updated.remark || 'Declined'}`, 'error')
          }
        } catch {
          // Continue polling silently while waiting for scan
        }
      }, 2500)

      activeTimeoutTimer = setTimeout(() => {
        stopPaywayPolling()
      }, 5 * 60 * 1000)
    }

    // Open official ABA PayWay KHQR popup modal directly over the current UI
    aba.checkout()
  } catch (err: unknown) {
    showToast(extractErrorMessage(err, 'Could not open ABA PayWay KHQR popup'), 'error')
  } finally {
    isOpeningPopup = false
  }
}
