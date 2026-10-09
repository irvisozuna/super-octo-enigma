<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ColumnaTabla } from '@/components/as/tipos'
import { colorPagoConvenio } from '@/utils/estados'
import { aFecha, entero, fecha, hoyLocal, moneda, texto } from '@/utils/formato'

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

  /** Datos del convenio (folio, importes, fechas); con ellos el diálogo muestra el resumen arriba. */
  convenio?: Record<string, any> | null

  /** Muestra el enlace a la pestaña de convenios (cuando se abre desde la cabecera). */
  enlaceLista?: boolean
}>()

const emit = defineEmits<{
  'update:abierto': [valor: boolean]
  'verTodos': []
}>()

const { t } = useI18n()

/** Vencido: no está pagado (status 4) y su fecha límite ya pasó (comparación por día en hora local). */
function vencido(p: PagoConvenio): boolean {
  const limite = aFecha(p.due_date)

  return p.status !== 4 && !!limite && limite.toISOString().slice(0, 10) < hoyLocal()
}

const datosConvenio = computed(() => {
  const c = props.convenio
  if (!c)
    return []

  return [
    { etiqueta: t('support.convenios.tipo'), valor: texto(c.type) },
    { etiqueta: t('support.convenios.saldoAnterior'), valor: moneda(c.previous_balance), num: true },
    { etiqueta: t('support.convenios.montoAnticipo'), valor: moneda(c.advance_amount), num: true },
    { etiqueta: t('support.convenios.saldoConvenido'), valor: moneda(c.agreed_balance), num: true },
    { etiqueta: t('support.convenios.numeroPagos'), valor: `${entero(c.number_payments)} · ${texto(c.pay_frecuency)}`, num: true },
    { etiqueta: t('support.convenios.montoPago'), valor: moneda(c.payment_amount), num: true },
    { etiqueta: t('support.convenios.inicio'), valor: fecha(c.payment_start_date), num: true },
    { etiqueta: t('support.convenios.liquidacion'), valor: fecha(c.settlement_date), num: true },
  ]
})

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
    :subtitulo="convenio?.ref ?? undefined"
    tamano="xl"
    variante="informativo"
    @update:abierto="(v: boolean) => emit('update:abierto', v)"
  >
    <dl
      v-if="datosConvenio.length"
      class="as-datos mb-4"
    >
      <div
        v-for="d in datosConvenio"
        :key="d.etiqueta"
        class="as-dato"
      >
        <dt class="as-etiqueta">
          {{ d.etiqueta }}
        </dt>
        <dd
          class="as-valor mb-0"
          :class="{ 'as-num': d.num }"
        >
          {{ d.valor }}
        </dd>
      </div>
    </dl>

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

    <template
      v-if="enlaceLista"
      #acciones-inicio
    >
      <AsBtnTerciario
        prepend-icon="tabler-file-like"
        @click="emit('verTodos')"
      >
        {{ t('support.convenios.verTodos') }}
      </AsBtnTerciario>
    </template>
  </AsDialogo>
</template>
