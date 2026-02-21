/**
 * Contract Module Menu Configuration
 */

import { CONTRACT_PERMISSIONS } from './permissions'
import type { VerticalNavItems } from '@layouts/types'
import { createValidatedMenu } from '@/utils/menuValidator'

const contractsMenu: VerticalNavItems = [
  {
    title: 'Contratos',
    icon: { icon: 'tabler-file-text' },
    to: 'contracts-list',
    action: 'manage',
    subject: CONTRACT_PERMISSIONS.viewContracts,
  },
]

// Validar menú en desarrollo
export default createValidatedMenu(contractsMenu, 'ContractModule')
