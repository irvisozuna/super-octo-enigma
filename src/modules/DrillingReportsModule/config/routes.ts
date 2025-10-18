/**
 * Drilling Reports Routes Configuration
 */

import type { RouteRecordRaw } from 'vue-router'

const drillingReportRoutes: RouteRecordRaw[] = [
  {
    path: '/drilling/reports',
    name: 'DrillingReportsList',
    component: () => import('../presentation/views/DrillingReportList.vue'),
    meta: {
      title: 'Reportes de Perforación',
      requiresAuth: true,
      permissions: ['drilling.reports.view'],
    },
  },
  {
    path: '/drilling/reports/create',
    name: 'DrillingReportsCreate',
    component: () => import('../presentation/views/DrillingReportCreate.vue'),
    meta: {
      title: 'Nuevo Reporte de Perforación',
      requiresAuth: true,
      permissions: ['drilling.reports.create'],
    },
  },
  {
    path: '/drilling/reports/:id',
    name: 'DrillingReportsDetail',
    component: () => import('../presentation/views/DrillingReportDetail.vue'),
    meta: {
      title: 'Detalle del Reporte',
      requiresAuth: true,
      permissions: ['drilling.reports.view'],
    },
  },
  {
    path: '/drilling/reports/:id/edit',
    name: 'DrillingReportsEdit',
    component: () => import('../presentation/views/DrillingReportEdit.vue'),
    meta: {
      title: 'Editar Reporte de Perforación',
      requiresAuth: true,
      permissions: ['drilling.reports.update'],
    },
  },
  {
    path: '/drilling/reports/:id/complete',
    name: 'DrillingReportsComplete',
    component: () => import('../presentation/views/DrillingReportComplete.vue'),
    meta: {
      title: 'Completar Reporte',
      requiresAuth: true,
      permissions: ['drilling.reports.complete'],
    },
  },
  {
    path: '/drilling/reports/:id/approve',
    name: 'DrillingReportsApprove',
    component: () => import('../presentation/views/DrillingReportApprove.vue'),
    meta: {
      title: 'Aprobar Reporte',
      requiresAuth: true,
      permissions: ['drilling.reports.approve'],
    },
  },
  {
    path: '/drilling/reports/:id/reject',
    name: 'DrillingReportsReject',
    component: () => import('../presentation/views/DrillingReportReject.vue'),
    meta: {
      title: 'Rechazar Reporte',
      requiresAuth: true,
      permissions: ['drilling.reports.reject'],
    },
  },

  // Related Entities Routes
  {
    path: '/drilling/projects',
    name: 'drilling-projects',
    component: () => import('../presentation/views/ProjectsList.vue'),
    meta: {
      title: 'Proyectos',
      requiresAuth: true,
      permissions: ['drilling.projects.view'],
    },
  },
  {
    path: '/drilling/projects/:id',
    name: 'drilling-projects-detail',
    component: () => import('../presentation/views/ProjectDetail.vue'),
    meta: {
      title: 'Detalle del Proyecto',
      requiresAuth: true,
      permissions: ['drilling.projects.view'],
    },
  },
  {
    path: '/drilling/wells',
    name: 'drilling-wells',
    component: () => import('../presentation/views/WellsList.vue'),
    meta: {
      title: 'Pozos',
      requiresAuth: true,
      permissions: ['drilling.wells.view'],
    },
  },
  {
    path: '/drilling/tools',
    name: 'drilling-tools',
    component: () => import('../presentation/views/ToolsList.vue'),
    meta: {
      title: 'Herramientas',
      requiresAuth: true,
      permissions: ['drilling.tools.view'],
    },
  },
  {
    path: '/drilling/equipment',
    name: 'drilling-equipment',
    component: () => import('../presentation/views/EquipmentList.vue'),
    meta: {
      title: 'Equipos',
      requiresAuth: true,
      permissions: ['drilling.equipment.view'],
    },
  },
  {
    path: '/drilling/documents',
    name: 'drilling-documents',
    component: () => import('../presentation/views/DocumentsList.vue'),
    meta: {
      title: 'Documentos',
      requiresAuth: true,
      permissions: ['drilling.documents.view'],
    },
  },
]

export default drillingReportRoutes
