export default [
  {
    title: 'Dashboards',
    icon: { icon: 'tabler-smart-home' },
    children: [
      {
        title: 'Welcome',
        to: 'dashboards-default',
        action: 'read',
        subject: 'dashboard',
      },
    ]
  },
  {
    title: 'Users',
    icon: { icon: 'tabler-calendar' },
    to: 'UsersList',
    action: 'read',
    subject: 'users',
  }
]
