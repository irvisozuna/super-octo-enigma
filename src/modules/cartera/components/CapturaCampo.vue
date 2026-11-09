<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CapturaCampo } from '../types/cartera'
import { TOKEN_TOMA_LEJOS } from '@/utils/estados'
import { entero, fechaHoraCorta } from '@/utils/formato'

/*
 * Dónde y cuándo se capturó la notificación desde la app de campo (XEL1-679), con el mismo criterio que el detalle de
 * lectura del monitoreo: distancia a la toma y aviso «lejos» con el umbral del servidor. Sin captura de la app, solo
 * la ubicación de la toma.
 */
const props = defineProps<{
  captura: CapturaCampo | null | undefined
  toma: { lat: number; lng: number } | null | undefined
  umbral: number | undefined
}>()

const { t } = useI18n()

const conGps = computed(() => props.captura?.lat != null && props.captura?.lng != null)
const centro = computed(() => props.toma ?? (conGps.value ? { lat: props.captura!.lat!, lng: props.captura!.lng! } : null))

const segundo = computed(() => props.toma && conGps.value
  ? { lat: props.captura!.lat!, lng: props.captura!.lng!, etiqueta: t('cartera.campo.aqui') }
  : null)
</script>

<template>
  <section v-if="captura || toma">
    <h3 class="as-seccion d-flex align-center gap-2">
      {{ captura ? t('cartera.campo.titulo') : t('cartera.campo.soloToma') }}
      <VChip
        v-if="captura"
        size="x-small"
        label
        variant="tonal"
        color="info"
        prepend-icon="tabler-device-mobile"
      >
        {{ t('cartera.campo.app') }}
      </VChip>
    </h3>

    <dl
      v-if="captura"
      class="as-datos mb-3"
    >
      <div class="as-dato">
        <dt class="as-etiqueta">
          {{ t('cartera.campo.hora') }}
        </dt>
        <dd class="as-valor as-num mb-0">
          {{ fechaHoraCorta(captura.en) }}
        </dd>
      </div>
      <div class="as-dato">
        <dt class="as-etiqueta">
          {{ t('cartera.campo.gps') }}
        </dt>
        <dd class="as-valor as-num mb-0">
          {{ !conGps ? t('cartera.campo.sinGps') : captura.precision_m != null ? t('cartera.campo.precision', { n: entero(captura.precision_m) }) : t('cartera.campo.conGps') }}
        </dd>
      </div>
      <div class="as-dato">
        <dt class="as-etiqueta">
          {{ t('cartera.campo.distancia') }}
        </dt>
        <dd class="as-valor mb-0">
          <VChip
            v-if="captura.distancia_m != null"
            size="small"
            label
            variant="tonal"
            :color="captura.lejos ? TOKEN_TOMA_LEJOS : 'success'"
            :prepend-icon="captura.lejos ? 'tabler-map-pin-off' : 'tabler-map-pin-check'"
          >
            {{ captura.lejos ? t('cartera.campo.lejos', { n: entero(captura.distancia_m), umbral: umbral ?? 100 }) : t('cartera.campo.metros', { n: entero(captura.distancia_m) }) }}
          </VChip>
          <span
            v-else
            class="as-secundario"
          >
            {{ !toma ? t('cartera.campo.tomaSinCoordenada') : t('cartera.campo.sinGps') }}
          </span>
        </dd>
      </div>
    </dl>

    <AsMapaUbicacion
      :lat="centro?.lat"
      :lng="centro?.lng"
      :segundo="segundo"
      :altura="220"
      :etiqueta="toma ? t('cartera.campo.toma') : t('cartera.campo.aqui')"
    />
    <div
      v-if="segundo"
      class="captura__leyenda as-secundario mt-1"
    >
      <span class="captura__punto captura__punto--toma" /> {{ t('cartera.campo.toma') }}
      <span class="captura__punto captura__punto--aqui ms-3" /> {{ t('cartera.campo.aqui') }}
    </div>
  </section>
</template>

<style scoped>
.captura__leyenda {
  display: flex;
  align-items: center;
  gap: var(--as-sp-1);
}

.captura__punto {
  display: inline-block;
  border-radius: 50%;
  block-size: 0.625rem;
  inline-size: 0.625rem;
}

.captura__punto--toma {
  background: rgb(var(--v-theme-primary));
}

.captura__punto--aqui {
  background: rgb(var(--v-theme-warning));
}
</style>
