<script setup lang="ts">
const props = defineProps<{
  reportConfig: any
  visibleColumns: string[]
  frozenColumns: string[]
  columnWidths: Record<string, number>
  activeSorting: any[]
  density: string
  isFullscreen: boolean
  paginatedData: any[]
  store: any
  loading: boolean
  error: string | null
  formatCellValue: (value: any, field: any) => string
  getSortIcon: (field: string) => string
  getSortIndex: (field: string) => number | null
}>()

defineEmits<{
  (e: 'toggle-sort', field: string): void
  (e: 'handle-page-change', page: number): void
  (e: 'handle-items-per-page-change', items: number): void
}>()

// Computed para obtener TODAS las columnas configuradas (incluyendo calculadas)
const allColumns = computed(() => {
  const columnsMap = new Map()

  // Si hay meta.columns, usarlos como fuente principal
  if (props.reportConfig?.meta?.columns) {
    props.reportConfig.meta.columns.forEach(col => {
      columnsMap.set(col.key, {
        field: col.key,
        alias: col.label,
        label: col.label,
        type: col.type || 'text',
        format: col.format,
        align: col.align || 'left',
        sortable: col.sortable !== false,
        width: col.width || 150,
      })
    })

    return Array.from(columnsMap.values())
  }

  // Si no hay meta.columns, construir desde selectedFields y calculatedFields
  // Primero agregar selectedFields
  if (props.reportConfig?.selectedFields) {
    props.reportConfig.selectedFields.forEach(field => {
      columnsMap.set(field.field, {
        field: field.field,
        alias: field.alias || field.label || field.field,
        label: field.label || field.field,
        type: field.type,
        format: field.format,
        align: field.align || 'left',
        sortable: field.sortable !== false,
        width: field.width || 150,
        ...field, // Mantener todas las propiedades originales
      })
    })
  }

  debugger

  // Luego agregar calculatedFields
  if (props.reportConfig?.advanced?.calculatedFields) {
    props.reportConfig.advanced.calculatedFields.forEach(calcField => {
      if (calcField.enabled !== false) {
        columnsMap.set(calcField.id, {
          field: calcField.id,
          alias: calcField.name || calcField.id,
          label: calcField.name || calcField.id,
          type: 'calculated',
          format: calcField.format || 'number',
          align: 'right', // Los campos calculados suelen ser numéricos
          sortable: false,
          width: 150,
        })
      }
    })
  }

  return Array.from(columnsMap.values())
})

// Filtrar solo las columnas visibles
const visibleColumnsConfig = computed(() => {
  return allColumns.value.filter(col => props.visibleColumns.includes(col.field))
})
</script>

<template>
  <VCard class="flex-grow-1">
    <VCardText class="pa-0">
      <!-- Loading overlay -->
      <VOverlay
        :model-value="loading"
        contained
        class="align-center justify-center"
      >
        <VProgressCircular
          indeterminate
          size="64"
        />
      </VOverlay>

      <!-- Loading overlay para datos -->
      <VOverlay
        :model-value="store.reportLoading"
        contained
        class="align-center justify-center"
      >
        <VCard class="pa-4">
          <div class="d-flex align-center gap-3">
            <VProgressCircular
              indeterminate
              size="32"
              color="primary"
            />
            <span class="text-body-1">Cargando datos del reporte...</span>
          </div>
        </VCard>
      </VOverlay>

      <!-- Error state -->
      <VAlert
        v-if="error || store.reportError"
        type="error"
        variant="tonal"
        class="ma-4"
      >
        {{ error || store.reportError }}
      </VAlert>

      <!-- Tabla -->
      <div
        v-if="!error && reportConfig"
        class="data-table-container"
      >
        <VTable
          :density="density"
          fixed-header
          :height="isFullscreen ? 'calc(100vh - 200px)' : '600'"
        >
          <thead>
            <tr>
              <th
                v-for="column in visibleColumnsConfig"
                :key="column.field"
                :style="{
                  width: `${columnWidths[column.field] || column.width || 150}px`,
                  textAlign: column.align || 'left',
                  position: frozenColumns.includes(column.field) ? 'sticky' : 'relative',
                  left: frozenColumns.includes(column.field) ? '0' : 'auto',
                  zIndex: frozenColumns.includes(column.field) ? 10 : 1,
                  backgroundColor: 'rgb(var(--v-theme-surface))',
                }"
                class="sortable-header"
                @click="column.sortable && $emit('toggle-sort', column.field)"
              >
                <div
                  class="d-flex align-center"
                  :class="`justify-${column.align || 'start'}`"
                >
                  <span class="font-weight-medium">{{ column.alias || column.label }}</span>
                  <div
                    v-if="column.type !== 'calculated' && column.sortable"
                    class="ms-2 d-flex align-center"
                  >
                    <VIcon
                      :icon="getSortIcon(column.field)"
                      size="16"
                      :color="activeSorting.find(s => s.field === column.field) ? 'primary' : 'grey'"
                    />
                    <span
                      v-if="getSortIndex(column.field)"
                      class="text-caption ms-1"
                      style="color: rgb(var(--v-theme-primary));"
                    >
                      {{ getSortIndex(column.field) }}
                    </span>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in paginatedData"
              :key="index"
            >
              <td
                v-for="column in visibleColumnsConfig"
                :key="column.field"
                :style="{
                  textAlign: column.align || 'left',
                  position: frozenColumns.includes(column.field) ? 'sticky' : 'relative',
                  left: frozenColumns.includes(column.field) ? '0' : 'auto',
                  zIndex: frozenColumns.includes(column.field) ? 10 : 1,
                  backgroundColor: 'rgb(var(--v-theme-surface))',
                }"
              >
                {{ formatCellValue(row[column.field], column) }}
              </td>
            </tr>
          </tbody>
        </VTable>

        <!-- Paginación -->
        <div class="d-flex align-center justify-space-between pa-4">
          <div class="d-flex align-center gap-2">
            <span class="text-body-2 text-medium-emphasis">
              Mostrando {{ (store.page - 1) * store.itemsPerPage + 1 }} - {{ Math.min(store.page * store.itemsPerPage, store.reportTotalRecords || store.total) }} de {{ store.reportTotalRecords || store.total }} registros
            </span>
          </div>
          <div class="d-flex align-center gap-2">
            <VSelect
              v-model="store.itemsPerPage"
              :items="[20, 25, 50, 100, 200]"
              density="compact"
              variant="outlined"
              hide-details
              style="min-inline-size: 80px;"
              @update:model-value="$emit('handle-items-per-page-change', $event)"
            />
            <VPagination
              v-model="store.page"
              :length="store.totalPages"
              :total-visible="7"
              density="compact"
              @update:model-value="$emit('handle-page-change', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div
        v-else-if="!loading && !reportConfig"
        class="d-flex align-center justify-center"
        style="block-size: 400px;"
      >
        <VAlert
          type="info"
          variant="tonal"
          text="No se encontró configuración del reporte"
        />
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
.data-table-container {
  overflow: auto;
}

.sortable-header {
  cursor: pointer;
  transition: background-color 0.2s;
  user-select: none;
}

.sortable-header:hover {
  background-color: rgb(var(--v-theme-surface-variant));
}
</style>
