<script setup lang="ts" generic="T extends Record<string, any>">
import type { PropType } from 'vue'
import { computed, ref, watch } from 'vue'

/**
 * BaseDataTable - Componente estandarizado para tablas con paginación servidor
 *
 * Maneja automáticamente:
 * - Paginación con estructura {data: [], meta: {current_page, last_page, per_page, total}}
 * - Sorting
 * - Loading states
 * - Slots personalizables para cada columna
 */

interface Header {
  title: string
  key: string
  sortable?: boolean
  align?: 'start' | 'end' | 'center'
}

interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

interface FetchParams {
  page: number
  per_page: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  [key: string]: any // Para filtros adicionales
}

// Props
const props = defineProps({
  headers: {
    type: Array as PropType<Header[]>,
    required: true,
  },
  items: {
    type: Array as PropType<T[]>,
    required: true,
  },
  meta: {
    type: Object as PropType<PaginationMeta>,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  itemsPerPageOptions: {
    type: Array as PropType<number[]>,
    default: () => [10, 15, 25, 50, 100],
  },
  additionalParams: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({}),
  },
  emptyStateTitle: {
    type: String,
    default: 'No hay datos',
  },
  emptyStateDescription: {
    type: String,
    default: 'Aún no se han registrado elementos en el sistema',
  },
  emptyStateIcon: {
    type: String,
    default: 'tabler-database-off',
  },
  showCreateButton: {
    type: Boolean,
    default: false,
  },
  createButtonText: {
    type: String,
    default: 'Crear',
  },
})

// Emits
const emit = defineEmits<{
  'update:options': [params: FetchParams]
  'create': []
  'row:click': [item: T]
}>()

// Local state
const currentPage = ref(props.meta.current_page)
const itemsPerPage = ref(props.meta.per_page)

// Watch para sincronizar con props
watch(() => props.meta.current_page, newPage => {
  currentPage.value = newPage
})

watch(() => props.meta.per_page, newPerPage => {
  itemsPerPage.value = newPerPage
})

// Computed
const totalItems = computed(() => props.meta.total)

// Handlers
const handleOptionsUpdate = (options: any) => {
  const { page, itemsPerPage: perPage, sortBy } = options

  const params: FetchParams = {
    page,
    per_page: perPage,
    ...props.additionalParams,
  }

  // Handle sorting
  if (sortBy && sortBy.length > 0) {
    params.sort_by = sortBy[0].key
    params.sort_order = sortBy[0].order || 'asc'
  }

  emit('update:options', params)
}

const handleCreate = () => {
  emit('create')
}

const handleRowClick = (event: any, row: any) => {
  emit('row:click', row.item)
}
</script>

<template>
  <VDataTableServer
    v-model:items-per-page="itemsPerPage"
    v-model:page="currentPage"
    :headers="headers"
    :items="items"
    :items-length="totalItems"
    :loading="loading"
    :items-per-page-options="itemsPerPageOptions"
    class="elevation-1"
    @update:options="handleOptionsUpdate"
    @click:row="handleRowClick"
  >
    <!-- Forward all item slots -->
    <template
      v-for="header in headers"
      :key="header.key"
      #[`item.${header.key}`]="{ item }"
    >
      <slot
        :name="`item.${header.key}`"
        :item="item"
      >
        {{ item[header.key] }}
      </slot>
    </template>

    <!-- Actions slot -->
    <template
      v-if="$slots.actions"
      #item.actions="{ item }"
    >
      <slot
        name="actions"
        :item="item"
      />
    </template>

    <!-- Top slot for additional content above table -->
    <template
      v-if="$slots.top"
      #top
    >
      <slot name="top" />
    </template>

    <!-- Bottom slot for additional content below table -->
    <template
      v-if="$slots.bottom"
      #bottom
    >
      <slot name="bottom" />
    </template>

    <!-- Loading slot -->
    <template #loading>
      <VSkeletonLoader type="table-row@10" />
    </template>

    <!-- Empty state -->
    <template #no-data>
      <div class="text-center pa-12">
        <VIcon
          :icon="emptyStateIcon"
          size="64"
          class="text-medium-emphasis mb-4"
        />
        <h5 class="text-h5 mb-2">
          {{ emptyStateTitle }}
        </h5>
        <p class="text-body-2 text-medium-emphasis mb-6">
          {{ emptyStateDescription }}
        </p>
        <VBtn
          v-if="showCreateButton"
          color="primary"
          prepend-icon="tabler-plus"
          @click="handleCreate"
        >
          {{ createButtonText }}
        </VBtn>
      </div>
    </template>
  </VDataTableServer>
</template>

<style scoped lang="scss">
:deep(.v-data-table) {
  .v-data-table__td {
    padding-block: 12px;
  }
}
</style>
