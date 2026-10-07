import { computed, ref } from 'vue'
import { actualizarAlcance, obtenerAlcances } from '../services/monitoreoApi'
import type { Gerencia, UsuarioAlcance } from '../types/api'
import { normalizarError } from '@/modules/reportes/services/errores'
import type { ErrorReporte } from '@/modules/reportes/services/errores'

/**
 * Pantalla "Gerencias por usuario" (manage monitoring): lista de usuarios de la empresa con sus gerencias,
 * catálogo de Dolibarr y guardado por usuario. La selección se edita por fila y se guarda fila por fila.
 */
export function useAlcancesAdmin() {
  const usuarios = ref<UsuarioAlcance[]>([])
  const gerencias = ref<Gerencia[]>([])
  const aviso = ref<string | null>(null)
  const cargando = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const errorGuardado = ref<ErrorReporte | null>(null)
  const guardando = ref<Set<string>>(new Set())
  const seleccion = ref<Record<string, number[]>>({})
  const busqueda = ref('')
  const soloConMonitoreo = ref(true)

  const catalogoDisponible = computed(() => gerencias.value.length > 0)

  const filtrados = computed(() => {
    const texto = busqueda.value.trim().toLowerCase()

    return usuarios.value.filter(u => {
      if (soloConMonitoreo.value && !u.tiene_monitoreo && !u.es_admin)
        return false
      if (!texto)
        return true

      return u.nombre.toLowerCase().includes(texto)
        || u.email.toLowerCase().includes(texto)
        || u.roles.some(r => r.toLowerCase().includes(texto))
    })
  })

  function asignadas(usuario: UsuarioAlcance): number[] {
    return usuario.gerencias.map(g => g.id).sort((a, b) => a - b)
  }

  function restaurar(usuario: UsuarioAlcance) {
    seleccion.value = { ...seleccion.value, [usuario.id]: asignadas(usuario) }
  }

  function cambio(usuario: UsuarioAlcance): boolean {
    const actual = asignadas(usuario)
    const nuevo = [...(seleccion.value[usuario.id] ?? actual)].sort((a, b) => a - b)

    return actual.length !== nuevo.length || actual.some((id, i) => id !== nuevo[i])
  }

  function seleccionar(usuario: UsuarioAlcance, ids: number[]) {
    seleccion.value = { ...seleccion.value, [usuario.id]: [...ids] }
  }

  async function cargar(signal?: AbortSignal) {
    cargando.value = true
    error.value = null
    try {
      const respuesta = await obtenerAlcances({ signal })

      usuarios.value = respuesta.usuarios
      gerencias.value = respuesta.gerencias
      aviso.value = respuesta.aviso
      seleccion.value = Object.fromEntries(respuesta.usuarios.map(u => [u.id, asignadas(u)]))
    }
    catch (e) {
      const normalizado = normalizarError(e)
      if (normalizado.codigo !== 'CANCELADO')
        error.value = normalizado
    }
    finally {
      cargando.value = false
    }
  }

  async function guardar(usuario: UsuarioAlcance): Promise<boolean> {
    const ids = seleccion.value[usuario.id] ?? asignadas(usuario)

    guardando.value = new Set([...guardando.value, usuario.id])
    errorGuardado.value = null
    try {
      const respuesta = await actualizarAlcance(usuario.id, ids)

      usuarios.value = usuarios.value.map(u => (u.id === usuario.id ? { ...u, gerencias: respuesta.gerencias } : u))
      seleccion.value = { ...seleccion.value, [usuario.id]: respuesta.gerencias.map(g => g.id).sort((a, b) => a - b) }

      return true
    }
    catch (e) {
      errorGuardado.value = normalizarError(e)

      return false
    }
    finally {
      const pendientes = new Set(guardando.value)

      pendientes.delete(usuario.id)
      guardando.value = pendientes
    }
  }

  return {
    usuarios,
    gerencias,
    aviso,
    cargando,
    error,
    errorGuardado,
    guardando,
    seleccion,
    busqueda,
    soloConMonitoreo,
    catalogoDisponible,
    filtrados,
    asignadas,
    restaurar,
    cambio,
    seleccionar,
    cargar,
    guardar,
  }
}
