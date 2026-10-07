import type { VerticalNavItems } from '@layouts/types'

// El grupo solo aparece con `read monitoreo` (CASL); la granularidad por gerencia la aplica el servidor
const monitoreoMenu: VerticalNavItems = [
  {
    title: 'Monitoreo',
    icon: { icon: 'tabler-map-2' },
    action: 'read',
    subject: 'monitoreo',
    children: [
      {
        title: 'Monitor de lecturas',
        to: 'monitoreoInicio',
        action: 'read',
        subject: 'monitoreo',
      },
      {
        title: 'Pantalla grande',
        to: 'monitoreoQuiosco',
        action: 'read',
        subject: 'monitoreo',
      },
      {
        title: 'Coordenadas de tomas',
        to: 'monitoreoCoordenadas',
        action: 'read',
        subject: 'monitoreo',
      },
      {
        title: 'Gerencias por usuario',
        to: 'monitoreoAdminAlcances',
        action: 'manage',
        subject: 'monitoreo-admin',
      },
    ],
  },
]

export default monitoreoMenu
