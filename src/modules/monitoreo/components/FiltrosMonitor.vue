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
 * filtradas del composable; aquí solo se pintan.
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

const opcionesEstado = computed(() => ESTADOS_SECTOR.map(e => ({ value: e, title: t(`monitoreo.estadosSector.${e}`) })))
const opcionesPeriodo = computed(() => props.periodos.map(p => ({ value: p.id, title: p.abierto ? t('monitoreo.filtros.periodoAbierto', { nombre: p.nombre }) : p.nombre })))
const opcionesGerencia = computed(() => props.gerencias.map(g => ({ value: g.id, title: g.label })))
const opcionesSistema = computed(() => props.sistemas.map(s => ({ value: s.id, title: s.nombre })))
const opcionesSector = computed(() => props.sectores.map(s => ({ value: s.id, title: s.nombre })))
const opcionesLecturista = computed(() => props.lecturistas.map(l => ({ value: l.id, title: l.nombre })))

function diaAnterior() {
  const d = new Date(`${dia.value}T12:00:00-07:00`)

  d.setDate(d.getDate() - 1)
  dia.value = d.toISOString().slice(0, 10)
}

function diaSiguiente() {
  if (dia.value >= hoy.value)
    return
  const d = new Date(`${dia.value}T12:00:00-07:00`)

  d.setDate(d.getDate() + 1)
  dia.value = d.toISOString().slice(0, 10)
}
</script>

<template>
  <VCard>
    <VCardText class="py-3">
      <div class="d-flex flex-wrap align-center gap-3">
        <VBtnToggle
          :model-value="filtros.vista"
          mandatory
          density="compact"
          variant="tonal"
          color="primary"
          class="filtros-monitor__vista"
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
          class="d-flex align-center gap-1"
        >
          <VBtn
            icon="tabler-chevron-left"
            size="small"
            variant="text"
            :disabled="deshabilitado"
            :aria-label="t('monitoreo.filtros.diaAnterior')"
            @click="diaAnterior"
          />
          <VTextField
            v-model="dia"
            type="date"
            density="compact"
            variant="outlined"
            hide-details
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
            @click="diaSiguiente"
          />
        </div>

        <VSelect
          :model-value="filtros.periodo ?? periodos.find(p => p.abierto)?.id ?? null"
          :items="opcionesPeriodo"
          :label="t('monitoreo.filtros.periodo')"
          density="compact"
          variant="outlined"
          hide-details
          :disabled="deshabilitado"
          class="filtros-monitor__campo"
          @update:model-value="(v: number | null) => emit('cambiar', { periodo: v && v !== periodos.find(p => p.abierto)?.id ? v : null })"
        />

        <VSelect
          v-if="gerencias.length !== 1"
          :model-value="filtros.gerencia"
          :items="opcionesGerencia"
          :label="t('monitoreo.filtros.gerencia')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          :disabled="deshabilitado"
          class="filtros-monitor__campo"
          @update:model-value="(v: number | null) => emit('cambiar', { gerencia: v ?? null })"
        />

        <VAutocomplete
          :model-value="filtros.sistema"
          :items="opcionesSistema"
          :label="t('monitoreo.filtros.sistema')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          :disabled="deshabilitado"
          :no-data-text="t('monitoreo.filtros.sinOpciones')"
          class="filtros-monitor__campo"
          @update:model-value="(v: number | null) => emit('cambiar', { sistema: v ?? null })"
        />

        <VAutocomplete
          :model-value="filtros.sector"
          :items="opcionesSector"
          :label="t('monitoreo.filtros.sector')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          :disabled="deshabilitado"
          :no-data-text="t('monitoreo.filtros.sinOpciones')"
          class="filtros-monitor__campo"
          @update:model-value="(v: number | null) => emit('cambiar', { sector: v ?? null })"
        />

        <VAutocomplete
          :model-value="filtros.lecturista"
          :items="opcionesLecturista"
          :label="t('monitoreo.filtros.lecturista')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          :disabled="deshabilitado"
          :no-data-text="t('monitoreo.filtros.sinOpciones')"
          class="filtros-monitor__campo"
          @update:model-value="(v: number | null) => emit('cambiar', { lecturista: v ?? null })"
        />

        <VSelect
          :model-value="filtros.estado"
          :items="opcionesEstado"
          :label="t('monitoreo.filtros.estadoSector')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          :disabled="deshabilitado"
          class="filtros-monitor__campo filtros-monitor__campo--corto"
          @update:model-value="(v: FiltrosMonitor['estado']) => emit('cambiar', { estado: v ?? null })"
        />

        <VBtn
          v-if="activos > 0"
          variant="text"
          size="small"
          prepend-icon="tabler-eraser"
          :disabled="deshabilitado"
          @click="emit('limpiar')"
        >
          {{ t('monitoreo.filtros.limpiar', { n: activos }) }}
        </VBtn>
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
.filtros-monitor__campo {
  flex: 1 1 180px;
  max-inline-size: 260px;
  min-inline-size: 160px;
}

.filtros-monitor__campo--corto {
  flex-basis: 150px;
  max-inline-size: 190px;
  min-inline-size: 140px;
}

.filtros-monitor__dia {
  inline-size: 160px;
}

.filtros-monitor__vista :deep(.v-btn) {
  min-inline-size: 96px;
}
</style>
