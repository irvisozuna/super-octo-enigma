/**
 * Readings Module Permissions (ACL)
 */

export interface ReadingsPermissions {
  viewReadings: string
  viewReadingDetail: string
  viewReadingAdvance: string
  viewReadingMap: string 
  exportReadings: string
}

export const READINGS_PERMISSIONS: ReadingsPermissions = {
  viewReadings: 'readings:view:list',
  viewReadingDetail: 'readings:view:detail',
  viewReadingAdvance: 'readings:view:advance',
  viewReadingMap: 'readings:view:map',
  exportReadings: 'readings:export:data',
}

export const READINGS_PERMISSION_GROUPS = {
  admin: Object.values(READINGS_PERMISSIONS),
  viewer: [
    READINGS_PERMISSIONS.viewReadings,
    READINGS_PERMISSIONS.viewReadingDetail,
    READINGS_PERMISSIONS.viewReadingAdvance,
    READINGS_PERMISSIONS.viewReadingMap,
  ],
}

