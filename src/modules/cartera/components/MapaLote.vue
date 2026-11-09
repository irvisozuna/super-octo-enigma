<script setup lang="ts">
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EstadoNotificacion, Notificacion } from '../types/cartera'
import { CENTRO_LOS_CABOS, ESTILO_CALLES, coordenadaValida } from '@/components/as/mapa'
import { useTokensTema } from '@/composables/useTokensTema'
import { entero } from '@/utils/formato'

/*
 * Recorrido de un lote (XEL1-680): cada cuenta con coordenada de la toma es un punto del color de su estado
 * (entregada, no entregada, en proceso, otro) y al tocarlo se abre su ficha. Las que no tienen coordenada solo se
 * cuentan: el padrón no sabe dónde está la toma.
 */
const props = defineProps<{ notificaciones: Notificacion[] }>()
const emit = defineEmits<{ ver: [id: string] }>()

const { t } = useI18n()
const tokens = useTokensTema()
const contenedor = ref<HTMLElement | null>(null)
let mapa: maplibregl.Map | null = null
let observador: ResizeObserver | null = null
let detenerTema: (() => void) | null = null
let cargado = false

type Grupo = 'entregada' | 'noEntregada' | 'proceso' | 'otro'

const ENTREGADA: EstadoNotificacion[] = ['recibida', 'firmada']
const NO_ENTREGADA: EstadoNotificacion[] = ['no_entregada', 'rechazada', 'usuario_no_localizado', 'toma_no_localizada', 'duplicidad']
const TOKEN: Record<Grupo, string> = { entregada: 'success', noEntregada: 'error', proceso: 'warning', otro: 'secondary' }

function grupo(n: Notificacion): Grupo {
  const e = n.estado_codigo
  if (e && ENTREGADA.includes(e))
    return 'entregada'
  if (e && NO_ENTREGADA.includes(e))
    return 'noEntregada'

  return e === 'en_proceso' ? 'proceso' : 'otro'
}

const conToma = computed(() => props.notificaciones.filter(n => n.toma && coordenadaValida(n.toma.lat, n.toma.lng)))
const sinToma = computed(() => props.notificaciones.length - conToma.value.length)

const leyenda = computed(() => (['entregada', 'noEntregada', 'proceso', 'otro'] as Grupo[])
  .map(g => ({ grupo: g, n: conToma.value.filter(x => grupo(x) === g).length }))
  .filter(x => x.n > 0))

const datos = computed(() => ({
  type: 'FeatureCollection' as const,
  features: conToma.value.map(n => ({
    type: 'Feature' as const,
    properties: { id: n.id, color: tokens.hex(TOKEN[grupo(n)]), titulo: `${n.ref} · ${n.cuenta ?? ''}` },
    geometry: { type: 'Point' as const, coordinates: [n.toma!.lng, n.toma!.lat] },
  })),
}))

function encuadrar() {
  if (!mapa || !conToma.value.length)
    return
  const primera = conToma.value[0].toma!
  const caja = new maplibregl.LngLatBounds([primera.lng, primera.lat], [primera.lng, primera.lat])

  conToma.value.forEach(n => caja.extend([n.toma!.lng, n.toma!.lat]))
  mapa.fitBounds(caja, { padding: 40, maxZoom: 17, duration: 0 })
}

function pintar() {
  if (!mapa || !cargado)
    return
  const fuente = mapa.getSource('cuentas') as maplibregl.GeoJSONSource | undefined
  if (fuente) {
    fuente.setData(datos.value)

    return
  }
  mapa.addSource('cuentas', { type: 'geojson', data: datos.value })
  mapa.addLayer({
    id: 'cuentas',
    type: 'circle',
    source: 'cuentas',
    paint: { 'circle-radius': 6, 'circle-color': ['get', 'color'], 'circle-stroke-width': 1.5, 'circle-stroke-color': '#ffffff' },
  })
  mapa.on('click', 'cuentas', e => {
    const id = e.features?.[0]?.properties?.id
    if (typeof id === 'string')
      emit('ver', id)
  })
  mapa.on('mouseenter', 'cuentas', () => {
    if (mapa)
      mapa.getCanvas().style.cursor = 'pointer'
  })
  mapa.on('mouseleave', 'cuentas', () => {
    if (mapa)
      mapa.getCanvas().style.cursor = ''
  })
}

onMounted(() => {
  if (!contenedor.value)
    return
  mapa = new maplibregl.Map({ container: contenedor.value, style: ESTILO_CALLES, center: CENTRO_LOS_CABOS, zoom: 11, attributionControl: { compact: true } })
  mapa.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
  mapa.on('load', () => {
    cargado = true
    pintar()
    encuadrar()
  })
  observador = new ResizeObserver(() => mapa?.resize())
  observador.observe(contenedor.value)
  detenerTema = tokens.alCambiar(pintar)
})

watch(datos, () => {
  pintar()
  encuadrar()
})

onBeforeUnmount(() => {
  observador?.disconnect()
  detenerTema?.()
  mapa?.remove()
  mapa = null
  cargado = false
})
</script>

<template>
  <div class="mapa-lote">
    <div
      ref="contenedor"
      class="mapa-lote__lienzo"
      role="img"
      :aria-label="t('cartera.lotes.mapaA11y', { n: conToma.length })"
    />
    <div class="mapa-lote__pie as-secundario">
      <span
        v-for="l in leyenda"
        :key="l.grupo"
        class="mapa-lote__clave"
      >
        <span
          class="mapa-lote__punto"
          :style="{ background: `rgb(var(--v-theme-${TOKEN[l.grupo]}))` }"
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

.mapa-lote__lienzo {
  block-size: 320px;
  inline-size: 100%;
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
