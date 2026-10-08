<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EstadoSector } from '../types/mapa'
import type { RespuestaResumen, VistaMonitor } from '../types/monitor'
import { TOKEN_SECTOR, tokenAvance } from '@/utils/estados'
import { decimal, entero, porcentaje } from '@/utils/formato'

/*
 * Los cuatro indicadores que OOMSAPAS pidió leer en 5 segundos: avance general (campo y total), sectores por estado
 * (rezagados en rojo), lecturistas activos contra la meta diaria y avisos abiertos. Sobre AsIndicador del sistema de
 * diseño; los colores de estado salen de los tokens (TOKEN_SECTOR), no de hex.
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

const { t } = useI18n()

const ORDEN: EstadoSector[] = ['pendiente', 'iniciado', 'terminado', 'rezagado', 'sin_esperadas']

const avance = computed(() => props.resumen?.avance ?? null)
const pctCampo = computed(() => avance.value?.pct_campo ?? null)
const pctTotal = computed(() => avance.value?.pct_total ?? null)
const cargandoInicial = computed(() => props.cargando && !props.resumen)

const apoyoAvance = computed(() => {
  if (!avance.value)
    return ''
  const partes = [t('monitoreo.indicadores.atendidasDe', { a: entero(avance.value.atendidas), e: entero(avance.value.esperadas) })]
  if (avance.value.pendientes)
    partes.push(t('monitoreo.indicadores.pendientes', { n: entero(avance.value.pendientes) }))

  return partes.join(' · ')
})

const sectores = computed(() => ORDEN
  .map(e => ({ estado: e, n: props.resumen?.sectores.por_estado[e] ?? 0, token: TOKEN_SECTOR[e], etiqueta: t(`monitoreo.estadosSector.${e}`) }))
  .filter(s => s.estado !== 'sin_esperadas' || s.n > 0))

const totalSectores = computed(() => props.resumen?.sectores.total ?? 0)
const lect = computed(() => props.resumen?.lecturistas ?? null)
const avisos = computed(() => props.resumen?.avisos ?? null)
const hayAvisos = computed(() => (avisos.value?.total ?? 0) > 0)

const apoyoLecturistas = computed(() => {
  if (!lect.value)
    return ''
  const partes = [t('monitoreo.indicadores.lecturasDia', { n: entero(lect.value.lecturas_dia) }), t('monitoreo.indicadores.meta', { n: entero(lect.value.meta_diaria) })]
  if (lect.value.en_meta)
    partes.push(t('monitoreo.indicadores.enMeta', { n: lect.value.en_meta }))

  return partes.join(' · ')
})

const detalleAvisos = computed(() => {
  if (!avisos.value)
    return []

  return (['silencio', 'atoradas', 'bateria', 'lejos', 'rezagados'] as const)
    .map(k => ({ clave: k, n: avisos.value![k], etiqueta: t(`monitoreo.avisos.${k}`), color: k === 'rezagados' || k === 'silencio' ? 'error' : 'warning' }))
    .filter(a => a.n > 0)
})
</script>

<template>
  <VRow dense>
    <VCol
      cols="12"
      sm="6"
      lg="3"
    >
      <AsIndicador
        :etiqueta="t('monitoreo.indicadores.avance')"
        :valor="pctCampo === null ? null : porcentaje(pctCampo)"
        icono="tabler-gauge"
        :progreso="pctCampo"
        :color-progreso="tokenAvance(pctCampo)"
        :apoyo="apoyoAvance"
        :cargando="cargandoInicial"
      >
        <template
          v-if="pctTotal !== null && pctTotal !== pctCampo"
          #valor
        >
          <span class="as-indicador__valor as-num">{{ porcentaje(pctCampo) }}</span>
          <span class="text-body-2 text-medium-emphasis">{{ t('monitoreo.indicadores.conEstimadas', { pct: decimal(pctTotal, 1) }) }}</span>
        </template>
      </AsIndicador>
    </VCol>

    <VCol
      cols="12"
      sm="6"
      lg="3"
    >
      <AsIndicador
        :etiqueta="t('monitoreo.indicadores.sectores', { n: entero(totalSectores) })"
        icono="tabler-polygon"
        :cargando="cargandoInicial"
      >
        <template #valor>
          <div class="indicadores__estados">
            <button
              v-for="s in sectores"
              :key="s.estado"
              type="button"
              class="indicadores__estado"
              :class="{ 'indicadores__estado--alerta': s.estado === 'rezagado' && s.n > 0 }"
              :title="t('monitoreo.filtros.estadoSector')"
              @click="emit('estado', s.estado)"
            >
              <span
                class="as-punto"
                :class="`bg-${s.token}`"
              />
              <span class="indicadores__cifra as-num">{{ entero(s.n) }}</span>
              <span class="text-caption text-medium-emphasis">{{ s.etiqueta }}</span>
            </button>
          </div>
        </template>
      </AsIndicador>
    </VCol>

    <VCol
      cols="12"
      sm="6"
      lg="3"
    >
      <AsIndicador
        :etiqueta="vista === 'hoy' ? t('monitoreo.indicadores.lecturistasHoy') : t('monitoreo.indicadores.lecturistas')"
        :valor="lect?.activos ?? null"
        icono="tabler-users"
        :apoyo="apoyoLecturistas"
        :cargando="cargandoInicial"
      >
        <template #valor>
          <span class="as-indicador__valor as-num">{{ entero(lect?.activos) }}</span>
          <span class="text-body-2 text-medium-emphasis">{{ t('monitoreo.indicadores.activosDe', { n: entero(lect?.con_lecturas) }) }}</span>
        </template>
        <div
          v-if="lect && (lect.sin_iniciar || lect.silencio)"
          class="text-caption mt-1 d-flex flex-wrap gap-x-3"
        >
          <span
            v-if="lect.sin_iniciar"
            class="text-warning"
          >{{ t('monitoreo.indicadores.sinIniciar', { n: lect.sin_iniciar }) }}</span>
          <span
            v-if="lect.silencio"
            class="text-error"
          >{{ t('monitoreo.indicadores.enSilencio', { n: lect.silencio }) }}</span>
        </div>
      </AsIndicador>
    </VCol>

    <VCol
      cols="12"
      sm="6"
      lg="3"
    >
      <AsIndicador
        :etiqueta="t('monitoreo.indicadores.avisos')"
        :valor="avisos?.total ?? null"
        :icono="hayAvisos ? 'tabler-bell-ringing' : 'tabler-bell'"
        :color="hayAvisos ? 'error' : undefined"
        :estado="hayAvisos ? 'alerta' : 'normal'"
        :cargando="cargandoInicial"
      >
        <div class="d-flex flex-wrap gap-1 mt-2">
          <VChip
            v-for="a in detalleAvisos"
            :key="a.clave"
            size="x-small"
            :color="a.color"
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
          class="mt-1 px-0 align-self-start"
          append-icon="tabler-arrow-down"
          @click="emit('avisos')"
        >
          {{ t('monitoreo.indicadores.verSilencio') }}
        </VBtn>
      </AsIndicador>
    </VCol>
  </VRow>
</template>

<style scoped>
.indicadores__estados {
  display: flex;
  flex-wrap: wrap;
  gap: var(--as-sp-1) var(--as-sp-4);
  margin-block-start: var(--as-sp-1);
}

.indicadores__estado {
  display: inline-flex;
  align-items: baseline;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
  gap: var(--as-sp-1);
  padding-block: 0;
  padding-inline: 0;
}

.indicadores__estado .as-punto {
  transform: translateY(-1px);
}

.indicadores__estado:hover .text-caption,
.indicadores__estado:focus-visible .text-caption {
  text-decoration: underline;
}

.indicadores__estado:focus-visible {
  border-radius: var(--as-radio-sm);
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.indicadores__cifra {
  font-size: var(--as-fs-lg);
  font-weight: var(--as-peso-semi);
}

.indicadores__estado--alerta .indicadores__cifra {
  color: rgb(var(--v-theme-error));
}
</style>
