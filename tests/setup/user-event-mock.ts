// Mock for @testing-library/user-event
// This provides a basic implementation that maps to fireEvent
import { fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

// Parse special key notation like {Enter} to just Enter
const parseSpecialKey = (text: string): string => {
  const match = text.match(/^\{(.+)\}$/)
  return match ? match[1] : text
}

// Get all tabbable elements in document order
const getTabbableElements = (): HTMLElement[] => {
  const tabbableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ]
  const elements: HTMLElement[] = []
  tabbableSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      if (el instanceof HTMLElement && el.offsetParent !== null) {
        elements.push(el)
      }
    })
  })
  return elements
}

const userEvent = {
  setup: () => ({
    click: (element: Element, eventInit?: MouseEventInit) => {
      if ('pointermove' in element) {
        fireEvent.pointerMove(element as unknown as HTMLElement, eventInit)
      }
      return fireEvent.click(element as unknown as HTMLElement, eventInit)
    },
    dblClick: (element: Element, eventInit?: MouseEventInit) => {
      return fireEvent.dblClick(element as unknown as HTMLElement, eventInit)
    },
    tripleClick: (element: Element) => {
      // fireEvent doesn't have tripleClick, so just click three times
      fireEvent.click(element as unknown as HTMLElement)
      fireEvent.click(element as unknown as HTMLElement)
      fireEvent.click(element as unknown as HTMLElement)
    },
    hover: (element: Element) => {
      fireEvent.pointerEnter(element as unknown as HTMLElement)
    },
    unhover: (element: Element) => {
      fireEvent.pointerLeave(element as unknown as HTMLElement)
    },
    selectOptions: (element: HTMLElement, values: string | string[]) => {
      fireEvent.change(element, { target: { value: Array.isArray(values) ? values[0] : values } })
    },
    deselectOptions: (element: HTMLElement, values: string | string[]) => {
      fireEvent.change(element, { target: { value: '' } })
    },
    type: (element: Element, text: string, options?: { delay?: number }) => {
      fireEvent.input(element as unknown as HTMLElement, { target: { value: text }, bubbles: true })
      return Promise.resolve()
    },
    paste: async (element: Element, text: string) => {
      fireEvent.paste(element as unknown as HTMLElement, {
        clipboardData: {
          getData: () => text,
        },
      } as unknown as ClipboardEvent)
    },
    keyboard: (text: string) => {
      const key = parseSpecialKey(text)
      fireEvent.keyDown(document.activeElement!, { key })
      fireEvent.keyUp(document.activeElement!, { key })
    },
    tab: () => {
      fireEvent.keyDown(document.activeElement!, { key: 'Tab' })
      fireEvent.keyUp(document.activeElement!, { key: 'Tab' })
      // Actually move focus to next tabbable element
      const tabbable = getTabbableElements()
      const currentIndex = tabbable.indexOf(document.activeElement as HTMLElement)
      if (currentIndex >= 0 && currentIndex < tabbable.length - 1) {
        tabbable[currentIndex + 1].focus()
      }
    },
    clear: (element: Element) => {
      fireEvent.change(element as unknown as HTMLInputElement, { target: { value: '' } })
    },
    copy: () => {
      document.execCommand = vi.fn()
    },
    cut: () => {
      document.execCommand = vi.fn()
    },
  }),
  click: (element: Element, eventInit?: MouseEventInit) => {
    return fireEvent.click(element as unknown as HTMLElement, eventInit)
  },
  dblClick: (element: Element, eventInit?: MouseEventInit) => {
    return fireEvent.dblClick(element as unknown as HTMLElement, eventInit)
  },
  hover: (element: Element) => {
    fireEvent.mouseEnter(element as unknown as HTMLElement)
  },
  unhover: (element: Element) => {
    fireEvent.mouseLeave(element as unknown as HTMLElement)
  },
  selectOptions: (element: HTMLElement, values: string | string[]) => {
    fireEvent.change(element, { target: { value: Array.isArray(values) ? values[0] : values } })
  },
  type: async (element: Element, text: string) => {
    fireEvent.input(element as unknown as HTMLElement, { target: { value: text }, bubbles: true })
  },
  paste: async (element: Element, text: string) => {
    fireEvent.paste(element as unknown as HTMLElement, {
      clipboardData: {
        getData: () => text,
      },
    } as unknown as ClipboardEvent)
  },
  keyboard: (text: string) => {
    const key = parseSpecialKey(text)
    fireEvent.keyDown(document.activeElement!, { key })
    fireEvent.keyUp(document.activeElement!, { key })
  },
  tab: () => {
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' })
    fireEvent.keyUp(document.activeElement!, { key: 'Tab' })
    // Actually move focus to next tabbable element
    const tabbable = getTabbableElements()
    const currentIndex = tabbable.indexOf(document.activeElement as HTMLElement)
    if (currentIndex >= 0 && currentIndex < tabbable.length - 1) {
      tabbable[currentIndex + 1].focus()
    }
  },
  clear: (element: Element) => {
    fireEvent.change(element as unknown as HTMLInputElement, { target: { value: '' } })
  },
}

export default userEvent
