export interface AbaPaywayInstance {
  checkout: () => void
  closeCheckout?: (isAsk?: boolean) => void
  closeCheckoutByContinueUrl?: () => void
}

declare global {
  interface Window {
    AbaPayway?: AbaPaywayInstance
    checkout_callback?: (data?: unknown) => void
  }

  const AbaPayway: AbaPaywayInstance | undefined
}
