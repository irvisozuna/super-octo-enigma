<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AvisoLecturista, EstadoLecturista, FilaLecturista } from '../types/monitor'
import { haceCuanto, horaCorta } from '../utils/tiempo'

/*
 * Lecturistas del día: estado (activo, en silencio, terminado, sin iniciar), última señal ("hace 4 min" o
 * "sin reporte desde las 10:12"), lecturas contra la meta, sectores, anomalías, batería y pendientes por enviar.
 */
const props = withDefaults(defineProps<{
  lecturistas: FilaLecturista[]
  esHoy: boolean
  ahora: Date
  cargando?: boolean
  filtroEstado?: EstadoLecturista | null
}>(), { cargando: false, filtroEstado: null })

const emit = defineEmits<{
  'seleccionar': [lecturista: FilaLecturista]
  'sector': [sectorId: number]
  'update:filtroEstado': [estado: EstadoLecturista | null]
}>()

const { t, n } = useI18n()

const ORDEN_ESTADOS: EstadoLecturista[] = ['activo', 'silencio', 'sin_iniciar', 'terminado', 'fuera_de_jornada']
const COLOR_ESTADO: Record<EstadoLecturista, string> = { activo: 'success', silencio: 'error', sin_iniciar: 'warning', terminado: 'primary', fuera_de_jornada: 'secondary' }
const ICONO_AVISO: Record<AvisoLecturista, string> = { silencio: 'tabler-bell-off', bateria: 'tabler-battery-1', atoradas: 'tabler-cloud-upload', lejos: 'tabler-map-pin-off' }

const busqueda = ref('')

type Orden = { key: string; order?: 'asc' | 'desc' | boolean }[]
const orden = ref<Orden>([{ key: 'lecturas', order: 'desc' }])

const headers = computed(() => [
  { title: t('monitoreo.lecturistas.nombre'), key: 'nombre', sortable: true },
  { title: t('monitoreo.lecturistas.estado'), key: 'estado', sortable: true, width: 130 },
  { title: t('monitoreo.lecturistas.ultimaSenal'), key: 'ultima_actividad', sortable: true, width: 180 },
  { title: t('monitoreo.lecturistas.lecturas'), key: 'lecturas', sortable: true, width: 190 },
  { title: t('monitoreo.lecturistas.sectores'), key: 'sectores', sortable: false },
  { title: t('monitoreo.lecturistas.anomalias'), key: 'anomalias', sortable: true, align: 'end' as const, width: 90 },
  { title: t('monitoreo.lecturistas.lejos'), key: 'lejos', sortable: true, align: 'end' as const, width: 80 },
  { title: t('monitoreo.lecturistas.bateria'), key: 'bateria_min', sortable: true, align: 'end' as const, width: 90 },
  { title: t('monitoreo.lecturistas.pendientes'), key: 'pendientes_enviar', sortable: true, align: 'end' as const, width: 100 },
])

const conteos = computed(() => {
  const c: Partial<Record<EstadoLecturista, number>> = {}
  for (const l of props.lecturistas)
    c[l.estado] = (c[l.estado] ?? 0) + 1

  // El estado filtrado se muestra aunque ya no tenga filas, para poder quitarlo
  return ORDEN_ESTADOS.filter(e => c[e] || e === props.filtroEstado).map(e => ({ estado: e, n: c[e] ?? 0 }))
})

const filas = computed(() => {
  let lista = props.lecturistas
  if (props.filtroEstado)
    lista = lista.filter(l => l.estado === props.filtroEstado)
  const q = busqueda.value.trim().toLowerCase()
  if (q)
    lista = lista.filter(l => l.nombre.toLowerCase().includes(q) || (l.gerencia ?? '').toLowerCase().includes(q) || l.sectores.some(s => s.sector.toLowerCase().includes(q)))

  return lista
})

const relativo = (clave: 'nunca' | 'ahora' | 'minutos' | 'horas' | 'dias', valor?: number) => t(`monitoreo.tiempo.${clave}`, { n: valor })

function senal(l: FilaLecturista): string {
  if (!l.ultima_actividad)
    return l.estado === 'sin_iniciar' ? t('monitoreo.lecturistas.sinActividad') : '—'
  if (!props.esHoy)
    return t('monitoreo.lecturistas.ultimaA', { hora: horaCorta(l.ultima_actividad) })
  if (l.estado === 'silencio')
    return t('monitoreo.lecturistas.sinReporteDesde', { hora: horaCorta(l.ultima_actividad) })

  return haceCuanto(l.ultima_actividad, relativo, props.ahora)
}

function colorMeta(l: FilaLecturista): string {
  const p = l.pct_meta ?? 0

  return p >= 100 ? 'success' : p >= 60 ? 'primary' : 'warning'
}

function alternarEstado(e: EstadoLecturista) {
  emit('update:filtroEstado', props.filtroEstado === e ? null : e)
}
</script>

<template>
  <VCard class="tabla-lecturistas">
    <VCardItem class="pb-2">
      <VCardTitle class="d-flex align-center gap-2 flex-wrap">
        {{ esHoy ? t('monitoreo.lecturistas.tituloHoy') : t('monitoreo.lecturistas.tituloDia') }}
        <VChip
          size="small"
          variant="tonal"
        >
          {{ n(filas.length) }}
        </VChip>
      </VCardTitle>
      <template #append>
        <div class="d-flex flex-wrap align-center gap-1">
          <VChip
            v-for="c in conteos"
            :key="c.estado"
            size="small"
            :color="COLOR_ESTADO[c.estado]"
            :variant="filtroEstado === c.estado ? 'flat' : 'tonal'"
            label
            @click="alternarEstado(c.estado)"
          >
            {{ c.n }} {{ t(`monitoreo.estadosLecturista.${c.estado}`) }}
          </VChip>
        </div>
      </template>
    </VCardItem>
    <VCardText class="pt-0 pb-2">
      <VTextField
        v-model="busqueda"
        density="compact"
        variant="outlined"
        hide-details
        clearable
        prepend-inner-icon="tabler-search"
        :placeholder="t('monitoreo.lecturistas.buscar')"
        class="tabla-lecturistas__buscar"
      />
    </VCardText>
    <VDataTable
      v-model:sort-by="orden"
      :headers="headers"
      :items="filas"
      item-value="lecturista_id"
      density="compact"
      :items-per-page="-1"
      hide-default-footer
      hover
      :loading="cargando"
      :no-data-text="t('monitoreo.lecturistas.sinResultados')"
      class="tabla-lecturistas__tabla"
    >
      <template #item="{ item }">
        <tr
          class="tabla-lecturistas__fila"
          @click="emit('seleccionar', item)"
        >
          <td>
            <div class="font-weight-medium">
              {{ item.nombre }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ item.gerencia ?? '' }}
            </div>
          </td>
          <td>
            <VChip
              size="x-small"
              :color="COLOR_ESTADO[item.estado]"
              variant="tonal"
              label
            >
              {{ t(`monitoreo.estadoLecturista.${item.estado}`) }}
            </VChip>
            <span
              v-for="a in item.avisos"
              :key="a"
              class="ms-1"
            >
              <VIcon
                :icon="ICONO_AVISO[a]"
                size="16"
                :color="a === 'silencio' ? 'error' : 'warning'"
                :title="t(`monitoreo.avisos.${a}`)"
              />
            </span>
          </td>
          <td class="text-caption">
            <span :class="{ 'text-error': item.estado === 'silencio' }">{{ senal(item) }}</span>
          </td>
          <td>
            <div class="d-flex align-center gap-2">
              <VProgressLinear
                :model-value="item.pct_meta ?? 0"
                :color="colorMeta(item)"
                height="6"
                rounded
                class="flex-grow-1"
              />
              <span class="text-caption text-no-wrap tabla-lecturistas__meta">{{ n(item.lecturas) }} / {{ n(item.meta) }}</span>
            </div>
            <div
              v-if="item.primera_lectura"
              class="text-caption text-medium-emphasis"
            >
              {{ horaCorta(item.primera_lectura) }} – {{ horaCorta(item.ultima_lectura) }}<span v-if="item.lecturas_por_hora"> · {{ t('monitoreo.lecturistas.porHora', { n: n(item.lecturas_por_hora) }) }}</span>
            </div>
          </td>
          <td>
            <div class="d-flex flex-wrap gap-1 py-1">
              <VChip
                v-for="s in item.sectores"
                :key="s.sector_id"
                size="x-small"
                variant="outlined"
                @click.stop="emit('sector', s.sector_id)"
              >
                {{ s.sector }} <span class="text-medium-emphasis ms-1">{{ s.lecturas }}</span>
              </VChip>
              <span
                v-if="!item.sectores.length && item.sectores_asignados.length"
                class="text-caption text-disabled"
              >{{ t('monitoreo.lecturistas.asignados', { n: item.sectores_asignados.length }) }}</span>
            </div>
          </td>
          <td class="text-end">
            {{ item.anomalias || '—' }}
          </td>
          <td class="text-end">
            <span :class="{ 'text-error': item.avisos.includes('lejos') }">{{ item.lejos || '—' }}</span>
          </td>
          <td class="text-end">
            <span :class="{ 'text-error': item.avisos.includes('bateria') }">{{ item.bateria_min === null ? '—' : `${item.bateria_min} %` }}</span>
          </td>
          <td class="text-end">
            <span :class="{ 'text-warning': item.pendientes_enviar > 0 }">{{ item.pendientes_enviar || '—' }}</span>
          </td>
        </tr>
      </template>
    </VDataTable>
  </VCard>
</template>

<style scoped>
.tabla-lecturistas__fila {
  cursor: pointer;
}

.tabla-lecturistas__buscar {
  max-inline-size: 360px;
}

.tabla-lecturistas__meta {
  min-inline-size: 72px;
  text-align: end;
}

.tabla-lecturistas__tabla :deep(th) {
  white-space: nowrap;
}
</style>
