<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EstadoNotificacion, Notificacion, Paginacion } from '../types/cartera'
import { COLOR_NOTIFICACION, COLOR_TICKET, esCapturable } from '../utils/cartera'
import type { ColumnaTabla, PaginacionTabla } from '@/components/as/tipos'
import type { ErrorReporte } from '@/services/errores'
import { fechaCorta, moneda } from '@/utils/formato'

/*
 * Tabla de notificaciones (lote y lista general). Con `seleccionable`, una casilla por fila capturable para la captura
 * en bloque; las que ya tienen resultado o son del módulo viejo no se marcan.
 */
const props = withDefaults(defineProps<{
  filas: Notificacion[]
  seleccion?: Set<string>
  seleccionable?: boolean
  cargando?: boolean
  error?: ErrorReporte | null
  paginacion?: Paginacion | null
  mostrarLote?: boolean
}>(), { seleccion: () => new Set(), seleccionable: false, cargando: false, error: null, paginacion: null, mostrarLote: false })

const emit = defineEmits<{
  'ver': [fila: Notificacion]
  'alternar': [id: string]
  'marcarTodas': [marcadas: boolean]
  'update:pagina': [pagina: number]
  'reintentar': []
}>()

const { t } = useI18n()

const capturables = computed(() => props.filas.filter(esCapturable))
const todas = computed(() => capturables.value.length > 0 && capturables.value.every(f => props.seleccion.has(f.id)))
const algunas = computed(() => !todas.value && capturables.value.some(f => props.seleccion.has(f.id)))

const columnas = computed<ColumnaTabla<Notificacion>[]>(() => [
  ...(props.seleccionable ? [{ clave: 'marca', titulo: '', formato: 'personalizado' as const, ordenable: false, ancho: 48 }] : []),
  { clave: 'ref', titulo: t('cartera.comun.referencia'), formato: 'personalizado', ancho: 150 },
  { clave: 'cuenta', titulo: t('cartera.comun.cuenta'), formato: 'personalizado', anchoMin: 220, ordenable: false },
  ...(props.mostrarLote ? [{ clave: 'notificador', titulo: t('cartera.comun.notificador'), formato: 'personalizado' as const, ancho: 200 }] : []),
  { clave: 'adeudo', titulo: t('cartera.comun.adeudo'), formato: 'moneda', ancho: 120 },
  { clave: 'estado', titulo: t('cartera.comun.estado'), formato: 'personalizado', ancho: 210 },
  { clave: 'ticket', titulo: t('cartera.comun.ticket'), formato: 'personalizado', ancho: 120, ordenable: false },
  { clave: 'vence', titulo: t('cartera.comun.vence'), formato: 'fecha', ancho: 110 },
])

const paginacionTabla = computed<PaginacionTabla | null>(() => props.paginacion
  ? { pagina: props.paginacion.pagina, porPagina: props.paginacion.por_pagina, total: props.paginacion.total }
  : null)

const textoTicket = (f: Notificacion) => f.ticket.estado === 'creado'
  ? t('cartera.ticket.creado', { id: f.ticket.id })
  : t(`cartera.ticket.${f.ticket.estado}`)
</script>

<template>
  <AsTablaDatos
    :columnas="columnas"
    :filas="filas"
    clave-fila="id"
    densidad="media"
    :cargando="cargando"
    :error="error"
    :paginacion="paginacionTabla"
    :por-pagina="paginacion ? undefined : -1"
    :ocultar-pie="!paginacion"
    clic-fila
    :vacio-titulo="t('cartera.notificaciones.sinFilas')"
    vacio-detalle=""
    vacio-icono="tabler-file-invoice"
    class="tabla-notificaciones"
    @fila="(f: Record<string, unknown>) => emit('ver', f as unknown as Notificacion)"
    @update:pagina="(p: number) => emit('update:pagina', p)"
    @reintentar="emit('reintentar')"
  >
    <template
      v-if="seleccionable"
      #encabezado-acciones
    >
      <VCheckbox
        :model-value="todas"
        :indeterminate="algunas"
        :disabled="!capturables.length"
        density="compact"
        hide-details
        :label="t('cartera.notificar.marcarTodas')"
        @update:model-value="(v: boolean | null) => emit('marcarTodas', !!v)"
      />
    </template>
    <template #celda-marca="{ fila }">
      <VCheckboxBtn
        v-if="esCapturable(fila)"
        :model-value="seleccion.has(fila.id)"
        density="compact"
        :aria-label="fila.ref"
        @click.stop
        @update:model-value="emit('alternar', fila.id)"
      />
    </template>
    <template #celda-ref="{ fila }">
      <span class="as-num">{{ fila.ref }}</span>
      <div class="as-secundario as-num">
        {{ fechaCorta(fila.emitida) }}
      </div>
    </template>
    <template #celda-cuenta="{ fila }">
      <span class="as-num">{{ fila.cuenta ?? '—' }}</span>
      <div
        class="as-secundario text-truncate"
        :title="fila.domicilio.join('; ')"
      >
        {{ fila.domicilio[0] ?? '' }}
      </div>
    </template>
    <template #celda-notificador="{ fila }">
      {{ fila.notificador ?? '—' }}
      <div
        v-if="fila.lote_ref"
        class="as-secundario as-num"
      >
        {{ fila.lote_ref }}
      </div>
    </template>
    <template #celda-adeudo="{ fila }">
      <span class="as-num">{{ moneda(fila.adeudo) }}</span>
    </template>
    <template #celda-estado="{ fila }">
      <VChip
        size="small"
        label
        variant="tonal"
        :color="COLOR_NOTIFICACION[(fila.estado_codigo ?? 'sin_estado') as EstadoNotificacion]"
      >
        {{ fila.estado ?? '—' }}
      </VChip>
      <div
        v-if="fila.origen === 'legado'"
        class="as-secundario mt-1"
      >
        {{ t('cartera.comun.origenLegado') }}
      </div>
    </template>
    <template #celda-ticket="{ fila }">
      <VChip
        size="small"
        label
        variant="text"
        :color="COLOR_TICKET[(fila as Notificacion).ticket.estado]"
        :title="fila.ticket.error ?? (fila.ticket.estado === 'pendiente' ? t('cartera.ticket.pendienteDetalle') : undefined)"
      >
        {{ textoTicket(fila) }}
      </VChip>
    </template>
  </AsTablaDatos>
</template>

<style scoped>
.tabla-notificaciones :deep(td) {
  vertical-align: top;
}
</style>
