import { create } from 'zustand'

interface SettingsState {
    isOpen: boolean
    activeTab: 'profile' | 'skills' | 'experience' | 'account' | 'notifications' | 'privacy' | 'billing'
    openSettings: (tab?: 'profile' | 'skills' | 'experience' | 'account' | 'notifications' | 'privacy' | 'billing') => void
    closeSettings: () => void
    setIsOpen: (isOpen: boolean) => void
    setActiveTab: (tab: 'profile' | 'skills' | 'experience' | 'account' | 'notifications' | 'privacy' | 'billing') => void
}

export const useSettings = create<SettingsState>((set) => ({
    isOpen: false,
    activeTab: 'profile',
    openSettings: (tab) => set({ isOpen: true, activeTab: tab || 'profile' }),
    closeSettings: () => set({ isOpen: false }),
    setIsOpen: (isOpen) => set({ isOpen }),
    setActiveTab: (tab) => set({ activeTab: tab })
}))
