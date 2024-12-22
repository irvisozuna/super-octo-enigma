import type { VerticalNavItems } from '@layouts/types'
export default [
  {
    title: 'Clients',
    icon: { icon: 'tabler-user' },
    children: [
      { title: 'List', to: 'apps-clients-list' },
      { title: 'View', to: { name: 'apps-clients-view-id', params: { id: 21 } } },
    ],
  },
] as VerticalNavItems
