/**
 * Contract Module Menu - Configuration Layer
 */

import type { VerticalNavItems } from '@layouts/types'

const contractsMenu: VerticalNavItems = [
  {
    title: 'Contratos',
    icon: { icon: 'tabler-file-text' },
    to: 'contracts-list',
    action: 'read',
    subject: 'Contract',
  },
]

export default contractsMenu
