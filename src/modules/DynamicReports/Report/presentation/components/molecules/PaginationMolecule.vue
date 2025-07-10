<!-- PaginationMolecule.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// Atoms
import IconButtonAtom from '../atoms/IconButtonAtom.vue'

interface Props {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  showFirstLast?: boolean
  showItemsPerPage?: boolean
  itemsPerPageOptions?: number[]
  maxVisiblePages?: number
  dense?: boolean
  disabled?: boolean
}

interface Emits {
  pageChange: [page: number]
  itemsPerPageChange: [itemsPerPage: number]
}

const props = withDefaults(defineProps<Props>(), {
  showFirstLast: true,
  showItemsPerPage: false,
  itemsPerPageOptions: () => [10, 25, 50, 100],
  maxVisiblePages: 5,
  dense: false,
  disabled: false,
})

const emit = defineEmits<Emits>()

const { t } = useI18n()

const startItem = computed(() =>
  Math.min((props.currentPage - 1) * props.itemsPerPage + 1, props.totalItems),
)

const endItem = computed(() =>
  Math.min(props.currentPage * props.itemsPerPage, props.totalItems),
)

const visiblePages = computed(() => {
  const maxVisible = props.maxVisiblePages
  const total = props.totalPages
  const current = props.currentPage

  if (total <= maxVisible)
    return Array.from({ length: total }, (_, i) => i + 1)

  const half = Math.floor(maxVisible / 2)
  let start = Math.max(1, current - half)
  const end = Math.min(total, start + maxVisible - 1)

  if (end - start + 1 < maxVisible)
    start = Math.max(1, end - maxVisible + 1)

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

const showStartEllipsis = computed(() =>
  visiblePages.value[0] > 1,
)

const showEndEllipsis = computed(() =>
  visiblePages.value[visiblePages.value.length - 1] < props.totalPages,
)

const isFirstPage = computed(() => props.currentPage <= 1)
const isLastPage = computed(() => props.currentPage >= props.totalPages)

const handlePageChange = (page: number): void => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage && !props.disabled)
    emit('pageChange', page)
}

const handleItemsPerPageChange = (itemsPerPage: number): void => {
  if (itemsPerPage !== props.itemsPerPage && !props.disabled)
    emit('itemsPerPageChange', itemsPerPage)
}

const handlePrevious = (): void => {
  handlePageChange(props.currentPage - 1)
}

const handleNext = (): void => {
  handlePageChange(props.currentPage + 1)
}

const handleFirst = (): void => {
  handlePageChange(1)
}

const handleLast = (): void => {
  handlePageChange(props.totalPages)
}

const buttonSize = computed(() => props.dense ? 'small' : 'default')
</script>

<template>
  <div class="pagination-molecule d-flex align-center">
    <!-- Items per page selector -->
    <div
      v-if="showItemsPerPage"
      class="items-per-page me-4"
    >
      <VSelect
        :model-value="itemsPerPage"
        :items="itemsPerPageOptions"
        :disabled="disabled"
        :density="dense ? 'compact' : 'default'"
        variant="outlined"
        hide-details
        class="items-per-page-select"
        style="min-inline-size: 80px;"
        @update:model-value="handleItemsPerPageChange"
      >
        <template #prepend>
          <span class="text-body-2 text-medium-emphasis me-2">
            {{ t('pagination.itemsPerPage') }}:
          </span>
        </template>
      </VSelect>
    </div>

    <!-- Page info -->
    <div class="page-info me-4 text-body-2 text-medium-emphasis">
      {{ t('pagination.showingItems', {
        start: startItem,
        end: endItem,
        total: totalItems,
      }) }}
    </div>

    <!-- Pagination controls -->
    <div class="pagination-controls d-flex align-center">
      <!-- First page -->
      <IconButtonAtom
        v-if="showFirstLast"
        icon="tabler-chevrons-left"
        :tooltip="t('pagination.firstPage')"
        :disabled="isFirstPage || disabled"
        :size="buttonSize"
        variant="text"
        @click="handleFirst"
      />

      <!-- Previous page -->
      <IconButtonAtom
        icon="tabler-chevron-left"
        :tooltip="t('pagination.previousPage')"
        :disabled="isFirstPage || disabled"
        :size="buttonSize"
        variant="text"
        @click="handlePrevious"
      />

      <!-- Start ellipsis -->
      <span
        v-if="showStartEllipsis"
        class="ellipsis mx-2"
      >...</span>

      <!-- Page numbers -->
      <div class="page-numbers d-flex align-center">
        <VBtn
          v-for="page in visiblePages"
          :key="page"
          :variant="page === currentPage ? 'elevated' : 'text'"
          :color="page === currentPage ? 'primary' : undefined"
          :size="buttonSize"
          :disabled="disabled"
          class="page-button mx-1"
          @click="handlePageChange(page)"
        >
          {{ page }}
        </VBtn>
      </div>

      <!-- End ellipsis -->
      <span
        v-if="showEndEllipsis"
        class="ellipsis mx-2"
      >...</span>

      <!-- Next page -->
      <IconButtonAtom
        icon="tabler-chevron-right"
        :tooltip="t('pagination.nextPage')"
        :disabled="isLastPage || disabled"
        :size="buttonSize"
        variant="text"
        @click="handleNext"
      />

      <!-- Last page -->
      <IconButtonAtom
        v-if="showFirstLast"
        icon="tabler-chevrons-right"
        :tooltip="t('pagination.lastPage')"
        :disabled="isLastPage || disabled"
        :size="buttonSize"
        variant="text"
        @click="handleLast"
      />
    </div>
  </div>
</template>

<style scoped>
.pagination-molecule {
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.items-per-page {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.items-per-page-select {
  max-inline-size: 120px;
}

.page-info {
  flex-shrink: 1;
  min-inline-size: 0;
  white-space: nowrap;
}

.pagination-controls {
  gap: 4px;
}

.page-numbers {
  gap: 2px;
}

.page-button {
  font-weight: 500;
  min-inline-size: 40px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-button:hover {
  transform: scale(1.05);
}

.ellipsis {
  color: rgb(var(--v-theme-on-surface-variant));
  font-weight: 500;
  user-select: none;
}

/* Dense mode adjustments */
.pagination-molecule.dense .page-button {
  font-size: 0.875rem;
  min-inline-size: 32px;
}

.pagination-molecule.dense .page-info {
  font-size: 0.75rem;
}

/* Focus management */
.page-button:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

/* Active page styling */
.page-button[variant="elevated"] {
  box-shadow: 0 2px 4px rgba(var(--v-theme-primary), 0.3);
  transform: scale(1.05);
}

/* Disabled state */
.pagination-molecule :deep(.v-btn--disabled) {
  opacity: 0.4;
}

/* Responsive behavior */
@media (max-width: 768px) {
  .pagination-molecule {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .items-per-page {
    order: 3;
  }

  .page-info {
    order: 1;
    font-size: 0.875rem;
    text-align: center;
  }

  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
    order: 2;
  }

  .page-numbers {
    max-inline-size: 280px;
    -ms-overflow-style: none;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .page-numbers::-webkit-scrollbar {
    display: none;
  }
}

@media (max-width: 480px) {
  .page-info {
    font-size: 0.75rem;
  }

  .page-button {
    block-size: 36px;
    min-inline-size: 36px;
  }

  .ellipsis {
    margin-block: 0;
    margin-inline: 4px;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .page-button[variant="elevated"] {
    border: 2px solid rgb(var(--v-theme-primary));
  }

  .ellipsis {
    font-weight: 700;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .page-button {
    transition: none;
  }

  .page-button:hover {
    transform: none;
  }

  .page-button[variant="elevated"] {
    transform: none;
  }
}

/* Print styles */
@media print {
  .pagination-molecule {
    display: none;
  }
}

/* Loading state */
.pagination-molecule--loading {
  opacity: 0.6;
  pointer-events: none;
}

.pagination-molecule--loading * {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
 100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}
</style>
