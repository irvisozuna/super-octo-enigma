/**
 * Catalogs Readings Module Menu Configuration
 */

import type { VerticalNavItems } from '@layouts/types'
import { createValidatedMenu } from '@/utils/menuValidator'
import { CATALOGS_READINGS_PERMISSIONS } from './config/permissions'

const catalogsReadingsMenu: VerticalNavItems = [
  {
    title: 'Catalogos',
    icon: { icon: 'tabler-books' },
    to: 'CatalogsReadings',
    action: 'manage',
    subject: CATALOGS_READINGS_PERMISSIONS.viewCatalogs,
  },
]

export default createValidatedMenu(catalogsReadingsMenu, 'CatalogsReadings')
