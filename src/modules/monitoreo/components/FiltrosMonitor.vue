<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ESTADOS_SECTOR } from '../composables/useFiltrosMonitor'
import type { GerenciaRef } from '../types/api'
import type { FiltrosMonitor, RespuestaCatalogos, VistaMonitor } from '../types/monitor'
import { hoyLocal } from '../utils/tiempo'

/*
 * Barra de filtros del monitor: vista (hoy / periodo), periodo, día, gerencia, sistema, sector, lecturista y estado del
 * sector. Las opciones dependientes (sistemas y sectores de la gerencia, lecturistas de la gerencia) vienen ya
 * filtradas del composable; aquí solo se pintan. Sobre AsBarraFiltros: densidad y anchos los pone el sistema de diseño.
 */
const props = defineProps<{
  filtros: FiltrosMonitor
  gerencias: GerenciaRef[]
  periodos: RespuestaCatalogos['periodos']
  sistemas: RespuestaCatalogos['sistemas']
  sectores: RespuestaCatalogos['sectores']
  lecturistas: RespuestaCatalogos['lecturistas']
  activos: number
  deshabilitado?: boolean
}>()

const emit = defineEmits<{
  cambiar: [cambios: Partial<FiltrosMonitor>]
  vista: [vista: VistaMonitor]
  limpiar: []
}>()

const { t } = useI18n()

const hoy = computed(() => hoyLocal())

const dia = computed({
  get: () => props.filtros.dia ?? hoy.value,
  set: (v: string | null) => emit('cambiar', { dia: v && v !== hoy.value ? v : null }),
})

const periodoAbierto = computed(() => props.periodos.find(p => p.abierto)?.id ?? null)
const opcionesEstado = computed(() => ESTADOS_SECTOR.map(e => ({ value: e, title: t(`monitoreo.estadosSector.${e}`) })))
const opcionesPeriodo = computed(() => props.periodos.map(p => ({ value: p.id, title: p.abierto ? t('monitoreo.filtros.periodoAbierto', { nombre: p.nombre }) : p.nombre })))
const opcionesGerencia = computed(() => props.gerencias.map(g => ({ value: g.id, title: g.label })))
const opcionesSistema = computed(() => props.sistemas.map(s => ({ value: s.id, title: s.nombre })))
const opcionesSector = computed(() => props.sectores.map(s => ({ value: s.id, title: s.nombre })))
const opcionesLecturista = computed(() => props.lecturistas.map(l => ({ value: l.id, title: l.nombre })))

function moverDia(delta: number) {
  if (delta > 0 && dia.value >= hoy.value)
    return
  const d = new Date(`${dia.value}T12:00:00-07:00`)

  d.setDate(d.getDate() + delta)
  dia.value = d.toISOString().slice(0, 10)
}
</script>

<template>
  <AsBarraFiltros
    :activos="activos"
    :deshabilitado="deshabilitado"
    @limpiar="emit('limpiar')"
  >
    <template #inicio>
      <VBtnToggle
        :model-value="filtros.vista"
        mandatory
        class="filtros-monitor__vista"
        :aria-label="`${t('monitoreo.filtros.vistaHoy')} / ${t('monitoreo.filtros.vistaPeriodo')}`"
        @update:model-value="(v: VistaMonitor) => emit('vista', v)"
      >
        <VBtn
          value="hoy"
          prepend-icon="tabler-calendar-event"
        >
          {{ t('monitoreo.filtros.vistaHoy') }}
        </VBtn>
        <VBtn
          value="periodo"
          prepend-icon="tabler-calendar-month"
        >
          {{ t('monitoreo.filtros.vistaPeriodo') }}
        </VBtn>
      </VBtnToggle>

      <div
        v-if="filtros.vista === 'hoy'"
        class="d-flex align-center"
      >
        <VBtn
          icon="tabler-chevron-left"
          size="small"
          variant="text"
          :disabled="deshabilitado"
          :aria-label="t('monitoreo.filtros.diaAnterior')"
          @click="moverDia(-1)"
        />
        <VTextField
          v-model="dia"
          type="date"
          :max="hoy"
          :disabled="deshabilitado"
          class="filtros-monitor__dia"
          :aria-label="t('monitoreo.filtros.dia')"
        />
        <VBtn
          icon="tabler-chevron-right"
          size="small"
          variant="text"
          :disabled="deshabilitado || dia >= hoy"
          :aria-label="t('monitoreo.filtros.diaSiguiente')"
          @click="moverDia(1)"
        />
      </div>
    </template>

    <VSelect
      :model-value="filtros.periodo ?? periodoAbierto"
      :items="opcionesPeriodo"
      :label="t('monitoreo.filtros.periodo')"
      :disabled="deshabilitado"
      class="as-filtro--md"
      @update:model-value="(v: number | null) => emit('cambiar', { periodo: v && v !== periodoAbierto ? v : null })"
    />

    <VSelect
      v-if="gerencias.length !== 1"
      :model-value="filtros.gerencia"
      :items="opcionesGerencia"
      :label="t('monitoreo.filtros.gerencia')"
      clearable
      :disabled="deshabilitado"
      class="as-filtro--md"
      @update:model-value="(v: number | null) => emit('cambiar', { gerencia: v ?? null })"
    />

    <VAutocomplete
      :model-value="filtros.sistema"
      :items="opcionesSistema"
      :label="t('monitoreo.filtros.sistema')"
      clearable
      :disabled="deshabilitado"
      :no-data-text="t('monitoreo.filtros.sinOpciones')"
      class="as-filtro--md"
      @update:model-value="(v: number | null) => emit('cambiar', { sistema: v ?? null })"
    />

    <VAutocomplete
      :model-value="filtros.sector"
      :items="opcionesSector"
      :label="t('monitoreo.filtros.sector')"
      clearable
      :disabled="deshabilitado"
      :no-data-text="t('monitoreo.filtros.sinOpciones')"
      class="as-filtro--md"
      @update:model-value="(v: number | null) => emit('cambiar', { sector: v ?? null })"
    />

    <VAutocomplete
      :model-value="filtros.lecturista"
      :items="opcionesLecturista"
      :label="t('monitoreo.filtros.lecturista')"
      clearable
      :disabled="deshabilitado"
      :no-data-text="t('monitoreo.filtros.sinOpciones')"
      class="as-filtro--md"
      @update:model-value="(v: number | null) => emit('cambiar', { lecturista: v ?? null })"
    />

    <VSelect
      :model-value="filtros.estado"
      :items="opcionesEstado"
      :label="t('monitoreo.filtros.estadoSector')"
      clearable
      :disabled="deshabilitado"
      class="as-filtro--md"
      @update:model-value="(v: FiltrosMonitor['estado']) => emit('cambiar', { estado: v ?? null })"
    />
  </AsBarraFiltros>
</template>

<style scoped>
.filtros-monitor__dia {
  inline-size: var(--as-ancho-filtro-sm);
}

.filtros-monitor__vista :deep(.v-btn) {
  min-inline-size: calc(var(--as-ancho-filtro-sm) * 0.6);
}
</style>
