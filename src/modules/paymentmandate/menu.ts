import type { VerticalNavItems } from '@layouts/types'

const paymentmandateMenu: VerticalNavItems = [
  {
    title: 'Domiciliación de Pago',
    icon: { icon: 'tabler-calendar' },
    to: 'paymentmandatesList',
    action: 'read',
    subject: 'supports',
  },
]

export default paymentmandateMenu
