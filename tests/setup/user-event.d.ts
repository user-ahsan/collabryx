// Type declaration for the @testing-library/user-event mock
declare module '@testing-library/user-event' {
  const userEvent: {
    setup: () => {
      click: (element: Element, eventInit?: MouseEventInit) => void
      dblClick: (element: Element, eventInit?: MouseEventInit) => void
      tripleClick: (element: Element) => void
      hover: (element: Element) => void
      unhover: (element: Element) => void
      selectOptions: (element: HTMLElement, values: string | string[]) => void
      deselectOptions: (element: HTMLElement, values: string | string[]) => void
      type: (element: Element, text: string, options?: { delay?: number }) => Promise<void>
      paste: (element: Element, text: string) => Promise<void>
      keyboard: (text: string) => void
      tab: () => void
      clear: (element: Element) => void
      copy: () => void
      cut: () => void
    }
    click: (element: Element, eventInit?: MouseEventInit) => void
    dblClick: (element: Element, eventInit?: MouseEventInit) => void
    hover: (element: Element) => void
    unhover: (element: Element) => void
    selectOptions: (element: HTMLElement, values: string | string[]) => void
    type: (element: Element, text: string) => Promise<void>
    paste: (element: Element, text: string) => Promise<void>
    keyboard: (text: string) => void
    tab: () => void
    clear: (element: Element) => void
  }
  export default userEvent
}