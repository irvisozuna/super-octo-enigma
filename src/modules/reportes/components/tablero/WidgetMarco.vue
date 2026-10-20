<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import type { ErrorReporte } from '../../services/errores'
import type { ColumnaDef } from '../../types/reporte'
import type { WidgetDef } from '../../types/tablero'
import { claveMensaje } from '../../services/errores'
import AyudaColumna from '../tabla/AyudaColumna.vue'
import ExplicacionColumnaDialogo from '../tabla/ExplicacionColumnaDialogo.vue'

const props = defineProps<{
  widget: WidgetDef
  cargando: boolean
  error: ErrorReporte | null
  vacio: boolean
}>()

const emit = defineEmits<{
  reintentar: []
}>()

const { t } = useI18n()
const router = useRouter()

/** Reporte de detalle del widget (`config.report`): enlace «Ver reporte» en la esquina de la tarjeta. */
const reporte = computed(() => {
  const clave = props.widget.config.report

  return typeof clave === 'string' && clave && router.hasRoute('reportesVisor') ? { name: 'reportesVisor', params: { clave } } : null
})

/*
 * Explicación del widget (`config.help`, mismas llaves que en las columnas de reporte): ícono ⓘ junto al título y el
 * mismo modal de los reportes, con el widget como si fuera una columna.
 */
const explicacion = computed<ColumnaDef | null>(() => {
  const help = props.widget.config.help as { summary?: string; origin?: string; calculation?: string } | undefined
  if (!help?.summary)
    return null

  return {
    columna: props.widget.key,
    etiqueta: props.widget.titulo,
    tipo: 'string',
    formato: 'texto',
    alineacion: 'start',
    visible: true,
    total: false,
    ayuda: { resumen: help.summary, origen: help.origin ?? null, calculo: help.calculation ?? null },
  }
})

const explicando = ref(false)
</script>

<template>
  <VCard
    class="widget-marco h-100 d-flex flex-column"
    :loading="cargando"
  >
    <VCardItem class="pb-2">
      <VCardTitle class="text-body-1 font-weight-medium d-flex align-center">
        <span class="text-truncate">{{ widget.titulo }}</span>
        <AyudaColumna
          v-if="explicacion?.ayuda"
          :etiqueta="widget.titulo"
          :ayuda="explicacion.ayuda"
          @abrir="explicando = true"
        />
      </VCardTitle>
      <template
        v-if="reporte"
        #append
      >
        <VBtn
          :to="reporte"
          icon="tabler-table-share"
          size="small"
          variant="text"
          :title="t('reportes.tablero.verReporte')"
          :aria-label="`${t('reportes.tablero.verReporte')}: ${widget.titulo}`"
        />
      </template>
    </VCardItem>

    <VCardText class="flex-grow-1 d-flex flex-column">
      <div
        v-if="error"
        class="widget-estado text-error"
      >
        <VIcon
          icon="tabler-alert-circle"
          size="28"
        />
        <p class="text-body-2 mb-1">
          {{ t(claveMensaje(error)) }}
        </p>
        <VBtn
          size="small"
          variant="text"
          @click="emit('reintentar')"
        >
          {{ t('reportes.comunes.reintentar') }}
        </VBtn>
      </div>

      <div
        v-else-if="vacio && !cargando"
        class="widget-estado text-medium-emphasis"
      >
        <VIcon
          icon="tabler-database-off"
          size="28"
        />
        <p class="text-body-2 mb-0">
          {{ t('reportes.tablero.widgetSinDatos') }}
        </p>
      </div>

      <div
        v-else-if="vacio && cargando"
        class="widget-estado text-medium-emphasis"
      >
        <VProgressCircular
          indeterminate
          size="28"
          width="3"
        />
      </div>

      <slot v-else />
    </VCardText>

    <ExplicacionColumnaDialogo
      v-if="explicacion"
      v-model:abierto="explicando"
      :columnas="[explicacion]"
      :todas="[]"
    />
  </VCard>
</template>

<style scoped>
.widget-estado {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-block-size: 120px;
  text-align: center;
}
</style>
