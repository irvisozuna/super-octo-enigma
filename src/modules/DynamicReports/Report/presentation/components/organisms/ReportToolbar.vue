<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ReportColumnSelectorMenu from '../molecules/ReportColumnSelectorMenu.vue'

const props = defineProps<{
  reportTitle: string
  reportDescription: string
  lastUpdated: Date
  loading: boolean
  isFullscreen: boolean
  viewMode: string
  density: string
  showFilterPanel: boolean
  availableExportFormats: any[]
  frozenColumns: string[]
  visibleColumns: string[]
  visibleColumnsFields: any[]
  quickSearchQuery: string
  search: {
    enabled: boolean
    query: string
  }
}>()

const emit = defineEmits<{
  (e: 'go-to-reports-list'): void
  (e: 'refresh'): void
  (e: 'export', format: string): void
  (e: 'share-report'): void
  (e: 'edit-report'): void
  (e: 'toggle-fullscreen'): void
  (e: 'update:viewMode', value: string): void
  (e: 'update:density', value: string): void
  (e: 'toggle-filter-panel'): void
  (e: 'update:quickSearchQuery', value: string): void
  (e: 'toggle-column-visibility', field: string): void
  (e: 'freeze-column', field: string): void
  (e: 'open-export-dialog'): void
}>()

const viewModeProxy = computed({
  get: () => props.viewMode,
  set: v => emit('update:viewMode', v),
})

const densityProxy = computed({
  get: () => props.density,
  set: v => emit('update:density', v),
})

const quickSearchProxy = computed({
  get: () => props.quickSearchQuery,
  set: v => emit('update:quickSearchQuery', v),
})

const quickSearchDraft = ref(props.quickSearchQuery)

watch(() => props.quickSearchQuery, val => {
  quickSearchDraft.value = val
})

// Limpiar el input y filtro cuando el buscador global se desactive
watch(
  () => props.search && props.search.enabled,
  enabled => {
    if (enabled === false) {
      quickSearchDraft.value = ''
      emit('update:quickSearchQuery', '')
    }
  },
  { immediate: false },
)

function applyQuickSearch() {
  emit('update:quickSearchQuery', quickSearchDraft.value)
}

function clearQuickSearch() {
  quickSearchDraft.value = ''
  emit('update:quickSearchQuery', '')
}

const searchFieldsPlaceholder = computed(() => {
  // Si hay campos visibles, úsalos para el placeholder
  if (Array.isArray(props.visibleColumnsFields) && props.visibleColumnsFields.length > 0) {
    const fields = props.visibleColumnsFields
      .map(f => f.label || f.alias || f.field)
      .filter(Boolean)

    if (fields.length > 0)
      return `Buscar en: ${fields.join(', ')}`
  }

  return 'Buscar en todos los campos...'
})
</script>

<template>
  <VCard class="mb-4">
    <VCardTitle class="d-flex align-center justify-space-between pa-4">
      <div class="d-flex align-center">
        <VBtn
          icon
          variant="text"
          @click="$emit('go-to-reports-list')"
        >
          <VIcon icon="tabler-arrow-left" />
          <VTooltip
            activator="parent"
            location="bottom"
          >
            Volver a reportes
          </VTooltip>
        </VBtn>
        <div class="ms-3">
          <h4 class="text-h5 font-weight-medium mb-1">
            {{ reportTitle }}
          </h4>
          <p
            v-if="reportDescription"
            class="text-body-2 text-medium-emphasis mb-0"
          >
            {{ reportDescription }}
          </p>
        </div>
      </div>
      <div class="d-flex align-center gap-2">
        <VChip
          size="small"
          variant="tonal"
        >
          <VIcon
            icon="tabler-clock"
            size="16"
            start
          />
          {{ lastUpdated.toLocaleTimeString('es-MX') }}
        </VChip>
        <VBtn
          icon
          variant="text"
          :loading="loading"
          @click="$emit('refresh')"
        >
          <VIcon icon="tabler-refresh" />
          <VTooltip
            activator="parent"
            location="bottom"
          >
            Actualizar
          </VTooltip>
        </VBtn>
        <VBtn
          icon
          variant="text"
          @click="$emit('export')"
        >
          <VIcon icon="tabler-download" />
          <VTooltip
            activator="parent"
            location="bottom"
          >
            Exportar
          </VTooltip>
        </VBtn>
        <VBtn
          icon
          variant="text"
          @click="$emit('share-report')"
        >
          <VIcon icon="tabler-share" />
          <VTooltip
            activator="parent"
            location="bottom"
          >
            Compartir
          </VTooltip>
        </VBtn>
        <VBtn
          icon
          variant="text"
          @click="$emit('edit-report')"
        >
          <VIcon icon="tabler-edit" />
          <VTooltip
            activator="parent"
            location="bottom"
          >
            Editar reporte
          </VTooltip>
        </VBtn>
        <VBtn
          icon
          variant="text"
          @click="$emit('toggle-fullscreen')"
        >
          <VIcon :icon="isFullscreen ? 'tabler-minimize' : 'tabler-maximize'" />
          <VTooltip
            activator="parent"
            location="bottom"
          >
            {{ isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa' }}
          </VTooltip>
        </VBtn>
      </div>
    </VCardTitle>
    <!-- Tabs de vista -->
    <VCardText class="pa-0">
      <VRow class="align-center justify-space-between px-4 pt-2 pb-0">
        <VCol cols="auto">
          <div class="d-flex align-center gap-2">
            <VTabs
              v-model="viewModeProxy"
              class="mb-0"
            >
              <VTab value="table">
                <VIcon
                  icon="tabler-table"
                  start
                />Tabla
              </VTab>
            </VTabs>
            <VBtnToggle
              v-model="densityProxy"
              mandatory
              density="compact"
            >
              <VBtn
                value="comfortable"
                icon
                size="small"
              >
                <VIcon
                  icon="tabler-line-height"
                  size="16"
                />
                <VTooltip activator="parent">
                  Cómodo
                </VTooltip>
              </VBtn>
              <VBtn
                value="default"
                icon
                size="small"
              >
                <VIcon
                  icon="tabler-menu-2"
                  size="16"
                />
                <VTooltip activator="parent">
                  Normal
                </VTooltip>
              </VBtn>
              <VBtn
                value="compact"
                icon
                size="small"
              >
                <VIcon
                  icon="tabler-list"
                  size="16"
                />
                <VTooltip activator="parent">
                  Compacto
                </VTooltip>
              </VBtn>
            </VBtnToggle>
          </div>
        </VCol>
        <VCol cols="auto">
          <div class="d-flex align-center gap-2">
            <VBtn
              icon
              variant="text"
              color="primary"
              :aria-label="showFilterPanel ? 'Ocultar filtros' : 'Mostrar filtros'"
              @click="$emit('toggle-filter-panel')"
            >
              <VIcon icon="tabler-filter" />
              <VTooltip activator="parent">
                {{ showFilterPanel ? 'Ocultar filtros' : 'Mostrar filtros' }}
              </VTooltip>
            </VBtn>
            <VTextField
              v-if="search.enabled"
              :model-value="quickSearchDraft"
              :placeholder="searchFieldsPlaceholder"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              class="quick-search"
              style="max-inline-size: 300px; min-inline-size: 300px;"
              @update:model-value="val => quickSearchDraft = val"
              @keydown.enter="applyQuickSearch"
              @click:clear="clearQuickSearch"
            >
              <template #prepend-inner>
                <VIcon
                  icon="tabler-search"
                  size="18"
                />
              </template>
            </VTextField>
            <ReportColumnSelectorMenu
              :fields="visibleColumnsFields"
              :visible-columns="visibleColumns"
              :frozen-columns="frozenColumns"
              @toggle-column-visibility="$emit('toggle-column-visibility', $event)"
              @freeze-column="$emit('freeze-column', $event)"
            />
          </div>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>
