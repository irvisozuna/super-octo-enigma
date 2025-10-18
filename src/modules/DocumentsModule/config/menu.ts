/**
 * Documents Module Menu Configuration
 */

import type { MenuItem } from '@/@layouts/types'

export const documentsMenuItems: MenuItem[] = [
  {
    title: 'Documents',
    icon: { icon: 'tabler-file-text' },
    to: { name: 'documents-list' },
    children: [
      {
        title: 'All Documents',
        icon: { icon: 'tabler-file-text' },
        to: { name: 'documents-list' },
      },
      {
        title: 'Create Document',
        icon: { icon: 'tabler-plus' },
        to: { name: 'documents-create' },
      },
      {
        title: 'Bulk Upload',
        icon: { icon: 'tabler-upload' },
        to: { name: 'documents-bulk-upload' },
      },
      {
        title: 'Templates',
        icon: { icon: 'tabler-template' },
        to: { name: 'documents-templates' },
      },
      {
        title: 'Statistics',
        icon: { icon: 'tabler-chart-bar' },
        to: { name: 'documents-statistics' },
      },
    ],
  },
]

export default documentsMenuItems
