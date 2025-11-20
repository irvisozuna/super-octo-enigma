<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWidgetRefresh } from '../composables/useWidgetRefresh'
import type { WidgetInstanceConfig } from '../../domain/types/WidgetTypes'

interface Props {
  widget: WidgetInstanceConfig
  autoRefresh?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: false,
  refreshInterval: 60,
})

const emit = defineEmits<{
  refresh: []
}>()

const {
  widgetData,
  loading,
  error,
  manualRefresh,
} = useWidgetRefresh(props.widget.id, {
  autoRefresh: props.autoRefresh,
  interval: props.refreshInterval,
  refreshOnMount: true,
})

// Config de display
const displayConfig = computed(() => props.widget.widget?.props.displayConfig)

// Pagination
const page = ref(1)
const itemsPerPage = ref(displayConfig.value?.pageSize || 10)

// Headers de la tabla
const headers = computed(() => {
  if (!widgetData.value)
    return []

  const visibleColumns = displayConfig.value?.visibleColumns || widgetData.value.columns

  return visibleColumns.map((col: string) => ({
    title: displayConfig.value?.columnLabels?.[col] || col,
    key: col,
    sortable: displayConfig.value?.sortable ?? true,
  }))
})

// Items de la tabla
const items = computed(() => {
  if (!widgetData.value)
    return []

  return widgetData.value.rows
})

// Paginación
const paginatedItems = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return items.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(items.value.length / itemsPerPage.value)
})

async function handleRefresh() {
  await manualRefresh()
  emit('refresh')
}

function handlePageChange(newPage: number) {
  page.value = newPage
}

function handleItemsPerPageChange(count: number) {
  itemsPerPage.value = count
  page.value = 1
}

// Format cell value
function formatCell(value: any, column: string) {
  const format = displayConfig.value?.columnFormats?.[column]

  if (!format)
    return value

  switch (format.type) {
    case 'currency':
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(Number(value))

    case 'percent':
      return `${Number(value).toFixed(format.decimals || 2)}%`

    case 'date':
      return new Date(value).toLocaleDateString('es-MX')

    case 'datetime':
      return new Date(value).toLocaleString('es-MX')

    default:
      return value
  }
}

// Get cell color
function getCellColor(value: any, column: string) {
  const colorRules = displayConfig.value?.colorRules?.[column]
  if (!colorRules)
    return undefined

  for (const rule of colorRules) {
    const numValue = Number(value)
    if (rule.operator === 'gt' && numValue > rule.value)
      return rule.color
    if (rule.operator === 'lt' && numValue < rule.value)
      return rule.color
    if (rule.operator === 'eq' && numValue === rule.value)
      return rule.color
  }

  return undefined
}
</script>

<template>
  <VCard
    flat
    :loading="loading"
    class="table-widget"
  >
    <VCardText>
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <h3 class="text-h6">
            {{ widget.title || widget.widget?.props.name }}
          </h3>
          <p
            v-if="widget.description"
            class="text-caption text-disabled"
          >
            {{ widget.description }}
          </p>
        </div>

        <VBtn
          icon
          variant="text"
          size="small"
          @click="handleRefresh"
        >
          <VIcon icon="tabler-refresh" />
        </VBtn>
      </div>

      <!-- Error State -->
      <VAlert
        v-if="error"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        {{ error }}
      </VAlert>

      <!-- Table -->
      <VDataTable
        v-else
        :headers="headers"
        :items="displayConfig?.enablePagination ? paginatedItems : items"
        :loading="loading"
        :items-per-page="itemsPerPage"
        :hide-default-footer="!displayConfig?.enablePagination"
        density="compact"
        class="elevation-0"
      >
        <template #item="{ item }">
          <tr>
            <td
              v-for="header in headers"
              :key="header.key"
            >
              <VChip
                v-if="getCellColor(item[header.key], header.key)"
                :color="getCellColor(item[header.key], header.key)"
                size="small"
                variant="tonal"
              >
                {{ formatCell(item[header.key], header.key) }}
              </VChip>
              <span v-else>
                {{ formatCell(item[header.key], header.key) }}
              </span>
            </td>
          </tr>
        </template>

        <template
          v-if="!loading && items.length === 0"
          #no-data
        >
          <div class="text-center pa-8">
            <VIcon
              icon="tabler-table"
              size="64"
              color="disabled"
            />
            <p class="text-body-2 text-disabled mt-4">
              No hay datos para mostrar
            </p>
          </div>
        </template>
      </VDataTable>

      <!-- Custom Pagination -->
      <div
        v-if="displayConfig?.enablePagination && items.length > 0"
        class="d-flex align-center justify-space-between mt-4"
      >
        <div class="d-flex align-center gap-2">
          <span class="text-caption text-disabled">Filas por página:</span>
          <VSelect
            :model-value="itemsPerPage"
            :items="[5, 10, 25, 50, 100]"
            density="compact"
            variant="outlined"
            hide-details
            style="inline-size: 80px"
            @update:model-value="handleItemsPerPageChange"
          />
        </div>

        <div class="text-caption text-disabled">
          {{ (page - 1) * itemsPerPage + 1 }}-{{ Math.min(page * itemsPerPage, items.length) }} de {{ items.length }}
        </div>

        <VPagination
          :model-value="page"
          :length="totalPages"
          :total-visible="5"
          density="compact"
          @update:model-value="handlePageChange"
        />
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped lang="scss">
.table-widget {
  block-size: 100%;
}
</style>
