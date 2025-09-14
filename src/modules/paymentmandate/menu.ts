import type { VerticalNavItems } from '@layouts/types'

const paymentmandateMenu: VerticalNavItems = [
  {
    title: 'Domiciliación de Pago',
    icon: { icon: 'tabler-calendar' },
    to: 'paymentmandatesList',
    action: 'read',
    subject: 'PaymentMandates',
    children: [
      {
        title: 'Domiciliación de Pago',
        icon: { icon: 'tabler-calendar' },
        to: 'paymentmandatesList',
        action: 'read',
        subject: 'PaymentMandates',
      },
      {
        title: 'Registro de Contratos',
        icon: { icon: 'tabler-file-contract' },
        to: 'contractRegistryList',
        action: 'read',
        subject: 'PaymentMandates',
      },
    ],
  },

]

export default paymentmandateMenu
