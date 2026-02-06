/**
 * Catalogs Module Permissions (ACL)
 */

export interface CatalogsPermissions {
  viewCatalogs: string
}

export const CATALOGS_PERMISSIONS: CatalogsPermissions = {
  viewCatalogs: 'catalogs:view:list',
}

export const CATALOGS_PERMISSION_GROUPS = {
  admin: Object.values(CATALOGS_PERMISSIONS),
  viewer: [
    CATALOGS_PERMISSIONS.viewCatalogs,
  ],
}
