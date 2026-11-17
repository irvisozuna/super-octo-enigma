<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { descargarDocumentoNotificacion, obtenerNotificacionesContrato } from '../services/carteraApi'
import type { EstadoNotificacion, NotificacionContrato, RespuestaNotificacionesContrato } from '../types/cartera'
import { COLOR_NOTIFICACION, descargarArchivo } from '../utils/cartera'
import type { ColumnaTabla } from '@/components/as/tipos'
import { useContractStore } from '@/modules/support/stores/contractStore'
import { normalizarError } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'
import { fecha, fechaCorta, moneda } from '@/utils/formato'

/*
 * Pestaña «Cobranza» de la ficha del contrato en Soporte (XEL1-658): las notificaciones de la cuenta, su resultado, lo
 * recuperado y el PDF, para atender al usuario que llega con su notificación. Carga al abrirse la pestaña.
 */
const props = defineProps<{ activa: boolean }>()

const { t } = useI18n()
const store = useContractStore()
const datos = ref<RespuestaNotificacionesContrato | null>(null)
const cargando = ref(false)
const error = ref<ErrorReporte | null>(null)
const descargando = ref<string | null>(null)
let cargadoPara: string | null = null

const contrato = computed(() => store.item?.id_account ? String(store.item.id_account) : null)

const columnas: ColumnaTabla<NotificacionContrato>[] = [
  { clave: 'ref', titulo: t('cartera.comun.referencia'), formato: 'personalizado', ancho: 150, ordenable: false },
  { clave: 'notificador', titulo: t('cartera.comun.notificador'), formato: 'texto', truncar: true, anchoMin: 180, ordenable: false },
  { clave: 'adeudo', titulo: t('cartera.comun.adeudo'), formato: 'moneda', ancho: 120, ordenable: false },
  { clave: 'estado', titulo: t('cartera.comun.estado'), formato: 'personalizado', ancho: 220, ordenable: false },
  { clave: 'vence', titulo: t('cartera.comun.vence'), formato: 'fecha', ancho: 110, ordenable: false },
  { clave: 'recuperado', titulo: t('cartera.contrato.recuperado'), formato: 'moneda', ancho: 120, ordenable: false },
  { clave: 'acciones', titulo: '', formato: 'personalizado', ancho: 190, ordenable: false, alineacion: 'end' },
]

async function cargar() {
  if (!contrato.value)
    return
  cargando.value = true
  try {
    datos.value = await obtenerNotificacionesContrato(contrato.value)
    cargadoPara = contrato.value
    error.value = null
  }
  catch (e) {
    error.value = normalizarError(e)
  }
  finally {
    cargando.value = false
  }
}

async function verPdf(f: NotificacionContrato) {
  descargando.value = f.id
  try {
    descargarArchivo(await descargarDocumentoNotificacion(f.id), `${f.ref}.pdf`)
  }
  catch (e) {
    error.value = normalizarError(e)
  }
  finally {
    descargando.value = null
  }
}

watch(() => [props.activa, contrato.value] as const, ([activa, id]) => {
  if (activa && id && id !== cargadoPara)
    cargar()
}, { immediate: true })
</script>

<template>
  <div>
    <VAlert
      v-if="datos?.vigente"
      type="warning"
      variant="tonal"
      density="compact"
      class="ma-4 mb-0"
    >
      {{ t('cartera.contrato.vigente') }}
    </VAlert>
    <AsTablaDatos
      sin-tarjeta
      :columnas="columnas"
      :filas="datos?.notificaciones ?? []"
      clave-fila="id"
      :cargando="cargando"
      :error="error"
      :por-pagina="25"
      :vacio-titulo="t('cartera.contrato.sinFilas')"
      vacio-detalle=""
      vacio-icono="tabler-file-invoice"
      @reintentar="cargar"
    >
      <template #celda-ref="{ fila }">
        <span class="as-num">{{ fila.ref }}</span>
        <div class="as-secundario as-num">
          {{ fechaCorta(fila.emitida) }}
        </div>
      </template>
      <template #celda-estado="{ fila }">
        <VChip
          size="small"
          label
          variant="tonal"
          :color="COLOR_NOTIFICACION[(fila.estado_codigo ?? 'sin_estado') as EstadoNotificacion]"
        >
          {{ fila.estado ?? '—' }}
        </VChip>
        <div
          v-if="fila.entregada"
          class="as-secundario mt-1"
        >
          {{ t('cartera.contrato.entregada', { fecha: fecha(fila.entregada) }) }}
        </div>
        <div
          v-if="fila.observacion"
          class="as-secundario text-truncate"
          :title="fila.observacion"
        >
          {{ fila.observacion }}
        </div>
      </template>
      <template #celda-recuperado="{ fila }">
        <span class="as-num">{{ fila.recuperado === null ? '—' : moneda(fila.recuperado) }}</span>
      </template>
      <template #celda-acciones="{ fila }">
        <VBtn
          size="small"
          variant="text"
          prepend-icon="tabler-file-type-pdf"
          :loading="descargando === fila.id"
          @click="verPdf(fila)"
        >
          {{ t('cartera.contrato.verPdf') }}
        </VBtn>
      </template>
    </AsTablaDatos>
  </div>
</template>
