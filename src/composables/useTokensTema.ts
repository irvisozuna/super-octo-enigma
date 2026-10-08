import { computed, watch } from 'vue'
import type { WatchStopHandle } from 'vue'
import { useTheme } from 'vuetify'

/*
 * Lee los tokens de color del tema activo para quien no entiende clases de Vuetify: MapLibre, ApexCharts, SVG a mano.
 * Devuelve hex y se recalcula al cambiar de tema (claro/oscuro), así el mapa y las gráficas se repintan solos.
 *
 *   const tokens = useTokensTema()
 *   map.setPaintProperty('tomas', 'circle-color', tokens.hex('toma-leida'))
 *   tokens.alCambiar(() => repintar())
 */
export function useTokensTema() {
  const tema = useTheme()

  const colores = computed<Record<string, string>>(() => tema.current.value.colors as Record<string, string>)
  const esOscuro = computed(() => tema.current.value.dark)
  const nombre = computed(() => tema.global.name.value)

  /** Hex del token (`toma-leida`, `primary`, `on-surface`…), con respaldo neutro si no existe. */
  function hex(token: string, respaldo = '#94A3B8'): string {
    return colores.value[token] ?? respaldo
  }

  /** `rgba(…)` del token con la opacidad dada, para fondos y halos. */
  function rgba(token: string, alpha: number): string {
    const h = hex(token).replace('#', '')
    const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h
    const [r, g, b] = [0, 2, 4].map(i => Number.parseInt(n.slice(i, i + 2), 16))

    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  /** Varios tokens de una vez: `hexDe(['toma-leida', 'toma-anomalia'])` → { 'toma-leida': '#…', … }. */
  function hexDe(tokens: readonly string[]): Record<string, string> {
    return Object.fromEntries(tokens.map(t => [t, hex(t)]))
  }

  /** Ejecuta `fn` cada vez que cambia el tema (después de que Vuetify aplicó los colores). */
  function alCambiar(fn: () => void): WatchStopHandle {
    return watch(nombre, () => fn(), { flush: 'post' })
  }

  return { colores, esOscuro, nombre, hex, rgba, hexDe, alCambiar }
}
