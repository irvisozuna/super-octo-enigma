/**
 * Catalogs Readings Module Menu Configuration
 */

import { CATALOGS_READINGS_PERMISSIONS } from './config/permissions'
import type { VerticalNavItems } from '@layouts/types'
import { createValidatedMenu } from '@/utils/menuValidator'

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
