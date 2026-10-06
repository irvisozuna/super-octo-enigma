import { useMenuReportesStore } from '../stores/menuReportesStore'
import { useCookie } from '@core/composable/useCookie'
import type { NavGroup, NavLink } from '@layouts/types'
import { ability } from '@/plugins/casl/ability'
import { useMenuStore } from '@/stores/menu'

/**
 * Llena el grupo "Reportes" del menú con las categorías y reportes que el servidor permite al usuario.
 * Se inicia una vez desde initCore y se recarga cuando cambian las habilidades (login/logout).
 */
export function useMenuReportes() {
  const menu = useMenuStore()
  const reportes = useMenuReportesStore()

  function construir(): (NavLink | NavGroup)[] {
    const hijos: (NavLink | NavGroup)[] = [
      { title: 'Todos los reportes', to: 'reportesIndice', action: 'read', subject: 'reportes' },
    ]

    for (const categoria of reportes.categorias) {
      // Los tableros entran en la fase 6, cuando exista su ruta
      const enlaces: NavLink[] = categoria.elementos
        .filter(e => e.tipo === 'reporte')
        .map(e => ({
          title: e.titulo,
          to: { name: 'reportesVisor', params: { clave: e.key } },
          action: 'read',
          subject: 'reportes',
        }))

      if (enlaces.length)
        hijos.push({ title: categoria.nombre, children: enlaces, action: 'read', subject: 'reportes' })
    }

    return hijos
  }

  function aplicar() {
    menu.setGroupChildren('Reportes', construir())
  }

  async function recargar() {
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
