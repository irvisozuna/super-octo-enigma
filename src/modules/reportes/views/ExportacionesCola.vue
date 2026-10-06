<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import EstadoError from '../components/comunes/EstadoError.vue'
import EstadoVacio from '../components/comunes/EstadoVacio.vue'
import { normalizarError } from '../services/errores'
import { useExportacionesStore } from '../stores/exportacionesStore'
import type { Ejecucion } from '../types/exportacion'
import { tamanoLegible } from '../utils/exportaciones'
import { formatearEntero, formatearFechaHora, tiempoRelativo } from '../utils/formato'

const { t } = useI18n()
const store = useExportacionesStore()
const mensaje = ref<string | null>(null)

const COLORES: Record<string, string> = { done: 'success', failed: 'error', expired: 'secondary', canceled: 'secondary', queued: 'info', running: 'primary' }

const headers = [
  { title: t('reportes.cola.columnas.reporte'), key: 'titulo' },
  { title: t('reportes.cola.columnas.formato'), key: 'formato' },
  { title: t('reportes.cola.columnas.estado'), key: 'estado' },
  { title: t('reportes.cola.columnas.filas'), key: 'filas', align: 'end' as const },
  { title: t('reportes.cola.columnas.creada'), key: 'created_at' },
  { title: t('reportes.cola.columnas.vence'), key: 'expires_at' },
  { title: '', key: 'acciones', sortable: false, align: 'end' as const },
]

async function intentar(accion: () => Promise<unknown>) {
  try {
    await accion()
  }
  catch (e) {
    mensaje.value = t(`reportes.errores.${normalizarError(e).codigo}`)
  }
}

function descargar(tarea: Ejecucion) {
  return intentar(() => store.descargar(tarea))
}

onMounted(() => {
  store.rehidratar()
})
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-6">
      <div>
        <h4 class="text-h4 mb-1">
          {{ t('reportes.cola.titulo') }}
        </h4>
        <p class="text-body-1 text-medium-emphasis mb-0">
          {{ t('reportes.cola.descripcion') }}
        </p>
      </div>
      <VBtn
        variant="tonal"
        prepend-icon="tabler-refresh"
        :loading="store.cargando"
        @click="store.rehidratar()"
      >
        {{ t('reportes.comunes.actualizar') }}
      </VBtn>
    </div>

    <EstadoError
      v-if="store.error"
      :error="store.error"
      class="mb-4"
      @reintentar="store.rehidratar()"
    />

    <VCard>
      <EstadoVacio
        v-if="!store.cargando && store.tareas.length === 0"
        icono="tabler-file-download"
        :titulo="t('reportes.cola.vacioTitulo')"
        :detalle="t('reportes.cola.vacioDetalle')"
      />
      <VDataTable
        v-else
        :headers="headers"
        :items="store.tareas"
        :loading="store.cargando"
        item-value="id"
        :items-per-page="25"
        :no-data-text="t('reportes.tabla.sinResultados')"
      >
        <template #item.titulo="{ item }">
          <div class="font-weight-medium">
            {{ item.titulo ?? item.object_key }}
          </div>
          <div
            v-if="item.mensaje && item.estado === 'failed'"
            class="text-caption text-error"
          >
            {{ item.mensaje }}
          </div>
        </template>
        <template #item.formato="{ item }">
          <span class="text-uppercase">{{ item.formato }}</span>
          <span
            v-if="item.tamano"
            class="text-medium-emphasis"
          > · {{ tamanoLegible(item.tamano) }}</span>
        </template>
        <template #item.estado="{ item }">
          <VChip
            size="small"
            label
            :color="COLORES[item.estado]"
          >
            {{ t(`reportes.cola.estados.${item.estado}`) }}
          </VChip>
          <VProgressLinear
            v-if="item.estado === 'running'"
            :model-value="item.progreso ?? 0"
            color="primary"
            height="4"
            class="mt-1"
          />
        </template>
        <template #item.filas="{ item }">
          {{ item.filas === null ? '' : formatearEntero(item.filas) }}
        </template>
        <template #item.created_at="{ item }">
          <span :title="formatearFechaHora(item.created_at)">{{ tiempoRelativo(item.created_at) }}</span>
        </template>
        <template #item.expires_at="{ item }">
          {{ item.estado === 'done' && item.expires_at ? formatearFechaHora(item.expires_at) : '' }}
        </template>
        <template #item.acciones="{ item }">
          <VBtn
            v-if="item.estado === 'done'"
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="tabler-download"
            @click="descargar(item)"
          >
            {{ t('reportes.cola.descargar') }}
          </VBtn>
          <VBtn
            v-else-if="item.estado === 'queued' || item.estado === 'running'"
            size="small"
            variant="text"
            prepend-icon="tabler-x"
            @click="intentar(() => store.cancelar(item.id))"
          >
            {{ t('reportes.cola.cancelar') }}
          </VBtn>
        </template>
      </VDataTable>
    </VCard>

    <VSnackbar
      :model-value="mensaje !== null"
      color="error"
      timeout="5000"
      @update:model-value="mensaje = null"
    >
      {{ mensaje }}
    </VSnackbar>
  </div>
</template>
