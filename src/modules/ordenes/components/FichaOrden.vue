<script setup lang="ts">
import { defineAsyncComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { obtenerOrden } from '../services/ordenesApi'
import type { EventoOrden, FichaOrden } from '../types/ordenes'
import { normalizarError } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'
import { fechaHoraCorta } from '@/utils/formato'

/* Detalle de una orden de trabajo (XEL1-680): sus datos, dónde se capturó y su bitácora. */
const props = defineProps<{ id: string | null; abierto: boolean }>()
const emit = defineEmits<{ 'update:abierto': [v: boolean] }>()

// MapLibre se baja solo cuando hay un mapa que mostrar
const AsMapaUbicacion = defineAsyncComponent(() => import('@/components/as/AsMapaUbicacion.vue'))

const { t } = useI18n()
const ficha = ref<FichaOrden | null>(null)
const cargando = ref(false)
const error = ref<ErrorReporte | null>(null)

async function cargar(id: string) {
  cargando.value = true
  error.value = null
  try {
    ficha.value = await obtenerOrden(id)
  }
  catch (e) {
    error.value = normalizarError(e)
  }
  finally {
    cargando.value = false
  }
}

function textoEvento(e: EventoOrden): string {
  const clave = `ordenes.ficha.accion.${e.accion}`
  const base = t(clave) === clave ? e.accion : t(clave)

  const estado = typeof e.despues?.estado === 'string' ? e.despues.estado.replaceAll('_', ' ') : ''

  return e.accion === 'estado' && estado ? `${base} · ${estado.charAt(0).toUpperCase()}${estado.slice(1)}` : base
}

watch(() => [props.id, props.abierto] as const, ([id, abierto]) => {
  if (id && abierto)
    cargar(id)
}, { immediate: true })
</script>

<template>
  <AsPanelLateral
    :abierto="abierto"
    :sobrelinea="ficha?.tipo.nombre ?? t('ordenes.ficha.sobrelinea')"
    :titulo="ficha ? `${t('ordenes.ordenes.cuenta')} ${ficha.cuenta ?? '—'}` : ''"
    :subtitulo="ficha?.datos?.notificacion ? t('ordenes.ordenes.notificacion', { ref: ficha.datos.notificacion }) : undefined"
    tamano="md"
    :cargando="cargando"
    @update:abierto="(v: boolean) => emit('update:abierto', v)"
  >
    <template
      v-if="ficha"
      #subencabezado
    >
      <div
        v-if="ficha.datos?.domicilio?.length"
        class="as-secundario mb-2"
      >
        {{ ficha.datos.domicilio.join(' · ') }}
      </div>
      <VChip
        size="small"
        label
        variant="tonal"
        :color="ficha.cerrada_en ? 'secondary' : 'warning'"
      >
        {{ ficha.estado.nombre ?? '—' }}
      </VChip>
    </template>

    <AsEstado
      v-if="error"
      tipo="error"
      :error="error"
      compacto
      @reintentar="id && cargar(id)"
    />
    <template v-else-if="ficha">
      <section>
        <dl class="as-datos mb-0">
          <div class="as-dato">
            <dt class="as-etiqueta">
              {{ t('ordenes.ordenes.agente') }}
            </dt>
            <dd class="as-valor mb-0">
              {{ ficha.agente?.nombre ?? '—' }}
            </dd>
          </div>
          <div class="as-dato">
            <dt class="as-etiqueta">
              {{ t('ordenes.ordenes.abierta') }}
            </dt>
            <dd class="as-valor as-num mb-0">
              {{ fechaHoraCorta(ficha.abierta_en) }}
            </dd>
          </div>
          <div class="as-dato">
            <dt class="as-etiqueta">
              {{ t('ordenes.ficha.entregada') }}
            </dt>
            <dd class="as-valor as-num mb-0">
              {{ fechaHoraCorta(ficha.entregada_en) }}
            </dd>
          </div>
          <div class="as-dato">
            <dt class="as-etiqueta">
              {{ t('ordenes.ordenes.cerrada') }}
            </dt>
            <dd class="as-valor as-num mb-0">
              {{ fechaHoraCorta(ficha.cerrada_en) }}
            </dd>
          </div>
          <div class="as-dato">
            <dt class="as-etiqueta">
              {{ t('ordenes.ordenes.vence') }}
            </dt>
            <dd class="as-valor as-num mb-0">
              {{ fechaHoraCorta(ficha.vence) }}
            </dd>
          </div>
          <div
            v-if="ficha.datos?.motivo_nombre"
            class="as-dato"
          >
            <dt class="as-etiqueta">
              {{ t('ordenes.ficha.motivo') }}
            </dt>
            <dd class="as-valor mb-0">
              {{ ficha.datos.motivo_nombre }}
            </dd>
          </div>
        </dl>
        <div
          v-if="ficha.observacion"
          class="mt-3"
        >
          <div class="as-etiqueta">
            {{ t('ordenes.ordenes.observacion') }}
          </div>
          <div class="as-valor">
            {{ ficha.observacion }}
          </div>
        </div>
      </section>

      <section v-if="ficha.lat != null && ficha.lng != null">
        <h3 class="as-seccion">
          {{ t('ordenes.ficha.dondeSeCapturo') }}
        </h3>
        <AsMapaUbicacion
          :lat="ficha.lat"
          :lng="ficha.lng"
          :altura="220"
          :etiqueta="t('ordenes.ficha.dondeSeCapturo')"
        />
      </section>

      <section>
        <h3 class="as-seccion">
          {{ t('ordenes.ficha.historial') }}
        </h3>
        <VTimeline
          density="compact"
          side="end"
          truncate-line="both"
        >
          <VTimelineItem
            v-for="(e, i) in ficha.historial"
            :key="i"
            size="x-small"
            dot-color="primary"
          >
            <div class="as-valor">
              {{ textoEvento(e) }}
            </div>
            <div class="as-secundario as-num">
              {{ fechaHoraCorta(e.fecha) }} · {{ t('ordenes.ficha.por', { usuario: e.usuario ?? t('ordenes.ficha.sistema') }) }}
            </div>
            <div
              v-if="e.despues?.observacion"
              class="as-secundario"
            >
              {{ e.despues.observacion }}
            </div>
          </VTimelineItem>
        </VTimeline>
      </section>
    </template>
  </AsPanelLateral>
</template>

<style scoped>
section + section {
  margin-block-start: var(--as-sp-6);
}
</style>
