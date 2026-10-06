<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizarError } from '../../services/errores'
import { useExportacionesStore } from '../../stores/exportacionesStore'
import type { Ejecucion } from '../../types/exportacion'
import { tamanoLegible } from '../../utils/exportaciones'
import { tiempoRelativo } from '../../utils/formato'

const { t } = useI18n()
const store = useExportacionesStore()
const abierto = ref(false)
const mensaje = ref<string | null>(null)

const pendientes = computed(() => store.activas.length)

const COLORES: Record<string, string> = { done: 'success', failed: 'error', expired: 'secondary', canceled: 'secondary', queued: 'info', running: 'primary' }

async function descargar(ejecucion: Ejecucion) {
  try {
    await store.descargar(ejecucion)
  }
  catch (e) {
    mensaje.value = t(`reportes.errores.${normalizarError(e).codigo}`)
  }
}

async function cancelar(ejecucion: Ejecucion) {
  try {
    await store.cancelar(ejecucion.id)
  }
  catch (e) {
    mensaje.value = t(`reportes.errores.${normalizarError(e).codigo}`)
  }
}

async function reintentar(ejecucion: Ejecucion) {
  try {
    await store.reintentar(ejecucion.id)
  }
  catch (e) {
    mensaje.value = t(`reportes.errores.${normalizarError(e).codigo}`)
  }
}
</script>

<template>
  <div
    v-if="store.visibles.length"
    class="tareas-exportacion"
  >
    <VMenu
      v-model="abierto"
      :close-on-content-click="false"
      location="top end"
    >
      <template #activator="{ props: activador }">
        <VBtn
          v-bind="activador"
          color="primary"
          icon
          size="large"
          elevation="6"
          :aria-label="t('reportes.cola.titulo')"
        >
          <VBadge
            :content="pendientes || store.listas.length"
            :color="pendientes ? 'warning' : 'success'"
            :model-value="pendientes > 0 || store.listas.length > 0"
          >
            <VIcon :icon="pendientes ? 'tabler-loader-2' : 'tabler-download'" />
          </VBadge>
        </VBtn>
      </template>

      <VCard
        width="380"
        max-height="480"
        class="d-flex flex-column"
      >
        <VCardItem>
          <VCardTitle>{{ t('reportes.cola.titulo') }}</VCardTitle>
          <template #append>
            <VBtn
              variant="text"
              size="small"
              :to="{ name: 'reportesExportaciones' }"
              @click="abierto = false"
            >
              {{ t('reportes.cola.verTodas') }}
            </VBtn>
          </template>
        </VCardItem>
        <VDivider />
        <VList
          density="compact"
          class="overflow-y-auto"
        >
          <VListItem
            v-for="tarea in store.visibles"
            :key="tarea.id"
          >
            <VListItemTitle class="d-flex align-center gap-2">
              <span class="text-truncate">{{ tarea.titulo ?? tarea.object_key }}</span>
              <VChip
                size="x-small"
                label
                :color="COLORES[tarea.estado]"
              >
                {{ t(`reportes.cola.estados.${tarea.estado}`) }}
              </VChip>
            </VListItemTitle>
            <VListItemSubtitle class="d-flex align-center gap-2">
              <span class="text-uppercase">{{ tarea.formato }}</span>
              <span>·</span>
              <span>{{ tiempoRelativo(tarea.created_at) }}</span>
              <span v-if="tarea.tamano">· {{ tamanoLegible(tarea.tamano) }}</span>
            </VListItemSubtitle>
            <VProgressLinear
              v-if="tarea.estado === 'queued' || tarea.estado === 'running'"
              :model-value="tarea.progreso ?? 0"
              :indeterminate="tarea.estado === 'queued'"
              color="primary"
              height="4"
              class="mt-1"
            />
            <div
              v-if="tarea.estado === 'failed' && tarea.mensaje"
              class="text-caption text-error mt-1"
            >
              {{ tarea.mensaje }}
            </div>
            <template #append>
              <VBtn
                v-if="tarea.estado === 'done'"
                icon="tabler-download"
                variant="text"
                size="small"
                :aria-label="t('reportes.cola.descargar')"
                @click="descargar(tarea)"
              />
              <VBtn
                v-else-if="tarea.estado === 'queued' || tarea.estado === 'running'"
                icon="tabler-x"
                variant="text"
                size="small"
                :aria-label="t('reportes.cola.cancelar')"
                @click="cancelar(tarea)"
              />
              <VBtn
                v-else
                icon="tabler-refresh"
                variant="text"
                size="small"
                :aria-label="t('reportes.cola.reintentar')"
                @click="reintentar(tarea)"
              />
            </template>
          </VListItem>
        </VList>
        <VDivider />
        <VCardActions>
          <VBtn
            variant="text"
            size="small"
            @click="store.ocultarTerminadas()"
          >
            {{ t('reportes.cola.limpiar') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VMenu>

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

<style scoped>
.tareas-exportacion {
  position: fixed;
  z-index: 1005;
  inset-block-end: 24px;
  inset-inline-end: 24px;
}
</style>
