<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'
import type { DatosWidget, TipoWidget } from '../../types/tablero'
import type { FormatoColumna } from '../../types/reporte'
import { formatearValor } from '../../utils/formato'
import { hexToRgb } from '@layouts/utils'

const props = defineProps<{
  tipo: TipoWidget
  datos: DatosWidget
}>()

const vuetifyTheme = useTheme()

const compacto = new Intl.NumberFormat('es-MX', { notation: 'compact', maximumFractionDigits: 1 })

const formato = computed<FormatoColumna>(() => props.datos.columnas[1]?.formato ?? 'decimal')
const categorias = computed(() => props.datos.filas.map(f => String(f.dimension ?? '')))

/** Series: una por valor de la columna `series` (apiladas) o una sola con `valor`. */
const series = computed(() => {
  const conSeries = props.datos.filas.some(f => f.series && Object.keys(f.series).length > 0)
  if (!conSeries)
    return [{ name: props.datos.columnas[1]?.etiqueta ?? '', data: props.datos.filas.map(f => Number(f.valor ?? 0)) }]

  const nombres = Array.from(new Set(props.datos.filas.flatMap(f => Object.keys(f.series ?? {}))))

  return nombres.map(nombre => ({ name: nombre, data: props.datos.filas.map(f => Number(f.series?.[nombre] ?? 0)) }))
})

const paleta = computed(() => {
  const c = vuetifyTheme.current.value.colors

  return [c.primary, c.success, c.warning, c.info, c.error, c.secondary, '#8E24AA', '#00897B', '#F4511E', '#3949AB']
})

const colores = computed(() => {
  const theme = vuetifyTheme.current.value
  const variable = theme.variables as Record<string, string | number>

  return {
    etiqueta: `rgba(${hexToRgb(theme.colors['on-surface'])},${variable['medium-emphasis-opacity']})`,
    leyenda: `rgba(${hexToRgb(theme.colors['on-background'])},${variable['high-emphasis-opacity']})`,
    borde: `rgba(${hexToRgb(String(variable['border-color']))},${variable['border-opacity']})`,
  }
})

const esDona = computed(() => props.tipo === 'pie')
const tipoApex = computed(() => (props.tipo === 'pie' ? 'donut' : props.tipo))

const opciones = computed(() => {
  const formatear = (v: unknown) => formatearValor(v, formato.value)

  const base = {
    chart: { parentHeightOffset: 0, toolbar: { show: false }, stacked: series.value.length > 1 },
    colors: paleta.value,
    legend: { show: esDona.value || series.value.length > 1, position: 'bottom', labels: { colors: colores.value.leyenda }, markers: { offsetX: -3 } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: formatear } },
    stroke: { width: props.tipo === 'line' ? 3 : 0, curve: 'smooth' },
  }

  if (esDona.value) {
    return {
      ...base,
      labels: categorias.value,
      plotOptions: { pie: { donut: { size: '68%', labels: { show: true, name: { color: colores.value.leyenda }, value: { color: colores.value.leyenda, formatter: (v: string) => formatear(v) }, total: { show: true, label: 'Total', color: colores.value.etiqueta, formatter: (w: { globals: { seriesTotals: number[] } }) => formatear(w.globals.seriesTotals.reduce((a, b) => a + b, 0)) } } } } },
      stroke: { width: 2, colors: [String(vuetifyTheme.current.value.colors.surface)] },
    }
  }

  return {
    ...base,
    grid: { borderColor: colores.value.borde, strokeDashArray: 6, xaxis: { lines: { show: false } }, padding: { top: -10 } },
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 4, borderRadiusApplication: 'end' } },
    xaxis: { categories: categorias.value, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: colores.value.etiqueta }, rotate: -30, trim: true, hideOverlappingLabels: true } },
    yaxis: { labels: { style: { colors: colores.value.etiqueta }, formatter: (v: number) => (formato.value === 'moneda' ? `$${compacto.format(v)}` : compacto.format(v)) } },
    markers: { size: props.tipo === 'line' ? 4 : 0 },
  }
})

const serieDona = computed(() => props.datos.filas.map(f => Number(f.valor ?? 0)))
</script>

<template>
  <VueApexCharts
    :type="tipoApex"
    height="300"
    :options="opciones"
    :series="esDona ? serieDona : series"
  />
</template>
