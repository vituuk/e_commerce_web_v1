export interface AbaPayWayFormFields {
  req_time: string
  merchant_id: string
  tran_id: string
  amount: string
  items: string
  firstname: string
  lastname: string
  email: string
  phone: string
  type: string
  payment_option: string
  return_url: string
  continue_success_url: string
  return_params: string
  hash: string
}

export interface AbaPayWayCheckoutResponse {
  actionUrl: string
  fields: AbaPayWayFormFields
}

declare global {
  interface Window {
    AbaPayway?: {
      checkout: () => void
      closeCheckout: () => void
    }
  }
}

