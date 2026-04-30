declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (
            input: HTMLElement,
            options?: {
              types?: string[]
            }
          ) => {
            addListener: (event: string, handler: () => void) => void
            getPlace: () => {
              formatted_address?: string
              name?: string
            } | null
          }
        }
      }
    }
    lenis?: {
      scrollTo: (target: string | number | HTMLElement, options?: object) => void
    }
  }

  interface DeviceOrientationEventWithPermission extends DeviceOrientationEvent {
    requestPermission?: () => Promise<'granted' | 'denied'>
  }

  interface BloomEffectWithLuminanceMaterial {
    blendMode: {
      opacity: { value: number }
    }
    luminanceMaterial: {
      threshold: number
      smoothing: number
    }
  }
}

export {}
