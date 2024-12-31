import type { VerticalNavItems } from '@layouts/types'

const userMenu: VerticalNavItems = [
  {
    title: 'Users',
    icon: { icon: 'tabler-calendar' },
    to: 'UsersList',
    action: 'read',
    subject: 'users',
  }
]

export default userMenu
