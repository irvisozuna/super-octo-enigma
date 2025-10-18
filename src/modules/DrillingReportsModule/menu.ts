/**
 * Drilling Reports Menu Configuration
 */

export default [
  {
    title: 'Reportes de Perforación',
    icon: { icon: 'tabler-checkup-list' },
    to: { name: 'DrillingReportsList' },
    permissions: ['drilling.reports.view'],
    children: [
      {
        title: 'Lista de Reportes',
        icon: { icon: 'tabler-list-details' },
        to: { name: 'DrillingReportsList' },
        permissions: ['drilling.reports.view'],
      },
      {
        title: 'Nuevo Reporte',
        icon: { icon: 'tabler-plus' },
        to: { name: 'DrillingReportsCreate' },
        permissions: ['drilling.reports.create'],
      },
    ],
  },
  {
    title: 'Proyectos',
    icon: { icon: 'tabler-folder' },
    to: { name: 'drilling-projects' },
    permissions: ['drilling.projects.view'],
  },
  {
    title: 'Pozos',
    icon: { icon: 'tabler-trowel' },
    to: { name: 'drilling-wells' },
    permissions: ['drilling.wells.view'],
  },
  {
    title: 'Herramientas',
    icon: { icon: 'tabler-gavel' },
    to: { name: 'drilling-tools' },
    permissions: ['drilling.tools.view'],
  },
  {
    title: 'Equipos',
    icon: { icon: 'tabler-backhoe' },
    to: { name: 'drilling-equipment' },
    permissions: ['drilling.equipment.view'],
  },
  {
    title: 'Documentos',
    icon: { icon: 'tabler-file-text' },
    to: { name: 'drilling-documents' },
    permissions: ['drilling.documents.view'],
  },
]
