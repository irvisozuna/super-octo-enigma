<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EstadoSector } from '../types/mapa'
import type { RespuestaResumen, VistaMonitor } from '../types/monitor'
import { COLORES_SECTOR } from '../utils/geojson'

/*
 * Los cuatro indicadores que OOMSAPAS pidió leer en 5 segundos: avance general (campo y total), sectores por estado
 * (rezagados en rojo), lecturistas activos contra la meta diaria y avisos abiertos.
 */
const props = defineProps<{
  resumen: RespuestaResumen | null
  vista: VistaMonitor
  cargando?: boolean
}>()

const emit = defineEmits<{
  estado: [estado: EstadoSector]
  avisos: []
}>()

const { t, n } = useI18n()

const ORDEN: EstadoSector[] = ['pendiente', 'iniciado', 'terminado', 'rezagado', 'sin_esperadas']

const avance = computed(() => props.resumen?.avance ?? null)
const pctCampo = computed(() => avance.value?.pct_campo ?? null)
const pctTotal = computed(() => avance.value?.pct_total ?? null)

const colorAvance = computed(() => {
  const p = pctCampo.value
  if (p === null)
    return 'secondary'

  return p >= 98 ? 'success' : p >= 90 ? 'warning' : 'primary'
})

const sectores = computed(() => ORDEN.map(e => ({ estado: e, n: props.resumen?.sectores.por_estado[e] ?? 0, color: COLORES_SECTOR[e], etiqueta: t(`monitoreo.estadosSector.${e}`) })).filter(s => s.estado !== 'sin_esperadas' || s.n > 0))
const totalSectores = computed(() => props.resumen?.sectores.total ?? 0)

const lect = computed(() => props.resumen?.lecturistas ?? null)
const avisos = computed(() => props.resumen?.avisos ?? null)

const detalleAvisos = computed(() => {
  if (!avisos.value)
    return []

  return (['silencio', 'atoradas', 'bateria', 'lejos', 'rezagados'] as const).map(k => ({ clave: k, n: avisos.value![k], etiqueta: t(`monitoreo.avisos.${k}`) })).filter(a => a.n > 0)
})

function fmt(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : n(v)
}
</script>

<template>
  <VRow dense>
    <VCol
      cols="12"
      sm="6"
      lg="3"
    >
      <VCard class="indicador h-100">
        <VCardText>
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-body-2 text-medium-emphasis">{{ t('monitoreo.indicadores.avance') }}</span>
            <VIcon
              icon="tabler-gauge"
              size="20"
              class="text-medium-emphasis"
            />
          </div>
          <div class="d-flex align-baseline gap-2">
            <span class="text-h3 font-weight-bold">{{ pctCampo === null ? '—' : `${n(pctCampo)} %` }}</span>
            <span
              v-if="pctTotal !== null && pctTotal !== pctCampo"
              class="text-body-2 text-medium-emphasis"
            >{{ t('monitoreo.indicadores.conEstimadas', { pct: n(pctTotal) }) }}</span>
          </div>
          <VProgressLinear
            :model-value="pctCampo ?? 0"
            :color="colorAvance"
            height="6"
            rounded
            class="my-2"
          />
          <div class="text-caption text-medium-emphasis">
            {{ t('monitoreo.indicadores.atendidasDe', { a: fmt(avance?.atendidas), e: fmt(avance?.esperadas) }) }}
            <span v-if="avance?.pendientes"> · {{ t('monitoreo.indicadores.pendientes', { n: fmt(avance.pendientes) }) }}</span>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      sm="6"
      lg="3"
    >
      <VCard class="indicador h-100">
        <VCardText>
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-body-2 text-medium-emphasis">{{ t('monitoreo.indicadores.sectores', { n: fmt(totalSectores) }) }}</span>
            <VIcon
              icon="tabler-polygon"
              size="20"
              class="text-medium-emphasis"
            />
          </div>
          <div class="d-flex flex-wrap gap-x-4 gap-y-1 mt-1">
            <button
              v-for="s in sectores"
              :key="s.estado"
              type="button"
              class="indicador__estado text-start"
              :class="{ 'indicador__estado--alerta': s.estado === 'rezagado' && s.n > 0 }"
              @click="emit('estado', s.estado)"
            >
              <span
                class="indicador__punto me-1"
                :style="{ backgroundColor: s.color }"
              />
              <span class="text-h5 font-weight-bold">{{ n(s.n) }}</span>
              <span class="text-caption text-medium-emphasis ms-1">{{ s.etiqueta }}</span>
            </button>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      sm="6"
      lg="3"
    >
      <VCard class="indicador h-100">
        <VCardText>
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-body-2 text-medium-emphasis">{{ vista === 'hoy' ? t('monitoreo.indicadores.lecturistasHoy') : t('monitoreo.indicadores.lecturistas') }}</span>
            <VIcon
              icon="tabler-users"
              size="20"
              class="text-medium-emphasis"
            />
          </div>
          <div class="d-flex align-baseline gap-2">
            <span class="text-h3 font-weight-bold">{{ fmt(lect?.activos) }}</span>
            <span class="text-body-2 text-medium-emphasis">{{ t('monitoreo.indicadores.activosDe', { n: fmt(lect?.con_lecturas) }) }}</span>
          </div>
          <div class="text-caption text-medium-emphasis mt-2">
            {{ t('monitoreo.indicadores.lecturasDia', { n: fmt(lect?.lecturas_dia) }) }} · {{ t('monitoreo.indicadores.meta', { n: fmt(lect?.meta_diaria) }) }}
            <span v-if="lect?.en_meta"> · {{ t('monitoreo.indicadores.enMeta', { n: lect.en_meta }) }}</span>
          </div>
          <div
            v-if="lect && (lect.sin_iniciar || lect.silencio)"
            class="text-caption mt-1"
          >
            <span
              v-if="lect.sin_iniciar"
              class="text-warning me-2"
            >{{ t('monitoreo.indicadores.sinIniciar', { n: lect.sin_iniciar }) }}</span>
            <span
              v-if="lect.silencio"
              class="text-error"
            >{{ t('monitoreo.indicadores.enSilencio', { n: lect.silencio }) }}</span>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      sm="6"
      lg="3"
    >
      <VCard
        class="indicador h-100"
        :class="{ 'indicador--alerta': (avisos?.total ?? 0) > 0 }"
      >
        <VCardText>
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-body-2 text-medium-emphasis">{{ t('monitoreo.indicadores.avisos') }}</span>
            <VIcon
              :icon="(avisos?.total ?? 0) > 0 ? 'tabler-bell-ringing' : 'tabler-bell'"
              size="20"
              :class="(avisos?.total ?? 0) > 0 ? 'text-error' : 'text-medium-emphasis'"
            />
          </div>
          <div
            class="text-h3 font-weight-bold"
            :class="{ 'text-error': (avisos?.total ?? 0) > 0 }"
          >
            {{ fmt(avisos?.total) }}
          </div>
          <div class="d-flex flex-wrap gap-1 mt-2">
            <VChip
              v-for="a in detalleAvisos"
              :key="a.clave"
              size="x-small"
              :color="a.clave === 'rezagados' || a.clave === 'silencio' ? 'error' : 'warning'"
              variant="tonal"
              label
            >
              {{ a.n }} {{ a.etiqueta }}
            </VChip>
            <span
              v-if="!detalleAvisos.length"
              class="text-caption text-medium-emphasis"
            >{{ t('monitoreo.indicadores.sinAvisos') }}</span>
          </div>
          <VBtn
            v-if="avisos?.silencio"
            variant="text"
            size="x-small"
            color="error"
            class="mt-1 px-0 text-none"
            append-icon="tabler-arrow-down"
            @click="emit('avisos')"
          >
            {{ t('monitoreo.indicadores.verSilencio') }}
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style scoped>
.indicador {
  min-block-size: 132px;
}

.indicador--alerta {
  box-shadow: inset 4px 0 0 rgb(var(--v-theme-error));
}

.indicador__estado {
  display: inline-flex;
  align-items: baseline;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
  padding-block: 0;
  padding-inline: 0;
}

.indicador__estado:hover .text-caption {
  text-decoration: underline;
}

.indicador__estado--alerta .text-h5 {
  color: rgb(var(--v-theme-error));
}

.indicador__punto {
  display: inline-block;
  border-radius: 50%;
  block-size: 10px;
  inline-size: 10px;
  transform: translateY(-1px);
}
</style>
