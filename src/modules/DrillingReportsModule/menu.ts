/**
 * Drilling Reports Menu Configuration
 */

import type { VerticalNavItems } from '@layouts/types'
import { createValidatedMenu } from '@/utils/menuValidator'

const drillingReportsMenu: VerticalNavItems = [
  // {
  //   title: 'Reportes de Perforación',
  //   icon: { icon: 'tabler-checkup-list' },
  //   action: 'read',
  //   subject: 'DrillingReport',
  //   children: [
  //     {
  //       title: 'Lista de Reportes',
  //       icon: { icon: 'tabler-list-details' },
  //       to: 'DrillingReportsList',
  //       action: 'read',
  //       subject: 'DrillingReport',
  //     },
  //     {
  //       title: 'Nuevo Reporte',
  //       icon: { icon: 'tabler-plus' },
  //       to: 'DrillingReportsCreate',
  //       action: 'create',
  //       subject: 'DrillingReport',
  //     },
  //   ],
  // },
  {
    title: 'Proyectos',
    icon: { icon: 'tabler-folder' },
    action: 'read',
    subject: 'Project',
    children: [
      {
        title: 'Lista de Proyectos',
        icon: { icon: 'tabler-list' },
        to: 'drilling-projects',
        action: 'read',
        subject: 'Project',
      },
    ],
  },

  // {
  //   title: 'Pozos',
  //   icon: { icon: 'tabler-trowel' },
  //   action: 'read',
  //   subject: 'Well',
  //   children: [
  //     {
  //       title: 'Lista de Pozos',
  //       icon: { icon: 'tabler-list' },
  //       to: 'drilling-wells',
  //       action: 'read',
  //       subject: 'Well',
  //     },
  //     {
  //       title: 'Nuevo Pozo',
  //       icon: { icon: 'tabler-plus' },
  //       to: 'drilling-wells-create',
  //       action: 'create',
  //       subject: 'Well',
  //     },
  //   ],
  // },
  {
    title: 'Herramientas',
    icon: { icon: 'tabler-gavel' },
    action: 'read',
    subject: 'Tool',
    children: [
      {
        title: 'Lista de Herramientas',
        icon: { icon: 'tabler-list' },
        to: 'drilling-tools',
        action: 'read',
        subject: 'Tool',
      },
    ],
  },
  {
    title: 'Equipos',
    icon: { icon: 'tabler-backhoe' },
    action: 'read',
    subject: 'Tool',
    children: [
      {
        title: 'Lista de Equipos',
        icon: { icon: 'tabler-list' },
        to: 'drilling-equipment',
        action: 'read',
        subject: 'Tool',
      },
    ],
  },
]

// Validar menú en desarrollo
export default createValidatedMenu(drillingReportsMenu, 'DrillingReportsModule')
