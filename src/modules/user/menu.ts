export default [
  // {
  //   title: 'Dashboards',
  //   icon: { icon: 'tabler-smart-home' },
  //   children: [
  //     {
  //       title: 'Welcome',
  //       to: 'dashboards-default',
  //       action: 'read',
  //       subject: 'Profile',
  //     },
  //   ],
  // },
  {
    title: 'Usuarios',
    icon: { icon: 'tabler-users' },
    action: 'read',
    subject: 'User',
    children: [
      {
        title: 'Lista de Usuarios',
        icon: { icon: 'tabler-list' },
        to: 'UsersList',
        action: 'read',
        subject: 'User',
      },
      {
        title: 'Nuevo Usuario',
        icon: { icon: 'tabler-user-plus' },
        to: 'UsersCreate',
        action: 'create',
        subject: 'User',
      },
    ],
  },
]
