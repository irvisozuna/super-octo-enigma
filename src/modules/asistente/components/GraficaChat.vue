<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTheme } from 'vuetify'
import type { GraficaChat } from '../utils/markdown'
import { hexToRgb } from '@layouts/utils'

/*
 * Gráfica dentro de una respuesta del asistente (XEL1-718), con los colores y el estilo de las gráficas de los
 * tableros. Lleva "Ver datos" con la tabla de los mismos valores, para leerlos exactos y para lectores de pantalla.
 */
const props = defineProps<{ grafica: GraficaChat }>()

const vuetifyTheme = useTheme()
const verDatos = ref(false)
const compacto = new Intl.NumberFormat('es-MX', { notation: 'compact', maximumFractionDigits: 1 })

function formatear(v: number, corto = false): string {
  const u = props.grafica.unidad ?? ''
  if (u === '$')
    return corto ? `$${compacto.format(v)}` : `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (u === '%')
    return `${v.toLocaleString('es-MX', { maximumFractionDigits: 1 })} %`
  const n = corto ? compacto.format(v) : v.toLocaleString('es-MX', { maximumFractionDigits: 2 })

  return u ? `${n} ${u}` : n
}

const series = computed(() => props.grafica.series.map(s => ({ name: s.nombre || props.grafica.titulo || '', data: s.valores })))

const opciones = computed(() => {
  const theme = vuetifyTheme.current.value
  const variable = theme.variables as Record<string, string | number>
  const etiqueta = `rgba(${hexToRgb(theme.colors['on-surface'])},${variable['medium-emphasis-opacity']})`
  const borde = `rgba(${hexToRgb(String(variable['border-color']))},${variable['border-opacity']})`
  const linea = props.grafica.tipo === 'linea'

  return {
    chart: { parentHeightOffset: 0, toolbar: { show: false }, animations: { speed: 400 } },
    colors: [theme.colors.primary, theme.colors.success, theme.colors.warning, theme.colors.info],
    legend: { show: series.value.length > 1, position: 'bottom', labels: { colors: etiqueta } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v: number) => formatear(v) } },
    stroke: { width: linea ? 3 : 0, curve: 'smooth' },
    markers: { size: linea ? 4 : 0 },
    grid: { borderColor: borde, strokeDashArray: 6, xaxis: { lines: { show: false } }, padding: { top: -10 } },
    plotOptions: { bar: { columnWidth: '50%', borderRadius: 4, borderRadiusApplication: 'end' } },
    xaxis: { categories: props.grafica.etiquetas, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: etiqueta }, rotate: -30, trim: true, hideOverlappingLabels: true } },
    yaxis: { labels: { style: { colors: etiqueta }, formatter: (v: number) => formatear(v, true) } },
  }
})
</script>

<template>
  <figure class="grafica-chat">
    <figcaption
      v-if="grafica.titulo"
      class="grafica-chat__titulo"
    >
      {{ grafica.titulo }}
    </figcaption>
    <VueApexCharts
      :type="grafica.tipo === 'linea' ? 'line' : 'bar'"
      height="240"
      :options="opciones"
      :series="series"
      aria-hidden="true"
    />
    <button
      type="button"
      class="grafica-chat__datos"
      :aria-expanded="verDatos"
      @click="verDatos = !verDatos"
    >
      {{ verDatos ? 'Ocultar datos' : 'Ver datos' }}
    </button>
    <div
      v-if="verDatos"
      class="md-tabla"
    >
      <table>
        <thead>
          <tr>
            <th />
            <th
              v-for="s in grafica.series"
              :key="s.nombre"
              class="text-end"
            >
              {{ s.nombre || grafica.titulo || 'Valor' }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(e, i) in grafica.etiquetas"
            :key="e"
          >
            <td>{{ e }}</td>
            <td
              v-for="s in grafica.series"
              :key="s.nombre"
              class="text-end"
            >
              {{ formatear(s.valores[i]) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </figure>
</template>

<style scoped>
.grafica-chat {
  padding: var(--as-sp-3);
  border: var(--as-borde);
  border-radius: var(--as-radio-md);
  background: rgb(var(--v-theme-surface));
  margin-block: 0 var(--as-sp-2);
  margin-inline: 0;
}

.grafica-chat__titulo {
  font-size: var(--as-fs-sm);
  font-weight: var(--as-peso-semi);
  margin-block-end: var(--as-sp-2);
}

.grafica-chat__datos {
  padding: 0;
  border: 0;
  background: none;
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
  font: inherit;
  font-size: var(--as-fs-sm);
}
</style>
