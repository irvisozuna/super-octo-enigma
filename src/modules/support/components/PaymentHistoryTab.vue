<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useListaContrato } from '../composables/useListaContrato'
import { useContractStore } from '../stores/contractStore'
import type { ColumnaTabla } from '@/components/as/tipos'
import { moneda } from '@/utils/formato'

/* Historial de pagos del contrato: importes por concepto y detalle de cada pago agrupado por factura. */
interface ConceptoPago {
  ref: string
  label: string
  total_ttc: number
}

interface FacturaPago {
  ref: string
  items: (ConceptoPago & { _k: number })[]
  total: number
}

const props = defineProps<{ activa: boolean }>()

const { t } = useI18n()
const store = useContractStore()
const lista = useListaContrato((id, p) => store.getPaymentsByContract(id, p), () => props.activa)

const detalleAbierto = ref(false)
const facturas = ref<FacturaPago[]>([])

const columnas = computed<ColumnaTabla[]>(() => [
  { clave: 'paymentId', titulo: t('support.pagos.id'), formato: 'texto', ancho: 110 },
  { clave: 'billingPeriod', titulo: t('support.pagos.periodo'), formato: 'texto', ancho: 150 },
  { clave: 'DATE', titulo: t('support.pagos.fecha'), formato: 'fechaHora', ancho: 150 },
  { clave: 'consumo', titulo: t('support.pagos.consumo'), formato: 'moneda', ancho: 120 },
  { clave: 'drenaje', titulo: t('support.pagos.drenaje'), formato: 'moneda', ancho: 110 },
  { clave: 'saneamiento', titulo: t('support.pagos.saneamiento'), formato: 'moneda', ancho: 120 },
  { clave: 'recargos', titulo: t('support.pagos.recargos'), formato: 'moneda', ancho: 110 },
  { clave: 'bomberos', titulo: t('support.pagos.bomberos'), formato: 'moneda', ancho: 110 },
  { clave: 'otros', titulo: t('support.pagos.otros'), formato: 'moneda', ancho: 100 },
  { clave: 'total_concept', titulo: t('support.pagos.totalConceptos'), formato: 'moneda', ancho: 130 },
  { clave: 'totalPaid', titulo: t('support.pagos.totalPagado'), formato: 'moneda', ancho: 130 },
  { clave: 'payment_method', titulo: t('support.pagos.metodo'), formato: 'texto', ancho: 140, truncar: true },
  { clave: 'details', titulo: t('support.pagos.detalle'), formato: 'personalizado', alineacion: 'center', ancho: 90 },
].map(c => ({ ...c, ordenable: false })))

const columnasDetalle = computed<ColumnaTabla[]>(() => [
  { clave: 'label', titulo: t('support.pagos.concepto'), formato: 'texto', ordenable: false },
  { clave: 'total_ttc', titulo: t('support.pagos.importe'), formato: 'moneda', ordenable: false, ancho: 160 },
])

/** Agrupa los conceptos del pago por referencia de factura, con el total de cada una. */
function verDetalle(detalles: ConceptoPago[]) {
  const grupos = new Map<string, FacturaPago>()

  detalles.forEach((d, i) => {
    const g = grupos.get(d.ref) ?? { ref: d.ref, items: [], total: 0 }

    g.items.push({ ...d, _k: i })
    g.total += Number(d.total_ttc) || 0
    grupos.set(d.ref, g)
  })
  facturas.value = [...grupos.values()]
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
    vacio-icono="tabler-cash-off"
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
        @click="verDetalle(fila.details)"
      />
    </template>
  </AsTablaDatos>

  <AsDialogo
    :abierto="detalleAbierto"
    :titulo="t('support.pagos.detalleTitulo')"
    tamano="md"
    variante="informativo"
    @update:abierto="(v: boolean) => { detalleAbierto = v }"
  >
    <section
      v-for="f in facturas"
      :key="f.ref"
      class="mb-4"
    >
      <h3 class="as-seccion">
        <span>{{ f.ref }}</span>
        <span class="as-num">{{ moneda(f.total) }}</span>
      </h3>
      <AsTablaDatos
        sin-tarjeta
        ocultar-pie
        densidad="densa"
        :columnas="columnasDetalle"
        :filas="f.items"
        clave-fila="_k"
        :por-pagina="-1"
      />
    </section>
  </AsDialogo>
</template>
