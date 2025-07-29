import type { RouteRecordRaw } from 'vue-router'

export const dashboardmonitorRoutes: RouteRecordRaw[] = [
  {
    path: '/dashboardmonitor',
    name: 'DashboardMonitor',
    redirect: { name: 'DashboardMonitorDashboard' },
    children: [
      {
        path: 'dashboard',
        name: 'DashboardMonitorDashboard',
        component: () => import('../views/DashboardMonitorDashboard.vue'),
        meta: {
          title: 'DashboardMonitor Dashboard',
          requiresAuth: true
        }
      },
      
      // DashboardMonitorEntity routes
      {
        path: 'dashboardmonitorentity',
        name: 'DashboardMonitorEntityList',
        component: () => import('../views/DashboardMonitorEntityList.vue'),
        meta: {
          title: 'DashboardMonitorEntity List',
          requiresAuth: true
        }
      },
      {
        path: 'dashboardmonitorentity/create',
        name: 'DashboardMonitorEntityCreate',
        component: () => import('../views/DashboardMonitorEntityCreate.vue'),
        meta: {
          title: 'Create DashboardMonitorEntity',
          requiresAuth: true
        }
      },
      {
        path: 'dashboardmonitorentity/:id',
        name: 'DashboardMonitorEntityDetail',
        component: () => import('../views/DashboardMonitorEntityDetail.vue'),
        meta: {
          title: 'DashboardMonitorEntity Detail',
          requiresAuth: true
        }
      },
      {
        path: 'dashboardmonitorentity/:id/edit',
        name: 'DashboardMonitorEntityEdit',
        component: () => import('../views/DashboardMonitorEntityEdit.vue'),
        meta: {
          title: 'Edit DashboardMonitorEntity',
          requiresAuth: true
        }
      }
    ]
  }
]