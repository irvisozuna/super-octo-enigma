<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useListaContrato } from '../composables/useListaContrato'
import { useContractStore } from '../stores/contractStore'
import type { ColumnaTabla } from '@/components/as/tipos'
import { aFecha, fecha } from '@/utils/formato'

/* Historial de facturación del contrato: recibos por periodo con consumo, vencimiento (10 días) y monto. */
const props = defineProps<{ activa: boolean }>()

const { t } = useI18n()
const store = useContractStore()
const lista = useListaContrato((id, p) => store.getBillingsByContract(id, p), () => props.activa)

const columnas = computed<ColumnaTabla[]>(() => [
  { clave: 'REF', titulo: t('support.facturacion.referencia'), formato: 'texto', ancho: 140 },
  { clave: 'PERIODO', titulo: t('support.facturacion.periodo'), formato: 'texto', ancho: 160 },
  { clave: 'FECHA_FACTURACION', titulo: t('support.facturacion.fecha'), formato: 'fecha', ancho: 160 },
  { clave: 'CONSUMO', titulo: t('support.facturacion.consumo'), formato: 'entero', ancho: 120, descripcion: 'm³' },
  { clave: 'VENCIMIENTO', titulo: t('support.facturacion.vencimiento'), formato: 'personalizado', alineacion: 'end', ancho: 140 },
  { clave: 'MONTO', titulo: t('support.facturacion.monto'), formato: 'moneda', ancho: 150 },
].map(c => ({ ...c, ordenable: false })))

/** El vencimiento no viene de la API: son 10 días después de la fecha de facturación. */
function vencimiento(fila: Record<string, unknown>): string {
  const d = aFecha(fila.FECHA_FACTURACION)
  if (!d)
    return '—'
  d.setDate(d.getDate() + 10)

  return fecha(d)
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
    vacio-icono="tabler-receipt-off"
    @update:pagina="lista.cambiarPagina"
    @reintentar="lista.cargar"
  >
    <template #celda-VENCIMIENTO="{ fila }">
      <span class="as-num">{{ vencimiento(fila) }}</span>
    </template>
  </AsTablaDatos>
</template>
