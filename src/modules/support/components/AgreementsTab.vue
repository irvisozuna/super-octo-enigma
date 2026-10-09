<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useListaContrato } from '../composables/useListaContrato'
import { useContractStore } from '../stores/contractStore'
import AgreementDetails from './AgreementDetails.vue'
import type { PagoConvenio } from './AgreementDetails.vue'
import type { ColumnaTabla } from '@/components/as/tipos'

/* Convenios de pago del contrato y el detalle de sus parcialidades. */
const props = defineProps<{ activa: boolean }>()

const { t } = useI18n()
const store = useContractStore()
const lista = useListaContrato((id, p) => store.getAgreementsByContract(id, p), () => props.activa)

const detalleAbierto = ref(false)
const pagos = ref<PagoConvenio[]>([])
const convenio = ref<Record<string, any> | null>(null)

const columnas = computed<ColumnaTabla[]>(() => [
  { clave: 'ref', titulo: t('support.convenios.folio'), formato: 'texto', ancho: 120 },
  { clave: 'payment_amount', titulo: t('support.convenios.monto'), formato: 'moneda', ancho: 130 },
  { clave: 'agreed_balance', titulo: t('support.convenios.anticipo'), formato: 'moneda', ancho: 130 },
  { clave: 'user', titulo: t('support.convenios.usuario'), formato: 'texto', truncar: true, ancho: 170 },
  { clave: 'date_creation', titulo: t('support.convenios.fecha'), formato: 'fecha', ancho: 130 },
  { clave: 'advance_amount', titulo: t('support.convenios.montoAnticipo'), formato: 'moneda', ancho: 140 },
  { clave: 'number_payments', titulo: t('support.convenios.numeroPagos'), formato: 'entero', ancho: 110 },
  { clave: 'pay_frecuency', titulo: t('support.convenios.frecuencia'), formato: 'texto', ancho: 130 },
  { clave: 'previous_balance', titulo: t('support.convenios.saldoAnterior'), formato: 'moneda', ancho: 140 },
  { clave: 'type', titulo: t('support.convenios.tipoAnticipo'), formato: 'texto', ancho: 140 },
  { clave: 'details', titulo: t('support.convenios.detalle'), formato: 'personalizado', alineacion: 'center', ancho: 100 },
].map(c => ({ ...c, ordenable: false })))

function verDetalle(fila: Record<string, any>) {
  convenio.value = fila
  pagos.value = fila.details
  detalleAbierto.value = true
}
</script>

<template>
  <AsTablaDatos
    sin-tarjeta
    :columnas="columnas"
    :filas="lista.filas.value"
    clave-fila="_k"
    densidad="estandar"
    :cargando="lista.cargando.value"
    :error="lista.error.value"
    :paginacion="lista.paginacion.value"
    :vacio-titulo="t('support.lista.sinFilas')"
    vacio-detalle=""
    vacio-icono="tabler-file-off"
    @update:pagina="lista.cambiarPagina"
    @reintentar="lista.cargar"
  >
    <template #celda-details="{ fila }">
      <VBtn
        v-if="fila.details && fila.details.length"
        icon="tabler-list-details"
        size="small"
        variant="text"
        :title="t('support.lista.verDetalle')"
        :aria-label="t('support.lista.verDetalle')"
        @click="verDetalle(fila)"
      />
      <span
        v-else-if="fila.details"
        class="as-secundario"
      >{{ t('support.convenios.importado') }}</span>
    </template>
  </AsTablaDatos>

  <AgreementDetails
    v-model:abierto="detalleAbierto"
    :pagos="pagos"
    :convenio="convenio"
  />
</template>
