<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ColumnaTabla } from '@/components/as/tipos'
import { colorPagoConvenio } from '@/utils/estados'
import { aFecha, fecha, hoyLocal } from '@/utils/formato'

/* Parcialidades de un convenio: resumen (pagadas, vencidas, pendientes) y la tabla de pagos. */
export interface PagoConvenio {
  rowid: number
  fk_agreements: number
  numpay: number
  fk_invoice: number | null
  payment_amount: number
  paid: number
  remaining_balance: number
  issue_date: string
  due_date: string
  payment_date: string | null
  tms: string
  created_at: string
  status: number
}

const props = defineProps<{
  abierto: boolean
  pagos: PagoConvenio[]
}>()

const emit = defineEmits<{
  'update:abierto': [valor: boolean]
}>()

const { t } = useI18n()

/** Vencido: no está pagado (status 4) y su fecha límite ya pasó (comparación por día en hora local). */
function vencido(p: PagoConvenio): boolean {
  const limite = aFecha(p.due_date)

  return p.status !== 4 && !!limite && limite.toISOString().slice(0, 10) < hoyLocal()
}

const resumen = computed(() => ({
  total: props.pagos.length,
  pagados: props.pagos.filter(p => p.status === 4).length,
  vencidos: props.pagos.filter(vencido).length,
  pendientes: props.pagos.filter(p => p.status !== 4 && !vencido(p)).length,
}))

const estadoTexto = (p: PagoConvenio) => (p.status === 4 ? t('support.convenios.estadoPagado') : vencido(p) ? t('support.convenios.estadoVencido') : t('support.convenios.estadoPendiente'))

const columnas = computed<ColumnaTabla<PagoConvenio>[]>(() => [
  { clave: 'numpay', titulo: t('support.convenios.numeroPago'), formato: 'entero', ancho: 80 },
  { clave: 'payment_amount', titulo: t('support.convenios.montoPago'), formato: 'moneda', ancho: 130 },
  { clave: 'paid', titulo: t('support.convenios.pagado'), formato: 'moneda', ancho: 130 },
  { clave: 'remaining_balance', titulo: t('support.convenios.saldoPendiente'), formato: 'moneda', ancho: 140 },
  { clave: 'issue_date', titulo: t('support.convenios.emision'), formato: 'fecha', ancho: 120 },
  { clave: 'due_date', titulo: t('support.convenios.vencimiento'), formato: 'personalizado', alineacion: 'end', ancho: 130 },
  { clave: 'payment_date', titulo: t('support.convenios.fechaPago'), formato: 'fecha', ancho: 120 },
  { clave: 'status', titulo: t('support.convenios.estado'), formato: 'estado', ancho: 120, colorEstado: (_v, p) => colorPagoConvenio(p.status, vencido(p)), textoEstado: (_v, p) => estadoTexto(p) },
].map(c => ({ ...c, ordenable: false })))
</script>

<template>
  <AsDialogo
    :abierto="abierto"
    :titulo="t('support.convenios.detalleTitulo')"
    tamano="xl"
    variante="informativo"
    @update:abierto="(v: boolean) => emit('update:abierto', v)"
  >
    <VRow
      dense
      class="mb-4"
    >
      <VCol
        cols="6"
        sm="3"
      >
        <AsIndicador
          :etiqueta="t('support.convenios.pagos')"
          :valor="resumen.total"
          formato="entero"
          icono="tabler-list-numbers"
        />
      </VCol>
      <VCol
        cols="6"
        sm="3"
      >
        <AsIndicador
          :etiqueta="t('support.convenios.pagados')"
          :valor="resumen.pagados"
          formato="entero"
          color="success"
          icono="tabler-check"
        />
      </VCol>
      <VCol
        cols="6"
        sm="3"
      >
        <AsIndicador
          :etiqueta="t('support.convenios.vencidos')"
          :valor="resumen.vencidos"
          formato="entero"
          color="error"
          icono="tabler-alert-circle"
          :estado="resumen.vencidos ? 'alerta' : 'normal'"
        />
      </VCol>
      <VCol
        cols="6"
        sm="3"
      >
        <AsIndicador
          :etiqueta="t('support.convenios.pendientes')"
          :valor="resumen.pendientes"
          formato="entero"
          color="warning"
          icono="tabler-clock"
        />
      </VCol>
    </VRow>

    <AsTablaDatos
      sin-tarjeta
      ocultar-pie
      densidad="media"
      :columnas="columnas"
      :filas="pagos"
      clave-fila="rowid"
      :por-pagina="-1"
    >
      <template #celda-due_date="{ fila }">
        <span
          class="as-num"
          :class="{ 'text-error font-weight-medium': vencido(fila as PagoConvenio) }"
        >{{ fecha(fila.due_date) }}</span>
      </template>
    </AsTablaDatos>
  </AsDialogo>
</template>
