import type { VerticalNavItems } from '@layouts/types'

// Pantallas del núcleo (XEL1-629): órdenes de trabajo de todos los tipos, sus agentes y el puente hacia Aquasoft Comercial
const ordenesMenu: VerticalNavItems = [
  {
    title: 'Órdenes de campo',
    icon: { icon: 'tabler-clipboard-list' },

    // El grupo lo ve también el supervisor de campo, que solo administra agentes (XEL1-674)
    action: 'read',
    subject: 'agentes',
    children: [
      {
        title: 'Órdenes de trabajo',
        to: 'ordenesLista',
        action: 'read',
        subject: 'ordenes',
      },
      {
        title: 'Agentes de campo',
        to: 'ordenesAgentes',
        action: 'read',
        subject: 'agentes',
      },
      {
        title: 'Puente con Comercial',
        to: 'ordenesPuente',
        action: 'manage',
        subject: 'ordenes-admin',
      },
    ],
  },
]

export default ordenesMenu
