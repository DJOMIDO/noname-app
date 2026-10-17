import type { Component } from 'vue'
import { Home, Luggage, Plane, TrainFront, BarChart3 } from 'lucide-vue-next'

export interface NavItem {
    label: string
    to: string
    icon: Component
}

// Full list used by the desktop sidebar.
export const navItems: NavItem[] = [
    { label: 'Home', to: '/home', icon: Home },
    { label: 'Journeys', to: '/journeys', icon: Luggage },
    { label: 'Add Flight', to: '/add-flight', icon: Plane },
    { label: 'Add Train', to: '/add-train', icon: TrainFront },
    { label: 'Statistics', to: '/stats', icon: BarChart3 },
]

// Subset shown as plain tabs on the mobile bottom bar; "Add" and account live
// in their own dedicated actions.
export const mobileTabItems: NavItem[] = [
    { label: 'Home', to: '/home', icon: Home },
    { label: 'Journeys', to: '/journeys', icon: Luggage },
    { label: 'Statistics', to: '/stats', icon: BarChart3 },
]

// Destinations offered by the mobile "+ Add" action.
export const addItems: NavItem[] = [
    { label: 'Add Flight', to: '/add-flight', icon: Plane },
    { label: 'Add Train', to: '/add-train', icon: TrainFront },
]
