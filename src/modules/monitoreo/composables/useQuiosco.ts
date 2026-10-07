import { computed, ref } from 'vue'
import type { GerenciaRef } from '../types/api'

/**
 * Rotación de gerencias del quiosco: recorre solo las gerencias del alcance del usuario (o se fija en una), cada
 * `segundos`. Funciones puras separadas del temporizador para probarlas sin reloj.
 */
export interface EstadoRotacion {
  gerencias: GerenciaRef[]
  indice: number
  fija: number | null
}

/** Gerencia que toca mostrar: la fija si existe en el alcance; si no, la del índice; null = todas (sin alcance acotado). */
export function gerenciaActual(estado: EstadoRotacion): GerenciaRef | null {
  if (estado.fija !== null)
    return estado.gerencias.find(g => g.id === estado.fija) ?? null
  if (!estado.gerencias.length)
    return null

  return estado.gerencias[((estado.indice % estado.gerencias.length) + estado.gerencias.length) % estado.gerencias.length]
}

/** Siguiente índice; con una sola gerencia o una fija no hay rotación. */
export function siguienteIndice(estado: EstadoRotacion): number {
  if (estado.fija !== null || estado.gerencias.length <= 1)
    return estado.indice

  return (estado.indice + 1) % estado.gerencias.length
}

/** Lee `?gerencia=` y lo acepta solo si está en el alcance. */
export function gerenciaFijaDesdeQuery(valor: unknown, gerencias: GerenciaRef[]): number | null {
  const n = typeof valor === 'string' && valor !== '' ? Number(valor) : null
  if (n === null || !Number.isInteger(n) || n <= 0)
    return null

  return gerencias.some(g => g.id === n) ? n : null
}

export function useQuiosco(segundosPorDefecto = 30) {
  const gerencias = ref<GerenciaRef[]>([])
  const indice = ref(0)
  const fija = ref<number | null>(null)
  const segundos = ref(segundosPorDefecto)
  const restante = ref(segundosPorDefecto)

  const estado = computed<EstadoRotacion>(() => ({ gerencias: gerencias.value, indice: indice.value, fija: fija.value }))
  const actual = computed(() => gerenciaActual(estado.value))
  const rota = computed(() => fija.value === null && gerencias.value.length > 1)

  function configurar(lista: GerenciaRef[], fijaId: number | null, seg: number) {
    gerencias.value = lista
    fija.value = fijaId
    segundos.value = Math.max(10, seg || segundosPorDefecto)
    indice.value = 0
    restante.value = segundos.value
  }

  /** Un segundo más: devuelve true cuando cambió de gerencia. */
  function tic(): boolean {
    if (!rota.value)
      return false
    restante.value -= 1
    if (restante.value > 0)
      return false
    indice.value = siguienteIndice(estado.value)
    restante.value = segundos.value

    return true
  }

  function avanzar() {
    indice.value = siguienteIndice(estado.value)
    restante.value = segundos.value
  }

  return { gerencias, indice, fija, segundos, restante, actual, rota, configurar, tic, avanzar }
}
