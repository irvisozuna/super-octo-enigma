<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useListaContrato } from '../composables/useListaContrato'
import { useContractStore } from '../stores/contractStore'
import type { ColumnaTabla } from '@/components/as/tipos'

/* Ajustes aplicados al contrato (cargos y abonos) con su motivo, importe y archivo de respaldo. */
const props = defineProps<{ activa: boolean }>()

const { t, te } = useI18n()
const store = useContractStore()
const lista = useListaContrato((id, p) => store.getAdjustmentsByContract(id, p), () => props.activa)

const tipo = (v: unknown) => (v && te(`${String(v)}_amount`) ? t(`${String(v)}_amount`) : String(v || '—'))

const columnas = computed<ColumnaTabla[]>(() => [
  { clave: 'label', titulo: t('support.ajustes.descripcion'), formato: 'personalizado', anchoMin: 220 },
  { clave: 'adjustment_type', titulo: t('support.ajustes.tipo'), formato: 'personalizado', ancho: 140 },
  { clave: 'adjustment_reason_desc', titulo: t('support.ajustes.motivo'), formato: 'texto', truncar: true },
  { clave: 'adjustment_amount', titulo: t('support.ajustes.monto'), formato: 'moneda', ancho: 140 },
  { clave: 'date_creation', titulo: t('support.ajustes.fecha'), formato: 'fechaHora', ancho: 150 },
  { clave: 'file', titulo: t('support.ajustes.archivo'), formato: 'personalizado', alineacion: 'center', ancho: 110 },
].map(c => ({ ...c, ordenable: false })))
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
    vacio-icono="tabler-adjustments-off"
    @update:pagina="lista.cambiarPagina"
    @reintentar="lista.cargar"
  >
    <template #celda-label="{ fila }">
      <span :class="{ 'as-secundario': !fila.label }">{{ fila.label || t('support.lista.sinDescripcion') }}</span>
    </template>
    <template #celda-adjustment_type="{ fila }">
      {{ tipo(fila.adjustment_type) }}
    </template>
    <template #celda-file="{ fila }">
      <VBtn
        v-if="fila.file"
        icon="tabler-download"
        size="small"
        variant="text"
        color="primary"
        :href="fila.file"
        target="_blank"
        rel="noopener noreferrer"
        :title="t('support.lista.descargar')"
        :aria-label="t('support.lista.descargar')"
      />
    </template>
  </AsTablaDatos>
</template>
