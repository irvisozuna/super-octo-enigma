<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { obtenerEstadoSync } from '../services/monitoreoApi'
import type { RespuestaSync } from '../types/api'

/* Hasta dónde llegan los datos replicados: para no engañar con el retraso de la app ni con un sync caído. */
const { t } = useI18n()
const estado = ref<RespuestaSync | null>(null)
const error = ref(false)

let controlador: AbortController | null = null
let temporizador: ReturnType<typeof setInterval> | null = null

function haceCuanto(fecha: string | null | undefined): string {
  if (!fecha)
    return t('monitoreo.datos.nunca')

  const minutos = Math.max(0, Math.round((Date.now() - new Date(fecha.includes('T') ? fecha : `${fecha.replace(' ', 'T')}-07:00`).getTime()) / 60000))
  if (minutos < 1)
    return t('monitoreo.datos.ahora')
  if (minutos < 60)
    return t('monitoreo.datos.minutos', { n: minutos })
  if (minutos < 48 * 60)
    return t('monitoreo.datos.horas', { n: Math.round(minutos / 60) })

  return t('monitoreo.datos.dias', { n: Math.round(minutos / 1440) })
}

const sincronizacionCaida = computed(() => {
  if (!estado.value?.ultima_corrida)
    return true

  return Date.now() - new Date(estado.value.ultima_corrida).getTime() > 10 * 60000
})

const conError = computed(() => (estado.value?.sincronizadores ?? []).some(s => s.error))

async function cargar() {
  controlador?.abort()
  controlador = new AbortController()
  try {
    estado.value = await obtenerEstadoSync({ signal: controlador.signal })
    error.value = false
  }
  catch (e) {
    if ((e as { name?: string })?.name !== 'AbortError')
      error.value = true
  }
}

onMounted(() => {
  cargar()
  temporizador = setInterval(cargar, 60000)
})
onBeforeUnmount(() => {
  controlador?.abort()
  if (temporizador)
    clearInterval(temporizador)
})
</script>

<template>
  <VCard>
    <VCardItem>
      <VCardTitle>{{ t('monitoreo.datos.titulo') }}</VCardTitle>
    </VCardItem>
    <VCardText v-if="error">
      <VAlert
        type="warning"
        variant="tonal"
        density="compact"
      >
        {{ t('monitoreo.datos.sinEstado') }}
      </VAlert>
    </VCardText>
    <VCardText v-else-if="estado">
      <VAlert
        v-if="sincronizacionCaida || conError"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        {{ sincronizacionCaida ? t('monitoreo.datos.sincronizacionCaida') : t('monitoreo.datos.sincronizacionConError') }}
      </VAlert>
      <VList
        density="compact"
        class="py-0"
      >
        <VListItem :title="t('monitoreo.datos.periodo')">
          <template #append>
            <span class="font-weight-medium">{{ estado.periodo_abierto?.nombre ?? '—' }}</span>
          </template>
        </VListItem>
        <VListItem :title="t('monitoreo.datos.actualizado')">
          <template #append>
            <span class="font-weight-medium">{{ haceCuanto(estado.ultima_corrida) }}</span>
          </template>
        </VListItem>
        <VListItem :title="t('monitoreo.datos.ultimaLectura')">
          <template #append>
            <span class="font-weight-medium">{{ haceCuanto(estado.ultima_lectura_recibida) }}</span>
          </template>
        </VListItem>
        <VListItem :title="t('monitoreo.datos.ultimaCaptura')">
          <template #append>
            <span class="font-weight-medium">{{ haceCuanto(estado.ultima_captura) }}</span>
          </template>
        </VListItem>
        <VListItem :title="t('monitoreo.datos.ultimoRastreo')">
          <template #append>
            <span class="font-weight-medium">{{ haceCuanto(estado.ultimo_rastreo) }}</span>
          </template>
        </VListItem>
        <VListItem :title="t('monitoreo.datos.lecturasPeriodo')">
          <template #append>
            <span class="font-weight-medium">{{ estado.conteos.lecturas_periodo_abierto.toLocaleString('es-MX') }}</span>
          </template>
        </VListItem>
        <VListItem :title="t('monitoreo.datos.contratos')">
          <template #append>
            <span class="font-weight-medium">{{ estado.conteos.contratos.toLocaleString('es-MX') }}</span>
          </template>
        </VListItem>
      </VList>
    </VCardText>
    <VCardText v-else>
      <VProgressLinear indeterminate />
    </VCardText>
  </VCard>
</template>
