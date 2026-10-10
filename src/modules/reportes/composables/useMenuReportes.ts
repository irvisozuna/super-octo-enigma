import { nextTick } from 'vue'
import { useMenuReportesStore } from '../stores/menuReportesStore'
import { useCookie } from '@core/composable/useCookie'
import type { NavGroup, NavLink } from '@layouts/types'
import { ability } from '@/plugins/casl/ability'
import { useMenuStore } from '@/stores/menu'

/**
 * Arma el grupo "Reportes" del menú y carga los reportes que el servidor permite al usuario.
 * El menú solo lleva las entradas generales: cada reporte o tablero se elige en "Todos los reportes".
 * Se inicia una vez desde initCore y se recarga cuando cambian las habilidades (login/logout).
 */

export function useMenuReportes() {
  const menu = useMenuStore()
  const reportes = useMenuReportesStore()

  function construir(): (NavLink | NavGroup)[] {
    const hijos: (NavLink | NavGroup)[] = [
      { title: 'Todos los reportes', to: 'reportesIndice', action: 'read', subject: 'reportes' },
      { title: 'Mis exportaciones', to: 'reportesExportaciones', action: 'read', subject: 'reportes' },
    ]

    if (ability.can('manage', 'reportes-admin')) {
      hijos.push({
        title: 'Administrar',
        action: 'manage',
        subject: 'reportes-admin',
        children: [
          { title: 'Reportes', to: 'reportesAdminReportes', action: 'manage', subject: 'reportes-admin' },
          { title: 'Tableros', to: 'reportesAdminTableros', action: 'manage', subject: 'reportes-admin' },
          { title: 'Permisos por rol', to: 'reportesAdminPermisos', action: 'manage', subject: 'reportes-admin' },
          { title: 'Usuarios y roles', to: 'reportesAdminUsuarios', action: 'manage', subject: 'reportes-admin' },
        ],
      })
    }

    return hijos
  }

  function aplicar() {
    menu.setGroupChildren('Reportes', construir())
  }

  async function recargar() {
    // El login actualiza las habilidades antes de guardar el token: se espera a que termine ese mismo ciclo
    await nextTick()
    if (!useCookie('accessToken').value || !ability.can('read', 'reportes')) {
      reportes.limpiar()
      aplicar()

      return
    }

    await reportes.cargar()
    aplicar()
  }

  function iniciar() {
    void recargar()
    ability.on('updated', () => {
      void recargar()
    })
  }

  return { iniciar, recargar, aplicar, construir }
}
