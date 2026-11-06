import { useEffect } from 'react'
import { openAbaPaywayKhqrPopup } from '@/utils/paywayPopup'
import type { ToastType } from '@/types/navigation'
import type { Order } from '@/types/order'
import type { PaymentRecord } from '@/types/payment'

export interface PaywayModalProps {
  order: Order | null
  initialPaymentOption?: string
  onClose: () => void
  onPaymentSuccess?: (payment?: PaymentRecord) => void
  onPaymentUpdated?: (payment?: PaymentRecord) => void
  showToast: (message: string, type?: ToastType) => void
}

/**
 * Headless ABA PayWay KHQR Popup launcher (renders no custom modal UI).
 * Primary checkout invocation runs directly via `handleOpenPaywayModal` on button click.
 */
export function PaywayModal({
  order,
  initialPaymentOption,
  onClose,
  onPaymentSuccess,
  onPaymentUpdated,
  showToast,
}: PaywayModalProps) {
  useEffect(() => {
    if (!order?.id) return
    void openAbaPaywayKhqrPopup({
      order,
      paymentOption: initialPaymentOption,
      onPaymentSuccess,
      onPaymentUpdated,
      showToast,
    }).finally(() => {
      onClose()
    })
  }, [order?.id, initialPaymentOption])

  return null
}

export default PaywayModal
