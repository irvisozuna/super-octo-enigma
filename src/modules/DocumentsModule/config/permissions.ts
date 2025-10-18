/**
 * Documents Module Permissions Configuration
 */

import type { Permission } from '@/types'

const documentPermissions: Permission[] = [
  // Document CRUD permissions
  {
    action: 'read',
    subject: 'documents',
    description: 'View documents',
  },
  {
    action: 'create',
    subject: 'documents',
    description: 'Create documents',
  },
  {
    action: 'update',
    subject: 'documents',
    description: 'Update documents',
  },
  {
    action: 'delete',
    subject: 'documents',
    description: 'Delete documents',
  },

  // Document sharing permissions
  {
    action: 'share',
    subject: 'documents',
    description: 'Share documents',
  },
  {
    action: 'download',
    subject: 'documents',
    description: 'Download documents',
  },

  // Document versioning permissions
  {
    action: 'version',
    subject: 'documents',
    description: 'Manage document versions',
  },

  // Document metadata permissions
  {
    action: 'metadata',
    subject: 'documents',
    description: 'Manage document metadata',
  },

  // Document access logs permissions
  {
    action: 'audit',
    subject: 'documents',
    description: 'View document access logs',
  },

  // Document statistics permissions
  {
    action: 'statistics',
    subject: 'documents',
    description: 'View document statistics',
  },

  // Document templates permissions
  {
    action: 'templates',
    subject: 'documents',
    description: 'Manage document templates',
  },

  // Document bulk operations permissions
  {
    action: 'bulk',
    subject: 'documents',
    description: 'Perform bulk operations on documents',
  },

  // Document export permissions
  {
    action: 'export',
    subject: 'documents',
    description: 'Export documents',
  },

  // Document import permissions
  {
    action: 'import',
    subject: 'documents',
    description: 'Import documents',
  },

  // Document security permissions
  {
    action: 'security',
    subject: 'documents',
    description: 'Manage document security settings',
  },

  // Document workflow permissions
  {
    action: 'workflow',
    subject: 'documents',
    description: 'Manage document workflows',
  },

  // Document approval permissions
  {
    action: 'approve',
    subject: 'documents',
    description: 'Approve documents',
  },

  // Document archive permissions
  {
    action: 'archive',
    subject: 'documents',
    description: 'Archive documents',
  },

  // Document restore permissions
  {
    action: 'restore',
    subject: 'documents',
    description: 'Restore archived documents',
  },
]

export default documentPermissions
