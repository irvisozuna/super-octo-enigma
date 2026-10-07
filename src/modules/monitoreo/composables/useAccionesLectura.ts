import { ref } from 'vue'
import { borrarNota, cancelarRelectura, crearNota, marcarCoordenadaEnDuda, pedirRelectura } from '../services/monitoreoApi'
import type { MotivoRelectura, Nota, Relectura } from '../types/relecturas'
import { normalizarError } from '@/modules/reportes/services/errores'
import type { ErrorReporte } from '@/modules/reportes/services/errores'

/**
 * Acciones del detalle de lectura (F2.5): pedir y cancelar re-lectura, anotar y marcar la coordenada para corregir.
 * Solo manda a la API; el detalle se refresca desde fuera con el resultado.
 */
export function useAccionesLectura() {
  const ocupado = ref<'relectura' | 'cancelar' | 'nota' | 'borrarNota' | 'coordenada' | null>(null)
  const error = ref<ErrorReporte | null>(null)
  const ultimoMensaje = ref<string | null>(null)

  async function ejecutar<T>(clave: NonNullable<typeof ocupado.value>, fn: () => Promise<T>): Promise<T | null> {
    ocupado.value = clave
    error.value = null
    try {
      return await fn()
    }
    catch (e) {
      error.value = normalizarError(e)

      return null
    }
    finally {
      ocupado.value = null
    }
  }

  const pedir = (contrato: number, periodo: number, motivo: MotivoRelectura, nota?: string | null) => ejecutar('relectura', () => pedirRelectura(contrato, periodo, motivo, nota)) as Promise<Relectura | null>
  const cancelar = (id: string, nota?: string | null) => ejecutar('cancelar', () => cancelarRelectura(id, nota)) as Promise<Relectura | null>
  const anotar = (tipo: 'lectura' | 'sector', sujeto: number, periodo: number | null, texto: string) => ejecutar('nota', () => crearNota(tipo, sujeto, periodo, texto)) as Promise<Nota | null>
  const quitarNota = (id: string) => ejecutar('borrarNota', () => borrarNota(id)) as Promise<{ ok: boolean } | null>
  const marcarCoordenada = (contrato: number, enDuda = true) => ejecutar('coordenada', () => marcarCoordenadaEnDuda(contrato, enDuda)) as Promise<{ contrato_id: number; coordenada_en_duda: boolean } | null>

  return { ocupado, error, ultimoMensaje, pedir, cancelar, anotar, quitarNota, marcarCoordenada }
}
