/**
 * Drilling Reports Module Configuration
 */

export const DRILLING_REPORTS_CONFIG = {
  // API Configuration
  api: {
    baseUrl: '/api/drilling/reports',
    timeout: 30000,
    retries: 3,
  },

  // Pagination
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    pageSizeOptions: [10, 20, 50, 100],
  },

  // Validation
  validation: {
    maxObservationsLength: 1000,
    maxDescriptionLength: 500,
    maxHoursPerShift: 24,
    maxMetersPerDay: 1000,
  },

  // File Upload
  fileUpload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/png', 'image/jpeg', 'application/pdf'],
    signatureCanvas: {
      width: 400,
      height: 200,
      backgroundColor: '#ffffff',
      penColor: '#000000',
      penWidth: 2,
    },
  },

  // Export
  export: {
    formats: ['pdf', 'excel', 'csv'],
    defaultFormat: 'pdf',
    includeImages: true,
    includeSignatures: true,
  },

  // Notifications
  notifications: {
    enabled: true,
    types: {
      reportCompleted: 'report_completed',
      reportApproved: 'report_approved',
      reportRejected: 'report_rejected',
    },
  },

  // Cache
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
    maxSize: 100,
  },

  // UI Configuration
  ui: {
    theme: {
      primary: '#3B82F6',
      secondary: '#6B7280',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
    statusColors: {
      draft: '#FCD34D',
      completed: '#60A5FA',
      approved: '#34D399',
      rejected: '#F87171',
    },
    animations: {
      enabled: true,
      duration: 300,
    },
  },
}

export default DRILLING_REPORTS_CONFIG
