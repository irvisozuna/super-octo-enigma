<script setup lang="ts">
import { computed } from 'vue'

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
                v-for="field in reportConfig.selectedFields.filter(f => visibleColumns.includes(f.field))"
                :key="field.field"
                :style="{
                  width: `${columnWidths[field.field]}px`,
                  textAlign: field.align || 'left',
                  position: frozenColumns.includes(field.field) ? 'sticky' : 'relative',
                  left: frozenColumns.includes(field.field) ? '0' : 'auto',
                  zIndex: frozenColumns.includes(field.field) ? 10 : 1,
                  backgroundColor: 'rgb(var(--v-theme-surface))',
                }"
                class="sortable-header"
                @click="field.sortable !== false && $emit('toggle-sort', field.field)"
              >
                <div
                  class="d-flex align-center"
                  :class="`justify-${field.align || 'start'}`"
                >
                  <span class="font-weight-medium">{{ field.alias }}</span>
                  <div
                    v-if="field.sortable !== false"
                    class="ms-2 d-flex align-center"
                  >
                    <VIcon
                      :icon="getSortIcon(field.field)"
                      size="16"
                      :color="activeSorting.find(s => s.field === field.field) ? 'primary' : 'grey'"
                    />
                    <span
                      v-if="getSortIndex(field.field)"
                      class="text-caption ms-1"
                      style="color: rgb(var(--v-theme-primary));"
                    >
                      {{ getSortIndex(field.field) }}
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
                v-for="field in reportConfig.selectedFields.filter(f => visibleColumns.includes(f.field))"
                :key="field.field"
                :style="{
                  textAlign: field.align || 'left',
                  position: frozenColumns.includes(field.field) ? 'sticky' : 'relative',
                  left: frozenColumns.includes(field.field) ? '0' : 'auto',
                  zIndex: frozenColumns.includes(field.field) ? 10 : 1,
                  backgroundColor: 'rgb(var(--v-theme-surface))',
                }"
              >
                {{ formatCellValue(row[field.field], field) }}
              </td>
            </tr>
          </tbody>
        </VTable>

        <!-- Paginación -->
        <div class="d-flex align-center justify-space-between pa-4">
          <div class="d-flex align-center gap-2">
            <span class="text-body-2 text-medium-emphasis">
              Mostrando {{ (store.page - 1) * store.itemsPerPage + 1 }} - {{ Math.min(store.page * store.itemsPerPage, store.total) }} de {{ store.total }} registros
            </span>
          </div>
          <div class="d-flex align-center gap-2">
            <VSelect
              v-model="store.itemsPerPage"
              :items="[25, 50, 100, 200]"
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
