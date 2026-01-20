/**
 * Readings Module Menu Configuration
 */

import type { VerticalNavItems } from '@layouts/types'
import { createValidatedMenu } from '@/utils/menuValidator'

const readingsMenu: VerticalNavItems = [
  {
    title: 'Lecturas',
    icon: { icon: 'tabler-gauge' },
    action: 'read',
    subject: 'Reading',
    children: [
      {
        title: 'Lista de Lecturas',
        icon: { icon: 'tabler-list' },
        to: 'ReadingsList',
        action: 'read',
        subject: 'Reading',
      },
      {
        title: 'Avance de Lecturistas',
        icon: { icon: 'tabler-chart-pie' },
        to: 'ReadingsAdvance',
        action: 'read',
        subject: 'Reading',
      },
      {
        title: 'Mapa de Lecturas',
        icon: { icon: 'tabler-map-2' },
        to: 'ReadingsMap',
        action: 'read',
        subject: 'Reading',
      },
    ],
  },
]

export default createValidatedMenu(readingsMenu, 'Readings')
