<script setup lang="ts">
import { useAbility } from '@casl/vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useListaContrato } from '../composables/useListaContrato'
import { useContractStore } from '../stores/contractStore'
import type { RebillingItem, TableItem } from '../types/RebillingItem'
import ContractImagesDialog from './dialog/ContractImagesDialog.vue'
import RebillingDetailDialog from './dialog/RebillingDetailDialog.vue'
import type { ColumnaTabla } from '@/components/as/tipos'
import { entero } from '@/utils/formato'

/* Lecturas del contrato por periodo, con el acceso a la refacturación y a las fotos de evidencia (según permisos). */
const props = defineProps<{ activa: boolean }>()

const { t } = useI18n()
const ability = useAbility()
const store = useContractStore()
const lista = useListaContrato<TableItem>((id, p) => store.getReadingsByContract(id, p), () => props.activa)

const refacturacionAbierta = ref(false)
const refacturacion = ref<RebillingItem[]>([])
const evidenciaAbierta = ref(false)
const lecturaElegida = ref<TableItem | null>(null)

const puedeVerEvidencia = computed(() => ability.can('read', 'Evidence'))
const puedeVerRefacturacion = computed(() => ability.can('read', 'Rebilling'))

const columnas = computed<ColumnaTabla[]>(() => [
  { clave: 'Periodo', titulo: t('support.lecturas.periodo'), formato: 'texto', ancho: 160 },
  { clave: 'Fecha', titulo: t('support.lecturas.fecha'), formato: 'fechaHora', ancho: 150 },
  { clave: 'Lecturista', titulo: t('support.lecturas.lecturista'), formato: 'texto', truncar: true },
  { clave: 'Anterior', titulo: t('support.lecturas.anterior'), formato: 'entero', ancho: 110 },
  { clave: 'Actual', titulo: t('support.lecturas.actual'), formato: 'entero', ancho: 110 },
  { clave: 'Real_Consumo', titulo: t('support.lecturas.consumoReal'), formato: 'entero', ancho: 130, descripcion: 'm³' },
  { clave: 'Consumo', titulo: t('support.lecturas.consumo'), formato: 'personalizado', alineacion: 'end', ancho: 130, descripcion: 'm³' },
  { clave: 'Anomalia', titulo: t('support.lecturas.anomalia'), formato: 'texto', truncar: true },
  ...(puedeVerEvidencia.value ? [{ clave: 'view_evidence', titulo: t('support.lecturas.evidencia'), formato: 'personalizado' as const, alineacion: 'center' as const, ancho: 100 }] : []),
].map(c => ({ ...c, ordenable: false })))

function verRefacturacion(fila: TableItem) {
  if (fila.rebilling?.length) {
    refacturacion.value = fila.rebilling
    refacturacionAbierta.value = true
  }
}

function verEvidencia(fila: TableItem) {
  lecturaElegida.value = fila
  evidenciaAbierta.value = true
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
    vacio-icono="tabler-gauge-off"
    @update:pagina="lista.cambiarPagina"
    @reintentar="lista.cargar"
  >
    <template #celda-Consumo="{ fila }">
      <span class="d-inline-flex align-center justify-end gap-1">
        <span class="as-num">{{ entero(fila.Consumo) }}</span>
        <VBtn
          v-if="puedeVerRefacturacion && fila.rebilling && fila.rebilling.length"
          icon="tabler-history"
          size="x-small"
          variant="tonal"
          color="warning"
          :title="t('support.lecturas.refacturada')"
          :aria-label="t('support.lecturas.verRefacturacion')"
          @click="verRefacturacion(fila as TableItem)"
        />
      </span>
    </template>
    <template #celda-view_evidence="{ fila }">
      <VBtn
        icon="tabler-photo"
        size="small"
        variant="text"
        color="primary"
        :title="t('support.lecturas.verEvidencia')"
        :aria-label="t('support.lecturas.verEvidencia')"
        @click="verEvidencia(fila as TableItem)"
      />
    </template>
  </AsTablaDatos>

  <RebillingDetailDialog
    v-model:abierto="refacturacionAbierta"
    :datos="refacturacion"
  />
  <ContractImagesDialog
    v-if="lecturaElegida && store.item"
    v-model:abierto="evidenciaAbierta"
    :contrato="String(store.item.account)"
    :periodo="String(lecturaElegida.PeriodCode ?? '')"
  />
</template>
