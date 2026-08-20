import type { ComponentType } from 'react'
import {
  GaugeIcon,
  GearSixIcon,
  ChatCenteredTextIcon,
  HouseIcon,
  ListBulletsIcon,
  PaperPlaneTiltIcon,
} from '@phosphor-icons/react'

export interface NavLink {
  to: string
  label: string
  icon: ComponentType<{ className?: string; size?: number; 'aria-hidden'?: boolean }>
  exact?: boolean
}

export const primaryNavLinks: NavLink[] = [
  { to: '/', label: 'Home', icon: HouseIcon, exact: true },
  { to: '/submit-topic', label: 'Submit a Topic', icon: PaperPlaneTiltIcon },
]

export const betaNavLinks: NavLink[] = [
  { to: '/feedback', label: 'Beta Feedback', icon: ChatCenteredTextIcon },
]

export const userNavLinks: NavLink[] = [
  { to: '/yourSubmissions', label: 'Your Submissions', icon: ListBulletsIcon },
  { to: '/userSettings', label: 'Settings', icon: GearSixIcon },
]

export const adminNavLinks: NavLink[] = [
  { to: '/admin', label: 'Admin Dashboard', icon: GaugeIcon },
]
