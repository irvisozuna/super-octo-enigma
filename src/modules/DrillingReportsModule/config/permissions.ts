/**
 * Drilling Reports Permissions Configuration
 */

export const DRILLING_REPORTS_PERMISSIONS = {
  // View permissions
  'drilling.reports.view': 'Ver reportes de perforación',
  'drilling.reports.view.own': 'Ver reportes propios',
  'drilling.reports.view.all': 'Ver todos los reportes',
  'drilling.reports.view.detail': 'Ver detalle de reporte',

  // CRUD permissions
  'drilling.reports.create': 'Crear reportes de perforación',
  'drilling.reports.update': 'Actualizar reportes de perforación',
  'drilling.reports.delete': 'Eliminar reportes de perforación',

  // Workflow permissions
  'drilling.reports.complete': 'Completar reportes',
  'drilling.reports.approve': 'Aprobar reportes',
  'drilling.reports.reject': 'Rechazar reportes',
  'drilling.reports.sign': 'Firmar reportes',

  // Activity permissions
  'drilling.reports.activities.add': 'Agregar actividades',
  'drilling.reports.activities.update': 'Actualizar actividades',
  'drilling.reports.activities.delete': 'Eliminar actividades',

  // Consumption permissions
  'drilling.reports.consumptions.add': 'Registrar consumos',
  'drilling.reports.consumptions.update': 'Actualizar consumos',
  'drilling.reports.consumptions.delete': 'Eliminar consumos',

  // Tool permissions
  'drilling.reports.tools.assign': 'Asignar herramientas',
  'drilling.reports.tools.update': 'Actualizar asignaciones de herramientas',
  'drilling.reports.tools.delete': 'Eliminar asignaciones de herramientas',

  // Export permissions
  'drilling.reports.export': 'Exportar reportes',
  'drilling.reports.export.pdf': 'Exportar a PDF',
  'drilling.reports.export.excel': 'Exportar a Excel',
  'drilling.reports.export.csv': 'Exportar a CSV',

  // Statistics permissions
  'drilling.reports.statistics': 'Ver estadísticas',
  'drilling.reports.statistics.own': 'Ver estadísticas propias',
  'drilling.reports.statistics.all': 'Ver todas las estadísticas',

  // Projects permissions
  'drilling.projects.view': 'Ver proyectos',
  'drilling.projects.create': 'Crear proyectos',
  'drilling.projects.update': 'Actualizar proyectos',
  'drilling.projects.delete': 'Eliminar proyectos',
  'drilling.projects.export': 'Exportar proyectos',

  // Wells permissions
  'drilling.wells.view': 'Ver pozos',
  'drilling.wells.create': 'Crear pozos',
  'drilling.wells.update': 'Actualizar pozos',
  'drilling.wells.delete': 'Eliminar pozos',
  'drilling.wells.export': 'Exportar pozos',

  // Tools permissions
  'drilling.tools.view': 'Ver herramientas',
  'drilling.tools.create': 'Crear herramientas',
  'drilling.tools.update': 'Actualizar herramientas',
  'drilling.tools.delete': 'Eliminar herramientas',
  'drilling.tools.export': 'Exportar herramientas',
  'drilling.tools.assign': 'Asignar herramientas',
  'drilling.tools.unassign': 'Desasignar herramientas',

  // Equipment permissions
  'drilling.equipment.view': 'Ver equipos',
  'drilling.equipment.create': 'Crear equipos',
  'drilling.equipment.update': 'Actualizar equipos',
  'drilling.equipment.delete': 'Eliminar equipos',
  'drilling.equipment.export': 'Exportar equipos',
  'drilling.equipment.assign': 'Asignar equipos',
  'drilling.equipment.unassign': 'Desasignar equipos',

  // Documents permissions
  'drilling.documents.view': 'Ver documentos',
  'drilling.documents.create': 'Crear documentos',
  'drilling.documents.update': 'Actualizar documentos',
  'drilling.documents.delete': 'Eliminar documentos',
  'drilling.documents.export': 'Exportar documentos',
  'drilling.documents.download': 'Descargar documentos',
  'drilling.documents.upload': 'Subir documentos',
}

export const DRILLING_REPORTS_PERMISSION_GROUPS = {
  admin: [
    'drilling.reports.view.all',
    'drilling.reports.create',
    'drilling.reports.update',
    'drilling.reports.delete',
    'drilling.reports.complete',
    'drilling.reports.approve',
    'drilling.reports.reject',
    'drilling.reports.sign',
    'drilling.reports.activities.add',
    'drilling.reports.activities.update',
    'drilling.reports.activities.delete',
    'drilling.reports.consumptions.add',
    'drilling.reports.consumptions.update',
    'drilling.reports.consumptions.delete',
    'drilling.reports.tools.assign',
    'drilling.reports.tools.update',
    'drilling.reports.tools.delete',
    'drilling.reports.export',
    'drilling.reports.statistics.all',
    'drilling.projects.view',
    'drilling.projects.create',
    'drilling.projects.update',
    'drilling.projects.delete',
    'drilling.projects.export',
    'drilling.wells.view',
    'drilling.wells.create',
    'drilling.wells.update',
    'drilling.wells.delete',
    'drilling.wells.export',
    'drilling.tools.view',
    'drilling.tools.create',
    'drilling.tools.update',
    'drilling.tools.delete',
    'drilling.tools.export',
    'drilling.tools.assign',
    'drilling.tools.unassign',
    'drilling.equipment.view',
    'drilling.equipment.create',
    'drilling.equipment.update',
    'drilling.equipment.delete',
    'drilling.equipment.export',
    'drilling.equipment.assign',
    'drilling.equipment.unassign',
    'drilling.documents.view',
    'drilling.documents.create',
    'drilling.documents.update',
    'drilling.documents.delete',
    'drilling.documents.export',
    'drilling.documents.download',
    'drilling.documents.upload',
  ],
  manager: [
    'drilling.reports.view.all',
    'drilling.reports.create',
    'drilling.reports.update',
    'drilling.reports.complete',
    'drilling.reports.approve',
    'drilling.reports.reject',
    'drilling.reports.sign',
    'drilling.reports.activities.add',
    'drilling.reports.activities.update',
    'drilling.reports.consumptions.add',
    'drilling.reports.consumptions.update',
    'drilling.reports.tools.assign',
    'drilling.reports.tools.update',
    'drilling.reports.export',
    'drilling.reports.statistics.all',
  ],
  supervisor: [
    'drilling.reports.view.all',
    'drilling.reports.create',
    'drilling.reports.update',
    'drilling.reports.approve',
    'drilling.reports.reject',
    'drilling.reports.sign',
    'drilling.reports.activities.add',
    'drilling.reports.activities.update',
    'drilling.reports.consumptions.add',
    'drilling.reports.consumptions.update',
    'drilling.reports.tools.assign',
    'drilling.reports.tools.update',
    'drilling.reports.export',
    'drilling.reports.statistics.all',
  ],
  operator: [
    'drilling.reports.view.own',
    'drilling.reports.create',
    'drilling.reports.update',
    'drilling.reports.complete',
    'drilling.reports.sign',
    'drilling.reports.activities.add',
    'drilling.reports.activities.update',
    'drilling.reports.consumptions.add',
    'drilling.reports.consumptions.update',
    'drilling.reports.tools.assign',
    'drilling.reports.tools.update',
    'drilling.reports.export',
    'drilling.reports.statistics.own',
  ],
  viewer: [
    'drilling.reports.view',
    'drilling.reports.export',
  ],
}

export default {
  permissions: DRILLING_REPORTS_PERMISSIONS,
  permissionGroups: DRILLING_REPORTS_PERMISSION_GROUPS,
}
