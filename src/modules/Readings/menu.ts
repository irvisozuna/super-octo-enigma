/**
 * Readings Module Menu Configuration
 */

import type { VerticalNavItems } from '@layouts/types'
import { createValidatedMenu } from '@/utils/menuValidator'
import { READINGS_PERMISSIONS } from './config/permissions'

const readingsMenu: VerticalNavItems = [
  {
    title: 'Lecturas',
    icon: { icon: 'tabler-gauge' },
    action: 'manage',
    subject: READINGS_PERMISSIONS.viewReadings,
    children: [
      {
        title: 'Avance de Lecturistas',
        icon: { icon: 'tabler-chart-pie' },
        to: 'ReadingsAdvance',
        action: 'manage',
        subject: READINGS_PERMISSIONS.viewReadingAdvance,
      },
      {
        title: 'Lista de Lecturas',
        icon: { icon: 'tabler-list' },
        to: 'ReadingsList',
        action: 'manage',
        subject: READINGS_PERMISSIONS.viewReadings,
      },
      {
        title: 'Mapa de Lecturas',
        icon: { icon: 'tabler-map-2' },
        to: 'ReadingsMap',
        action: 'manage',
        subject: READINGS_PERMISSIONS.viewReadingMap,
      },
    ],
  },
]

export default createValidatedMenu(readingsMenu, 'Readings')
