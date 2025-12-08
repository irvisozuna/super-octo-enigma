import type { VerticalNavItems } from '@/@layouts/types'

const ReadingsReportsMenu: VerticalNavItems = [
  {
    title: 'Lecturas',
    icon: { icon: 'tabler-calendar' },
    action: 'read',
    subject: 'readings',
    children: [
      {
        title: 'Listado',
        icon: { icon: 'tabler-list-details' },
        to: { name: 'ReadingsReportsList' },
        action: 'read',
        subject: 'readings',
      },
      {
        title: 'Avance',
        icon: { icon: 'tabler-progress-check' },
        to: { name: 'ReadingsReportsAdvance' },
        action: 'read',
        subject: 'readings',
      },
      {
        title: 'Rutas',
        icon: { icon: 'tabler-route' },
        to: { name: 'ReadingsReportsRoutesDownloaded' },
        action: 'read',
        subject: 'readings',
      },
    ],
  },
]

export default ReadingsReportsMenu
