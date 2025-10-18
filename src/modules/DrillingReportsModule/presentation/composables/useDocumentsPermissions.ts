/**
 * Documents Permissions Composable
 * Manages permissions for documents operations
 */

import { computed } from 'vue'
import { useAbility } from '@casl/vue'

export const useDocumentsPermissions = () => {
  const { can } = useAbility()

  // View permissions
  const canViewDocuments = computed(() => can('read', 'drilling-documents'))
  const canViewDocumentDetail = computed(() => can('read', 'drilling-document-detail'))

  // CRUD permissions
  const canCreateDocument = computed(() => can('create', 'drilling-documents'))
  const canUpdateDocument = computed(() => can('update', 'drilling-documents'))
  const canDeleteDocument = computed(() => can('delete', 'drilling-documents'))

  // File permissions
  const canUploadDocument = computed(() => can('upload', 'drilling-documents'))
  const canDownloadDocument = computed(() => can('download', 'drilling-documents'))

  // Export permissions
  const canExportDocuments = computed(() => can('export', 'drilling-documents'))

  // Combined permissions
  const canManageDocuments = computed(() =>
    canCreateDocument.value || canUpdateDocument.value || canDeleteDocument.value,
  )

  const canAccessDocuments = computed(() =>
    canViewDocuments.value || canViewDocumentDetail.value,
  )

  return {
    // View permissions
    canView: canViewDocuments,
    canViewDetail: canViewDocumentDetail,

    // CRUD permissions
    canCreate: canCreateDocument,
    canEdit: canUpdateDocument,
    canDelete: canDeleteDocument,

    // File permissions
    canUpload: canUploadDocument,
    canDownload: canDownloadDocument,

    // Export permissions
    canExport: canExportDocuments,

    // Combined permissions
    canManage: canManageDocuments,
    canAccess: canAccessDocuments,
  }
}
