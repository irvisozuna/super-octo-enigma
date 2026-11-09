<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFichaNotificacion } from '../composables/useNotificaciones'
import type { EstadoNotificacion, EventoHistorial, Opcion, ResultadoNotificacion } from '../types/cartera'
import { COLOR_NOTIFICACION, COLOR_TICKET } from '../utils/cartera'
import DialogoResultado from './DialogoResultado.vue'
import EvidenciaNotificacion from './EvidenciaNotificacion.vue'
import { useNotificacion } from '@/composables/useNotificacion'
import { fecha, fechaHoraCorta, fechaIso } from '@/utils/formato'

/*
 * Ficha de una notificación en panel lateral: identidad, cifras, resultado, ticket e historial; desde aquí se captura el
 * resultado, se cancela y se reimprime la notificación con su acta.
 */
const props = defineProps<{
  abierto: boolean
  id: string | null
  resultados: Opcion<ResultadoNotificacion>[]
}>()

const emit = defineEmits<{
  'update:abierto': [valor: boolean]
  'cambio': []
}>()

const { t } = useI18n()
const notificar = useNotificacion()
const f = useFichaNotificacion()
const capturando = ref(false)
const cancelando = ref(false)
const motivo = ref('')

watch(() => [props.abierto, props.id] as const, ([abierto, id]) => {
  if (abierto && id)
    f.cargar(id)
}, { immediate: true })

const n = computed(() => f.ficha.value)
const emitidaDia = computed(() => n.value?.emitida ? fechaIso(new Date(n.value.emitida)) : null)

function textoEvento(e: EventoHistorial): string {
  const clave = `cartera.ficha.accion.${e.accion}`
  const base = t(clave) === clave ? e.accion : t(clave)
  const estado = e.despues?.estado ? ` · ${props.resultados.find(r => r.codigo === e.despues?.estado)?.nombre ?? e.despues.estado}` : ''

  return `${base}${e.accion === 'estado' ? estado : ''}`
}

async function guardarResultado(datos: { resultado: ResultadoNotificacion; fecha: string; observacion: string | null }) {
  if (await f.capturar(datos.resultado, datos.fecha, datos.observacion)) {
    capturando.value = false
    notificar.exito(t('cartera.captura.guardado'))
    emit('cambio')
  }
}

async function confirmarCancelacion() {
  if (!motivo.value.trim())
    return
  if (await f.cancelar(motivo.value.trim())) {
    cancelando.value = false
    motivo.value = ''
    notificar.exito(t('cartera.captura.cancelada'))
    emit('cambio')
  }
}
</script>

<template>
  <AsPanelLateral
    :abierto="abierto"
    :sobrelinea="t('cartera.ficha.sobrelinea')"
    :titulo="n ? `${t('cartera.comun.cuenta')} ${n.cuenta ?? '—'}` : ''"
    :subtitulo="n?.ref"
    tamano="md"
    :cargando="f.cargando.value"
    @update:abierto="(v: boolean) => emit('update:abierto', v)"
  >
    <template #acciones>
      <VBtn
        v-if="n"
        size="small"
        variant="text"
        prepend-icon="tabler-printer"
        :loading="f.accionando.value === 'documento'"
        @click="f.reimprimir()"
      >
        {{ t('cartera.ficha.reimprimir') }}
      </VBtn>
    </template>

    <template
      v-if="n"
      #subencabezado
    >
      <!-- Ubicación de la toma y, abajo, la dirección por partes del padrón (no son el mismo dato repetido) -->
      <div class="mb-2">
        <div class="as-valor">
          {{ n.domicilio[0] ?? '—' }}
        </div>
        <div
          v-for="(linea, i) in n.domicilio.slice(1)"
          :key="i"
          class="as-secundario"
        >
          {{ linea }}
        </div>
      </div>
      <div class="d-flex flex-wrap gap-1">
        <VChip
          size="small"
          label
          variant="tonal"
          :color="COLOR_NOTIFICACION[(n.estado_codigo ?? 'sin_estado') as EstadoNotificacion]"
        >
          {{ n.estado ?? '—' }}
        </VChip>
        <VChip
          size="small"
          label
          variant="tonal"
          :color="COLOR_TICKET[n.ticket.estado]"
          prepend-icon="tabler-ticket"
        >
          {{ n.ticket.estado === 'creado' ? t('cartera.ticket.creado', { id: n.ticket.id }) : t(`cartera.ticket.${n.ticket.estado}`) }}
        </VChip>
        <VChip
          v-if="n.origen === 'legado'"
          size="small"
          label
          variant="tonal"
        >
          {{ t('cartera.comun.origenLegado') }}
        </VChip>
      </div>
    </template>

    <AsEstado
      v-if="f.error.value && !n"
      tipo="error"
      :error="f.error.value"
      @reintentar="id && f.cargar(id)"
    />
    <AsEstado
      v-else-if="!n"
      tipo="cargando"
      esqueleto="tarjeta"
      :filas="3"
    />
    <template v-else>
      <VAlert
        v-if="f.errorAccion.value"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-3"
        closable
        @click:close="f.errorAccion.value = null"
      >
        {{ f.errorAccion.value.mensaje }}
      </VAlert>
      <VAlert
        v-if="!n.se_captura_aqui && n.estado_codigo === 'en_proceso'"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        {{ t('cartera.ficha.legado') }}
      </VAlert>

      <!-- Cifras clave -->
      <div class="ficha__cifras mb-4">
        <AsIndicador
          :etiqueta="t('cartera.comun.adeudo')"
          :valor="n.adeudo"
          formato="moneda"
          :apoyo="n.meses != null ? t('cartera.ficha.mesesAdeudo', { n: n.meses }, n.meses) : undefined"
        />
        <AsIndicador
          :etiqueta="t('cartera.comun.vence')"
          :valor="fecha(n.vence)"
        />
      </div>

      <section>
        <h3 class="as-seccion">
          {{ t('cartera.ficha.sobrelinea') }}
        </h3>
        <dl class="as-datos mb-0">
          <div class="as-dato">
            <dt class="as-etiqueta">
              {{ t('cartera.comun.emitida') }}
            </dt>
            <dd class="as-valor as-num mb-0">
              {{ fechaHoraCorta(n.emitida) }}
            </dd>
          </div>
          <div class="as-dato">
            <dt class="as-etiqueta">
              {{ t('cartera.comun.notificador') }}
            </dt>
            <dd class="as-valor mb-0">
              {{ n.notificador ?? '—' }}
            </dd>
          </div>
          <div class="as-dato">
            <dt class="as-etiqueta">
              {{ t('cartera.ficha.folio') }}
            </dt>
            <dd class="as-valor as-num mb-0">
              {{ n.folio ?? '—' }}
            </dd>
          </div>
          <div class="as-dato">
            <dt class="as-etiqueta">
              {{ t('cartera.ficha.secuencia') }}
            </dt>
            <dd class="as-valor as-num mb-0">
              {{ n.secuencia ?? '—' }}
            </dd>
          </div>
          <div class="as-dato">
            <dt class="as-etiqueta">
              {{ t('cartera.ficha.entregada') }}
            </dt>
            <dd class="as-valor as-num mb-0">
              {{ fechaHoraCorta(n.entregada) }}
            </dd>
          </div>
          <div class="as-dato">
            <dt class="as-etiqueta">
              {{ t('cartera.ficha.cerrada') }}
            </dt>
            <dd class="as-valor as-num mb-0">
              {{ fechaHoraCorta(n.cerrada) }}
            </dd>
          </div>
        </dl>
        <div
          v-if="n.observacion"
          class="mt-3"
        >
          <div class="as-etiqueta">
            {{ t('cartera.ficha.observacion') }}
          </div>
          <div class="as-valor">
            {{ n.observacion }}
          </div>
        </div>
      </section>

      <EvidenciaNotificacion :aviso="n.id" />

      <section>
        <h3 class="as-seccion">
          {{ t('cartera.ficha.historial') }}
        </h3>
        <VTimeline
          density="compact"
          side="end"
          truncate-line="both"
        >
          <VTimelineItem
            v-for="(e, i) in n.historial"
            :key="i"
            size="x-small"
            dot-color="primary"
          >
            <div class="as-valor">
              {{ textoEvento(e) }}
            </div>
            <div class="as-secundario as-num">
              {{ fechaHoraCorta(e.fecha) }} · {{ t('cartera.ficha.por', { usuario: e.usuario ?? t('cartera.ficha.sistema') }) }}
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

    <template
      v-if="f.capturable.value"
      #pie
    >
      <div class="d-flex flex-wrap gap-2 justify-end w-100">
        <VBtn
          variant="text"
          color="error"
          @click="cancelando = true"
        >
          {{ t('cartera.captura.cancelar') }}
        </VBtn>
        <VBtn
          color="primary"
          prepend-icon="tabler-clipboard-check"
          @click="capturando = true"
        >
          {{ t('cartera.captura.titulo') }}
        </VBtn>
      </div>
    </template>
  </AsPanelLateral>

  <DialogoResultado
    v-model:abierto="capturando"
    :titulo="t('cartera.captura.titulo')"
    :resultados="resultados"
    :cargando="f.accionando.value === 'resultado'"
    :minimo="emitidaDia"
    @confirmar="guardarResultado"
  />

  <AsDialogo
    v-model:abierto="cancelando"
    :titulo="t('cartera.captura.cancelarTitulo', { ref: n?.ref ?? '' })"
    tamano="sm"
    variante="confirmar"
    color-confirmar="error"
    :cargando="f.accionando.value === 'cancelar'"
    :texto-confirmar="t('cartera.captura.confirmarCancelar')"
    :texto-cancelar="t('cartera.captura.volver')"
    :desactivar-confirmar="!motivo.trim()"
    @confirmar="confirmarCancelacion"
  >
    <VTextarea
      v-model="motivo"
      :label="t('cartera.captura.motivo')"
      :hint="t('cartera.captura.motivoAyuda')"
      persistent-hint
      rows="2"
      auto-grow
      maxlength="1000"
    />
  </AsDialogo>
</template>

<style scoped>
/* Dos cifras: con tres, un adeudo de seis dígitos o la fecha completa no cabían en el panel (XEL1-678) */
.ficha__cifras {
  display: grid;
  gap: var(--as-sp-3);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
</style>
