export default [
  {
    path: '/widgets',
    name: 'widgets',
    component: () => import('@/modules/DynamicReports/Widget/presentation/views/WidgetList.vue'),
    meta: {
      requiresAuth: true,
      resource: 'Widget',
      action: 'read',
    },
  },
  {
    path: '/widgets/create',
    name: 'widgets-create',
    component: () => import('@/modules/DynamicReports/Widget/presentation/views/WidgetForm.vue'),
    meta: {
      requiresAuth: true,
      resource: 'Widget',
      action: 'create',
    },
  },
  {
    path: '/widgets/:id/edit',
    name: 'widgets-edit',
    component: () => import('@/modules/DynamicReports/Widget/presentation/views/WidgetForm.vue'),
    meta: {
      requiresAuth: true,
      resource: 'Widget',
      action: 'update',
    },
  },
]
