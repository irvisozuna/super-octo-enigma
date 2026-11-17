<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Notificacion } from '../types/cartera'
import { TOKEN_GRUPO, grupoResultado } from '../utils/cartera'
import type { GrupoResultado } from '../utils/cartera'
import MapaPuntos from './MapaPuntos.vue'
import type { PuntoMapa } from './MapaPuntos.vue'
import { coordenadaValida } from '@/components/as/mapa'
import { entero } from '@/utils/formato'

/*
 * Recorrido de un lote (XEL1-680): cada cuenta con coordenada de la toma es un punto del color de su estado y al
 * tocarlo se abre su ficha. Las que no tienen coordenada solo se cuentan: el padrón no sabe dónde está la toma.
 */
const props = defineProps<{ notificaciones: Notificacion[] }>()
const emit = defineEmits<{ ver: [id: string] }>()

const { t } = useI18n()

const grupo = (n: Notificacion): GrupoResultado => grupoResultado(n.estado_codigo)

const conToma = computed(() => props.notificaciones.filter(n => n.toma && coordenadaValida(n.toma.lat, n.toma.lng)))
const sinToma = computed(() => props.notificaciones.length - conToma.value.length)

const puntos = computed<PuntoMapa[]>(() => conToma.value.map(n => ({
  id: n.id,
  lat: n.toma!.lat,
  lng: n.toma!.lng,
  token: TOKEN_GRUPO[grupo(n)],
  titulo: `${n.ref} · ${n.cuenta ?? ''}`,
})))

const leyenda = computed(() => (['entregada', 'noEntregada', 'proceso', 'otro'] as GrupoResultado[])
  .map(g => ({ grupo: g, n: conToma.value.filter(x => grupo(x) === g).length }))
  .filter(x => x.n > 0))
</script>

<template>
  <div class="mapa-lote">
    <MapaPuntos
      :puntos="puntos"
      :etiqueta="t('cartera.lotes.mapaA11y', { n: conToma.length })"
      @ver="id => emit('ver', id)"
    />
    <div class="mapa-lote__pie as-secundario">
      <span
        v-for="l in leyenda"
        :key="l.grupo"
        class="mapa-lote__clave"
      >
        <span
          class="mapa-lote__punto"
          :style="{ background: `rgb(var(--v-theme-${TOKEN_GRUPO[l.grupo]}))` }"
        />
        {{ t(`cartera.lotes.grupo.${l.grupo}`) }} <span class="as-num">{{ entero(l.n) }}</span>
      </span>
      <span
        v-if="sinToma"
        class="ms-auto"
      >{{ t('cartera.lotes.sinCoordenada', { n: entero(sinToma) }, sinToma) }}</span>
    </div>
  </div>
</template>

<style scoped>
.mapa-lote {
  overflow: hidden;
  border: var(--as-borde);
  border-radius: var(--as-radio-lg);
  background: rgb(var(--v-theme-surface));
}

.mapa-lote__pie {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--as-sp-4);
  padding-block: var(--as-sp-2);
  padding-inline: var(--as-sp-3);
}

.mapa-lote__clave {
  display: inline-flex;
  align-items: center;
  gap: var(--as-sp-1);
}

.mapa-lote__punto {
  display: inline-block;
  border-radius: 50%;
  block-size: 0.625rem;
  inline-size: 0.625rem;
}
</style>
