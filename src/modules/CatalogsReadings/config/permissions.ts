/**
 * Catalogs Readings Module Permissions (ACL)
 */

export interface CatalogsReadingsPermissions {
  viewCatalogs: string
}

export const CATALOGS_READINGS_PERMISSIONS: CatalogsReadingsPermissions = {
  viewCatalogs: 'catalogs-readings:view:list',
}

export const CATALOGS_READINGS_PERMISSION_GROUPS = {
  admin: Object.values(CATALOGS_READINGS_PERMISSIONS),
  viewer: [
    CATALOGS_READINGS_PERMISSIONS.viewCatalogs,
  ],
}
