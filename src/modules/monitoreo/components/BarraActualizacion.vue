<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RespuestaResumen } from '../types/monitor'
import { haceCuanto, minutosDesde, segundosDesde } from '../utils/tiempo'
import EstadoDatos from './EstadoDatos.vue'

/*
 * "Actualizado hace N s" y "última lectura recibida hace X": el monitor se refresca cada minuto, pero las lecturas
 * llegan con el retraso de la app; las dos cifras juntas evitan leer un dato viejo como si fuera en vivo.
 */
const props = defineProps<{
  actualizado: Date | null
  datos: RespuestaResumen['datos'] | null
  ahora: Date
  refrescando: boolean
  pausado: boolean
}>()

const emit = defineEmits<{
  refrescar: []
}>()

const { t } = useI18n()

const relativo = (clave: 'nunca' | 'ahora' | 'minutos' | 'horas' | 'dias', n?: number) => t(`monitoreo.tiempo.${clave}`, { n })

const segundos = computed(() => segundosDesde(props.actualizado, props.ahora))

const textoActualizado = computed(() => {
  if (segundos.value === null)
    return t('monitoreo.barra.sinActualizar')
  if (segundos.value < 60)
    return t('monitoreo.barra.actualizadoSegundos', { n: segundos.value })

  return t('monitoreo.barra.actualizado', { hace: haceCuanto(props.actualizado, relativo, props.ahora) })
})

const ultimaLectura = computed(() => haceCuanto(props.datos?.ultima_lectura_recibida, relativo, props.ahora))
const minutosLectura = computed(() => minutosDesde(props.datos?.ultima_lectura_recibida, props.ahora))
const sincronizacionCaida = computed(() => (minutosDesde(props.datos?.ultima_sincronizacion, props.ahora) ?? Number.POSITIVE_INFINITY) > 10)
</script>

<template>
  <div class="d-flex flex-wrap align-center gap-2">
    <VChip
      size="small"
      variant="tonal"
      :color="pausado ? 'secondary' : 'default'"
      :prepend-icon="pausado ? 'tabler-player-pause' : 'tabler-refresh'"
    >
      {{ pausado ? t('monitoreo.barra.pausado') : textoActualizado }}
    </VChip>
    <VChip
      size="small"
      variant="tonal"
      :color="minutosLectura !== null && minutosLectura > 180 ? 'warning' : 'default'"
      prepend-icon="tabler-clock-down"
    >
      {{ t('monitoreo.barra.ultimaLectura', { hace: ultimaLectura }) }}
    </VChip>
    <VChip
      v-if="sincronizacionCaida"
      size="small"
      variant="tonal"
      color="warning"
      prepend-icon="tabler-plug-connected-x"
    >
      {{ t('monitoreo.barra.sincronizacionCaida') }}
    </VChip>
    <VMenu :close-on-content-click="false">
      <template #activator="{ props: activador }">
        <VBtn
          v-bind="activador"
          size="small"
          variant="text"
          icon="tabler-database"
          :aria-label="t('monitoreo.datos.titulo')"
        />
      </template>
      <div class="barra-actualizacion__datos">
        <EstadoDatos />
      </div>
    </VMenu>
    <VBtn
      size="small"
      variant="tonal"
      icon="tabler-refresh"
      :loading="refrescando"
      :aria-label="t('monitoreo.barra.refrescar')"
      @click="emit('refrescar')"
    />
  </div>
</template>

<style scoped>
.barra-actualizacion__datos {
  inline-size: 360px;
  max-inline-size: 90vw;
}
</style>
