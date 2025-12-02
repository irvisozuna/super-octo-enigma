import type { RouteRecordRaw } from 'vue-router'

const readingsReportList = () => import('./views/index.vue')
const readingReportadvance = () => import('./views/ReadingsReportsAdvance.vue')

const readingReportRoutes: RouteRecordRaw[] = [
  {
    path: '/readgings-reports',
    name: 'ReadingsReportsList',
    component: readingsReportList,
  },
  {
    path: '/readgings-reports/advance',
    name: 'ReadingsReportsAdvance',
    component: readingReportadvance,
  },
  {
    path: '/template/add',
    name: 'Rutas',
    component: () => templateAddComponent,
  },

]

export default readingReportRoutes
