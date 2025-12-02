import type { VerticalNavItems } from '@layouts/types'

const contractsMenu: VerticalNavItems = [
  {
    title: 'Contratos',
    icon: { icon: 'tabler-file-text' },
    to: 'contracts-list',
    action: 'manage',
    subject: 'all',
  },
]

export default contractsMenu
