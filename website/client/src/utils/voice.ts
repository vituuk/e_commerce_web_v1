/**
 * Voice & Sound Notification Utility for Storefront
 *
 * Supports:
 * 1. Your own custom sound / recorded voice file (.mp3, .wav, .m4a) in `public/sounds/`
 * 2. Browser text-to-speech (Web Speech API) fallback
 */

export interface PlayVoiceOptions {
  soundUrl?: string
  fallbackText?: string
  rate?: number
  pitch?: number
  volume?: number
  lang?: string
}

let cachedVoices: SpeechSynthesisVoice[] = []

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices()
  if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices()
    }
  }
}

/**
 * Speaks text using the browser's native text-to-speech engine.
 */
export function playVoiceNotification(
  text: string = 'ការបញ្ជាទិញរបស់អ្នកទទួលបានជោគជ័យ!',
  options: PlayVoiceOptions = {},
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return
  }

  try {
    const synth = window.speechSynthesis
    synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = options.rate ?? 0.95
    utterance.pitch = options.pitch ?? 1.0
    utterance.volume = options.volume ?? 1.0
    utterance.lang = options.lang ?? 'km-KH'

    // Look for a Khmer voice, or best available
    const voices = cachedVoices.length > 0 ? cachedVoices : synth.getVoices()
    if (voices.length > 0) {
      const targetLang = (options.lang ?? 'km').toLowerCase()
      const khmerVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('km') ||
          v.lang.toLowerCase().includes('khmer') ||
          v.name.toLowerCase().includes('khmer') ||
          v.name.toLowerCase().includes('cambodia'),
      )

      if (khmerVoice) {
        utterance.voice = khmerVoice
      } else {
        const naturalVoice = voices.find(
          (v) =>
            v.lang.startsWith(targetLang.slice(0, 2)) ||
            v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.default,
        )
        if (naturalVoice) utterance.voice = naturalVoice
      }
    }

    synth.speak(utterance)
  } catch (err) {
    console.warn('[playVoiceNotification] Speech synthesis error:', err)
  }
}

/**
 * Plays a custom sound file (.ogg / .mp3 / .wav) from public folder.
 * Accepts a single URL or an array of URLs to try in order.
 * If all fail or are missing, falls back to text-to-speech synthesis.
 */
export function playCustomSound(
  soundUrls: string | string[],
  fallbackText?: string,
  options: PlayVoiceOptions = {},
): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)

  const urls = Array.isArray(soundUrls) ? soundUrls : [soundUrls]

  const tryPlay = (index: number): Promise<boolean> => {
    if (index >= urls.length) {
      if (fallbackText) {
        playVoiceNotification(fallbackText, options)
      }
      return Promise.resolve(false)
    }

    return new Promise((resolve) => {
      try {
        const audio = new Audio(urls[index])
        audio.volume = options.volume ?? 1.0

        let resolved = false
        const done = (success: boolean) => {
          if (!resolved) {
            resolved = true
            resolve(success)
          }
        }

        audio.onended = () => done(true)
        audio.onerror = () => {
          tryPlay(index + 1).then(done)
        }

        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => done(true))
            .catch(() => {
              tryPlay(index + 1).then(done)
            })
        }
      } catch {
        tryPlay(index + 1).then(resolve)
      }
    })
  }

  return tryPlay(0)
}

/**
 * Plays the Order Success Sound.
 * Connects directly to `/sounds/orders.mp3` in the public folder.
 */
export function playOrderSuccessSound(): void {
  void playCustomSound(
    [
      '/sounds/orders.mp3',
      '/sounds/order.mp3',
      '/sounds/sucess-order.ogg',
      '/sounds/order-success.mp3',
    ],
    'ការបញ្ជាទិញរបស់អ្នកទទួលបានជោគជ័យ!',
    { lang: 'km-KH' },
  )
}

/**
 * Plays the Payment Approved Sound.
 * Connects directly to `/sounds/payment.mp3` in the public folder.
 */
export function playPaymentSuccessSound(): void {
  void playCustomSound(
    [
      '/sounds/payment.mp3',
      '/sounds/payments.mp3',
      '/sounds/sucess-payment.ogg',
      '/sounds/payment-success.mp3',
    ],
    'ការទូទាត់ប្រាក់របស់អ្នកទទួលបានជោគជ័យ!',
    { lang: 'km-KH' },
  )
}
