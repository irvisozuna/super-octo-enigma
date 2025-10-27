/**
 * Documents Module Routes
 */

import type { RouteRecordRaw } from 'vue-router'

const documentRoutes: RouteRecordRaw[] = [
  {
    path: '/documents',
    name: 'documents-list',
    component: () => import('../presentation/views/DocumentList.vue'),
    meta: {
      title: 'Documents',
      requiresAuth: true,
      action: 'read',
      subject: 'Document',
    },
  },
  {
    path: '/documents/create',
    name: 'documents-create',
    component: () => import('../presentation/views/DocumentCreate.vue'),
    meta: {
      title: 'Create Document',
      requiresAuth: true,
      action: 'create',
      subject: 'Document',
    },
  },
  {
    path: '/documents/:id',
    name: 'documents-detail',
    component: () => import('../presentation/views/DocumentDetail.vue'),
    meta: {
      title: 'Document Detail',
      requiresAuth: true,
      action: 'read',
      subject: 'Document',
    },
  },
  {
    path: '/documents/:id/edit',
    name: 'documents-edit',
    component: () => import('../presentation/views/DocumentEdit.vue'),
    meta: {
      title: 'Edit Document',
      requiresAuth: true,
      action: 'update',
      subject: 'Document',
    },
  },
  {
    path: '/documents/:id/versions',
    name: 'documents-versions',
    component: () => import('../presentation/views/DocumentVersions.vue'),
    meta: {
      title: 'Document Versions',
      requiresAuth: true,
      action: 'read',
      subject: 'Document',
    },
  },
  {
    path: '/documents/:id/share',
    name: 'documents-share',
    component: () => import('../presentation/views/DocumentShare.vue'),
    meta: {
      title: 'Share Document',
      requiresAuth: true,
      action: 'share',
      subject: 'Document',
    },
  },
  {
    path: '/documents/:id/access-logs',
    name: 'documents-access-logs',
    component: () => import('../presentation/views/DocumentAccessLogs.vue'),
    meta: {
      title: 'Document Access Logs',
      requiresAuth: true,
      action: 'read',
      subject: 'Document',
    },
  },
  {
    path: '/documents/statistics',
    name: 'documents-statistics',
    component: () => import('../presentation/views/DocumentStatistics.vue'),
    meta: {
      title: 'Document Statistics',
      requiresAuth: true,
      action: 'read',
      subject: 'Document',
    },
  },
  {
    path: '/documents/templates',
    name: 'documents-templates',
    component: () => import('../presentation/views/DocumentTemplates.vue'),
    meta: {
      title: 'Document Templates',
      requiresAuth: true,
      action: 'read',
      subject: 'Document',
    },
  },
  {
    path: '/documents/bulk-upload',
    name: 'documents-bulk-upload',
    component: () => import('../presentation/views/DocumentBulkUpload.vue'),
    meta: {
      title: 'Bulk Upload Documents',
      requiresAuth: true,
      action: 'create',
      subject: 'Document',
    },
  },

  // Public share routes (no authentication required)
  {
    path: '/shared/documents/:token',
    name: 'documents-public-share',
    component: () => import('../presentation/views/DocumentPublicShare.vue'),
    meta: {
      title: 'Shared Document',
      requiresAuth: false,
    },
  },
  {
    path: '/shared/documents/:token/download',
    name: 'documents-public-download',
    component: () => import('../presentation/views/DocumentPublicDownload.vue'),
    meta: {
      title: 'Download Shared Document',
      requiresAuth: false,
    },
  },
]

export default documentRoutes
