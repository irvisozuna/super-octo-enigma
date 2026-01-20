/**
 * Contract Module Menu Configuration
 */

import type { VerticalNavItems } from '@layouts/types'
import { createValidatedMenu } from '@/utils/menuValidator'

const contractsMenu: VerticalNavItems = [
  {
    title: 'Contratos',
    icon: { icon: 'tabler-file-text' },
    to: 'contracts-list',
    action: 'read',
    subject: 'Contract',
  },
]

// Validar menú en desarrollo
export default createValidatedMenu(contractsMenu, 'ContractModule')
