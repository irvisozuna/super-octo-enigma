/**
 * Documents Module Menu Configuration
 */

import type { VerticalNavItems } from '@layouts/types'
import { createValidatedMenu } from '@/utils/menuValidator'

const documentsMenu: VerticalNavItems = [
  {
    title: 'Documentos',
    icon: { icon: 'tabler-file-text' },
    action: 'read',
    subject: 'Document',
    children: [
      {
        title: 'Todos los Documentos',
        icon: { icon: 'tabler-file-text' },
        to: 'documents-list',
        action: 'read',
        subject: 'Document',
      },
      {
        title: 'Crear Documento',
        icon: { icon: 'tabler-plus' },
        to: 'documents-create',
        action: 'upload',
        subject: 'Document',
      },
      {
        title: 'Carga Masiva',
        icon: { icon: 'tabler-upload' },
        to: 'documents-bulk-upload',
        action: 'upload',
        subject: 'Document',
      },
      {
        title: 'Plantillas',
        icon: { icon: 'tabler-template' },
        to: 'documents-templates',
        action: 'read',
        subject: 'Document',
      },
      {
        title: 'Estadísticas',
        icon: { icon: 'tabler-chart-bar' },
        to: 'documents-statistics',
        action: 'read',
        subject: 'Document',
      },
    ],
  },
]

// Validar menú en desarrollo
export default createValidatedMenu(documentsMenu, 'DocumentsModule')
