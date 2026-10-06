import { useMenuReportesStore } from '../stores/menuReportesStore'
import type { ElementoMenu } from '../types/api'
import { useCookie } from '@core/composable/useCookie'
import type { NavGroup, NavLink } from '@layouts/types'
import { ability } from '@/plugins/casl/ability'
import { useMenuStore } from '@/stores/menu'

/**
 * Llena el grupo "Reportes" del menú con las categorías y reportes que el servidor permite al usuario.
 * Se inicia una vez desde initCore y se recarga cuando cambian las habilidades (login/logout).
 */
const RUTAS: Record<ElementoMenu['tipo'], string> = { reporte: 'reportesVisor', tablero: 'reportesTablero', lote: 'reportesDocumentoLote' }

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
        ],
      })
    }

    for (const categoria of reportes.categorias) {
      const enlaces: NavLink[] = categoria.elementos
        .map(e => ({
          title: e.titulo,
          to: { name: RUTAS[e.tipo], params: { clave: e.key } },
          icon: e.tipo === 'tablero' ? { icon: 'tabler-chart-pie' } : e.tipo === 'lote' ? { icon: 'tabler-file-stack' } : undefined,
          action: e.tipo === 'lote' ? 'generate' : 'read',
          subject: e.tipo === 'tablero' ? 'tableros' : e.tipo === 'lote' ? 'documentos' : 'reportes',
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
