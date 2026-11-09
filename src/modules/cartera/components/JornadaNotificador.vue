<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { obtenerJornada } from '../services/carteraApi'
import type { EstadoNotificacion, Opcion, RespuestaJornada, ResultadoNotificacion, VisitaCampo } from '../types/cartera'
import { COLOR_NOTIFICACION, TOKEN_GRUPO, grupoResultado } from '../utils/cartera'
import MapaPuntos from './MapaPuntos.vue'
import type { PuntoMapa } from './MapaPuntos.vue'
import { normalizarError } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'
import { TOKEN_TOMA_LEJOS } from '@/utils/estados'
import { duracion, entero, fechaCorta, hora } from '@/utils/formato'

/*
 * La jornada de un notificador (XEL1-681), como la del lecturista: sus visitas en orden de hora, el recorrido en el
 * mapa (solo las de la app traen GPS) y los huecos largos sin visitas. Tocar una visita abre su ficha.
 */
const props = defineProps<{
  agente: { id: string; nombre: string } | null
  desde: string
  hasta: string
  abierto: boolean
  umbral: number
  resultados: Opcion<ResultadoNotificacion>[]
}>()

const emit = defineEmits<{ 'update:abierto': [v: boolean]; 'ver': [notificacion: string] }>()

/** Un hueco de al menos esto entre dos visitas del mismo día se marca. */
const HUECO_MIN = 45

const { t } = useI18n()
const datos = ref<RespuestaJornada | null>(null)
const cargando = ref(false)
const error = ref<ErrorReporte | null>(null)

async function cargar() {
  if (!props.agente)
    return
  cargando.value = true
  error.value = null
  try {
    datos.value = await obtenerJornada(props.agente.id, props.desde, props.hasta)
  }
  catch (e) {
    error.value = normalizarError(e)
  }
  finally {
    cargando.value = false
  }
}

watch(() => [props.agente?.id, props.desde, props.hasta, props.abierto] as const, ([id, , , abierto]) => {
  if (id && abierto)
    cargar()
}, { immediate: true })

const visitas = computed(() => datos.value?.visitas ?? [])
const variosDias = computed(() => props.desde !== props.hasta)
const nombre = (codigo: string) => props.resultados.find(r => r.codigo === codigo)?.nombre ?? codigo.replaceAll('_', ' ')

const cifras = computed(() => ({
  visitas: visitas.value.length,
  entregadas: visitas.value.filter(v => grupoResultado(v.resultado) === 'entregada').length,
  app: visitas.value.filter(v => v.app).length,
  lejos: visitas.value.filter(v => v.lejos).length,
}))

const conGps = computed(() => visitas.value.filter(v => v.lat != null && v.lng != null))

const puntos = computed<PuntoMapa[]>(() => conGps.value.map(v => ({
  id: v.notificacion_id,
  lat: v.lat!,
  lng: v.lng!,
  token: v.lejos ? TOKEN_TOMA_LEJOS : TOKEN_GRUPO[grupoResultado(v.resultado)],
  titulo: `${hora(v.en)} · ${v.ref} · ${nombre(v.resultado)}`,
})))

const ruta = computed<[number, number][]>(() => conGps.value.map(v => [v.lng!, v.lat!]))

type Fila = { tipo: 'visita'; v: VisitaCampo } | { tipo: 'hueco'; minutos: number; clave: string }

/** Las visitas con los huecos largos intercalados (solo dentro del mismo día). */
const filas = computed<Fila[]>(() => {
  const out: Fila[] = []

  visitas.value.forEach((v, i) => {
    const antes = visitas.value[i - 1]
    if (antes && fechaCorta(antes.en) === fechaCorta(v.en)) {
      const minutos = Math.round((new Date(v.en).getTime() - new Date(antes.en).getTime()) / 60000)
      if (minutos >= HUECO_MIN)
        out.push({ tipo: 'hueco', minutos, clave: `h-${i}` })
    }
    out.push({ tipo: 'visita', v })
  })

  return out
})
</script>

<template>
  <AsPanelLateral
    :abierto="abierto"
    :sobrelinea="t('cartera.monitor.jornada')"
    :titulo="agente?.nombre ?? ''"
    :subtitulo="desde === hasta ? fechaCorta(`${desde}T12:00:00`) : `${fechaCorta(`${desde}T12:00:00`)} – ${fechaCorta(`${hasta}T12:00:00`)}`"
    tamano="lg"
    :cargando="cargando"
    @update:abierto="(v: boolean) => emit('update:abierto', v)"
  >
    <AsEstado
      v-if="error"
      tipo="error"
      :error="error"
      compacto
      @reintentar="cargar"
    />
    <template v-else-if="datos">
      <div class="jornada__cifras mb-4">
        <AsIndicador
          :etiqueta="t('cartera.monitor.visitas')"
          :valor="cifras.visitas"
          :apoyo="t('cartera.monitor.desdeApp', { n: entero(cifras.app) })"
        />
        <AsIndicador
          :etiqueta="t('cartera.monitor.entregadas')"
          :valor="cifras.entregadas"
          color="success"
        />
        <AsIndicador
          :etiqueta="t('cartera.monitor.lejos')"
          :valor="cifras.lejos"
          :color="cifras.lejos ? TOKEN_TOMA_LEJOS : undefined"
          :apoyo="t('cartera.monitor.lejosApoyo', { n: umbral })"
        />
      </div>

      <section v-if="puntos.length">
        <MapaPuntos
          :puntos="puntos"
          :ruta="ruta"
          :altura="260"
          :etiqueta="t('cartera.monitor.recorridoA11y', { n: puntos.length })"
          class="jornada__mapa"
          @ver="id => emit('ver', id)"
        />
        <p
          v-if="conGps.length < visitas.length"
          class="as-secundario mt-1 mb-0"
        >
          {{ t('cartera.monitor.sinGps', { n: entero(visitas.length - conGps.length) }, visitas.length - conGps.length) }}
        </p>
      </section>

      <section>
        <h3 class="as-seccion">
          {{ t('cartera.monitor.visitasDelDia') }}
        </h3>
        <AsEstado
          v-if="!visitas.length"
          tipo="vacio"
          :titulo="t('cartera.monitor.sinVisitas')"
          detalle=""
          icono="tabler-walk"
          compacto
        />
        <ol
          v-else
          class="jornada__lista"
        >
          <li
            v-for="f in filas"
            :key="f.tipo === 'visita' ? f.v.notificacion_id : f.clave"
          >
            <div
              v-if="f.tipo === 'hueco'"
              class="jornada__hueco as-secundario"
            >
              <VIcon
                icon="tabler-clock-pause"
                size="16"
              />
              {{ t('cartera.monitor.hueco', { tiempo: duracion(f.minutos) }) }}
            </div>
            <button
              v-else
              type="button"
              class="jornada__visita"
              @click="emit('ver', f.v.notificacion_id)"
            >
              <span class="jornada__hora as-num">{{ variosDias ? `${fechaCorta(f.v.en)} ` : '' }}{{ hora(f.v.en) }}</span>
              <span class="jornada__que">
                <span class="as-valor as-num">{{ f.v.cuenta ?? '—' }}</span>
                <span class="as-secundario as-num"> · {{ f.v.ref }}</span>
              </span>
              <span class="jornada__chips">
                <VChip
                  size="x-small"
                  label
                  variant="tonal"
                  :color="COLOR_NOTIFICACION[f.v.resultado as EstadoNotificacion] ?? 'secondary'"
                >
                  {{ nombre(f.v.resultado) }}
                </VChip>
                <VChip
                  v-if="f.v.distancia_m != null"
                  size="x-small"
                  label
                  variant="tonal"
                  :color="f.v.lejos ? TOKEN_TOMA_LEJOS : 'success'"
                >
                  {{ t('cartera.campo.metros', { n: entero(f.v.distancia_m) }) }}
                </VChip>
                <VChip
                  size="x-small"
                  label
                  variant="text"
                  :prepend-icon="f.v.app ? 'tabler-device-mobile' : 'tabler-device-desktop'"
                >
                  {{ f.v.app ? t('cartera.monitor.app') : t('cartera.monitor.web') }}
                </VChip>
              </span>
            </button>
          </li>
        </ol>
      </section>
    </template>
  </AsPanelLateral>
</template>

<style scoped>
section + section {
  margin-block-start: var(--as-sp-6);
}

.jornada__cifras {
  display: grid;
  gap: var(--as-sp-3);
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.jornada__mapa {
  overflow: hidden;
  border: var(--as-borde);
  border-radius: var(--as-radio-lg);
}

.jornada__lista {
  padding: 0;
  margin: 0;
  list-style: none;
}

.jornada__visita {
  display: grid;
  align-items: center;
  border-block-end: var(--as-borde);
  gap: var(--as-sp-3);
  grid-template-columns: 4.5rem minmax(0, 1fr) auto;
  inline-size: 100%;
  padding-block: var(--as-sp-2);
  text-align: start;
}

.jornada__visita:hover {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.jornada__que {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.jornada__chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--as-sp-1);
}

.jornada__hueco {
  display: flex;
  align-items: center;
  border-block-end: var(--as-borde);
  gap: var(--as-sp-2);
  padding-block: var(--as-sp-2);
  padding-inline-start: 4.5rem;
}
</style>
