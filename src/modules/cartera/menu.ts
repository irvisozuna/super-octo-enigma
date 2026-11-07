import type { VerticalNavItems } from '@layouts/types'

// El grupo solo aparece con `read cartera` (CASL); generar lotes pide `operate cartera-operar` y lo vuelve a revisar el servidor
const carteraMenu: VerticalNavItems = [
  {
    title: 'Cartera vencida',
    icon: { icon: 'tabler-file-invoice' },
    action: 'read',
    subject: 'cartera',
    children: [
      {
        title: 'Notificar',
        to: 'carteraNotificar',
        action: 'operate',
        subject: 'cartera-operar',
      },
      {
        title: 'Lotes',
        to: 'carteraLotes',
        action: 'read',
        subject: 'cartera',
      },
      {
        title: 'Notificaciones',
        to: 'carteraNotificaciones',
        action: 'read',
        subject: 'cartera',
      },
      {
        title: 'Recuperación',
        to: { name: 'reportesVisor', params: { clave: 'recuperacion_notificaciones' } },
        action: 'read',
        subject: 'cartera',
      },
      {
        title: 'Configuración',
        to: 'carteraConfiguracion',
        action: 'read',
        subject: 'cartera',
      },
    ],
  },
]

export default carteraMenu
