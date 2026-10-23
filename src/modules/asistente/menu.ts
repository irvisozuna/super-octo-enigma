import type { VerticalNavItems } from '@layouts/types'

// Solo con `use asistente` (CASL); el botón del navbar abre el mismo chat en un panel lateral
const asistenteMenu: VerticalNavItems = [
  {
    title: 'Asistente',
    icon: { icon: 'tabler-sparkles' },
    to: 'asistente',
    action: 'use',
    subject: 'asistente',
  },
]

export default asistenteMenu
