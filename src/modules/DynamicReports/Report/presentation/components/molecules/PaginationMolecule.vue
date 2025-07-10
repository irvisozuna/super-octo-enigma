<!-- PaginationMolecule.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  showItemsPerPage?: boolean
  itemsPerPageOptions?: number[]
}

interface Emits {
  pageChange: [page: number]
  itemsPerPageChange: [itemsPerPage: number]
}

const props = withDefaults(defineProps<Props>(), {
  showItemsPerPage: true,
  itemsPerPageOptions: () => [10, 25, 50, 100],
})

const emit = defineEmits<Emits>()

const { t } = useI18n()

const pageNumbers = computed(() => {
  const pages: (number | string)[] = []
  const maxVisible = 7
  const halfVisible = Math.floor(maxVisible / 2)

  if (props.totalPages <= maxVisible) {
    // Show all pages
    for (let i = 1; i <= props.totalPages; i++)
      pages.push(i)
  }
  else {
    // Show pages around current page
    const start = Math.max(1, props.currentPage - halfVisible)
    const end = Math.min(props.totalPages, props.currentPage + halfVisible)

    if (start > 1) {
      pages.push(1)
      if (start > 2)
        pages.push('...')
    }

    for (let i = start; i <= end; i++)
      pages.push(i)

    if (end < props.totalPages) {
      if (end < props.totalPages - 1)
        pages.push('...')
      pages.push(props.totalPages)
    }
  }

  return pages
})

const handlePageChange = (page: number): void => {
  if (page >= 1 && page <= props.totalPages)
    emit('pageChange', page)
}

const handleItemsPerPageChange = (itemsPerPage: number): void => {
  emit('itemsPerPageChange', itemsPerPage)
}
</script>

<template>
  <div class="pagination-container">
    <div class="d-flex align-center gap-2">
      <!-- Previous Button -->
      <VBtn
        icon
        variant="text"
        size="small"
        :disabled="currentPage <= 1"
        @click="handlePageChange(currentPage - 1)"
      >
        <VIcon icon="tabler-chevron-left" />
      </VBtn>

      <!-- Page Numbers -->
      <div class="d-flex align-center gap-1">
        <VBtn
          v-for="page in pageNumbers"
          :key="page"
          :variant="page === currentPage ? 'elevated' : 'text'"
          size="small"
          :disabled="page === '...'"
          @click="typeof page === 'number' ? handlePageChange(page) : undefined"
        >
          {{ page }}
        </VBtn>
      </div>

      <!-- Next Button -->
      <VBtn
        icon
        variant="text"
        size="small"
        :disabled="currentPage >= totalPages"
        @click="handlePageChange(currentPage + 1)"
      >
        <VIcon icon="tabler-chevron-right" />
      </VBtn>
    </div>

    <!-- Items Per Page Selector -->
    <div
      v-if="showItemsPerPage"
      class="d-flex align-center gap-2"
    >
      <span class="text-body-2 text-medium-emphasis">
        {{ t('reports.pagination.itemsPerPage') }}:
      </span>
      <VSelect
        :model-value="itemsPerPage"
        :items="itemsPerPageOptions"
        density="compact"
        variant="outlined"
        hide-details
        style="inline-size: 80px;"
        @update:model-value="handleItemsPerPageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

@media (max-width: 768px) {
  .pagination-container {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
