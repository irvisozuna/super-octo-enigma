<!-- DataTableHeaderMolecule.vue -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface FieldConfig {
  field: string
  alias: string
  type: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  width?: number
}

interface SortState {
  direction: 'ASC' | 'DESC' | null
  index: number | null
}

interface Props {
  fields: FieldConfig[]
  sorting: Array<{ field: string; direction: 'ASC' | 'DESC' }>
  getColumnStyle: (field: FieldConfig) => Record<string, any>
  getSortState: (field: string) => SortState
}

interface Emits {
  sort: [field: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const handleSort = (field: FieldConfig): void => {
  if (field.sortable !== false)
    emit('sort', field.field)
}

const getSortIcon = (field: FieldConfig): string => {
  const sortState = props.getSortState(field.field)

  if (!sortState.direction)
    return 'tabler-selector'

  return sortState.direction === 'ASC'
    ? 'tabler-sort-ascending'
    : 'tabler-sort-descending'
}

const isSortable = (field: FieldConfig): boolean => {
  return field.sortable !== false
}

const getSortPriority = (field: FieldConfig): number | null => {
  return props.getSortState(field.field).index
}

const getSortColor = (field: FieldConfig): string => {
  const sortState = props.getSortState(field.field)

  return sortState.direction ? 'primary' : 'grey-lighten-1'
}

const getFieldIcon = (field: FieldConfig): string => {
  switch (field.type) {
    case 'number':
    case 'integer':
    case 'double':
      return 'tabler-123'
    case 'date':
    case 'datetime':
      return 'tabler-calendar'
    case 'boolean':
      return 'tabler-toggle-left'
    case 'text':
    case 'varchar':
      return 'tabler-abc'
    default:
      return 'tabler-column'
  }
}

const getAlignmentClass = (field: FieldConfig): string => {
  switch (field.align) {
    case 'center':
      return 'justify-center'
    case 'right':
      return 'justify-end'
    default:
      return 'justify-start'
  }
}
</script>

<template>
  <thead class="data-table-header-molecule">
    <tr class="header-row">
      <th
        v-for="field in fields"
        :key="field.field"
        :style="getColumnStyle(field)"
        class="header-cell"
        :class="[
          {
            'header-cell--sortable': isSortable(field),
            'header-cell--sorted': getSortState(field.field).direction,
          },
        ]"
        :aria-sort="getSortState(field.field).direction
          ? (getSortState(field.field).direction === 'ASC' ? 'ascending' : 'descending')
          : 'none'"
        @click="handleSort(field)"
        @keydown.enter="handleSort(field)"
        @keydown.space.prevent="handleSort(field)"
      >
        <div
          class="header-content d-flex align-center"
          :class="[getAlignmentClass(field)]"
        >
          <!-- Field Type Icon -->
          <VIcon
            :icon="getFieldIcon(field)"
            size="16"
            color="medium-emphasis"
            class="me-2 field-icon"
          />

          <!-- Field Label -->
          <span class="header-label font-weight-medium">
            {{ field.alias }}
          </span>

          <!-- Sort Controls -->
          <div
            v-if="isSortable(field)"
            class="sort-controls d-flex align-center ms-2"
          >
            <!-- Sort Icon -->
            <VIcon
              :icon="getSortIcon(field)"
              :color="getSortColor(field)"
              size="16"
              class="sort-icon"
            />

            <!-- Sort Priority Badge -->
            <VBadge
              v-if="getSortPriority(field)"
              :content="getSortPriority(field)"
              color="primary"
              variant="elevated"
              class="sort-priority ms-1"
            >
              <template #badge>
                <span class="text-caption">{{ getSortPriority(field) }}</span>
              </template>
            </VBadge>
          </div>

          <!-- Sortable Indicator -->
          <VTooltip
            v-if="isSortable(field)"
            activator="parent"
            location="bottom"
          >
            <span v-if="!getSortState(field.field).direction">
              {{ t('reports.table.clickToSort') }}
            </span>
            <span v-else-if="getSortState(field.field).direction === 'ASC'">
              {{ t('reports.table.sortedAscending') }}
            </span>
            <span v-else>
              {{ t('reports.table.sortedDescending') }}
            </span>
          </VTooltip>
        </div>
      </th>
    </tr>
  </thead>
</template>

<style scoped>
.data-table-header-molecule {
  background-color: rgb(var(--v-theme-surface-variant));
  border-block-end: 2px solid rgb(var(--v-theme-outline-variant));
}

.header-row {
  block-size: 56px;
}

.header-cell {
  position: relative;
  border-inline-end: 1px solid rgb(var(--v-theme-outline-variant));
  padding-block: 0;
  padding-inline: 16px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  vertical-align: middle;
}

.header-cell:last-child {
  border-inline-end: none;
}

.header-cell--sortable {
  cursor: pointer;
  user-select: none;
}

.header-cell--sortable:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.header-cell--sortable:active {
  background-color: rgba(var(--v-theme-on-surface), 0.08);
}

.header-cell--sorted {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.header-content {
  gap: 4px;
  min-block-size: 40px;
}

.header-label {
  overflow: hidden;
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.875rem;
  line-height: 1.25;
  max-inline-size: 200px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-icon {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.header-cell:hover .field-icon {
  opacity: 1;
}

.sort-controls {
  gap: 2px;
  margin-inline-start: auto;
}

.sort-icon {
  transition: all 0.2s ease;
}

.header-cell--sortable:hover .sort-icon {
  transform: scale(1.1);
}

.sort-priority {
  block-size: 18px;
  min-inline-size: 18px;
}

/* Focus styles for accessibility */
.header-cell--sortable:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

/* Animation for sort state changes */
.sort-icon {
  transform-origin: center;
}

@keyframes sortChange {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }
}

.header-cell--sorted .sort-icon {
  animation: sortChange 0.3s ease-out;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .header-cell {
    min-inline-size: 100px;
    padding-block: 0;
    padding-inline: 8px;
  }

  .header-label {
    font-size: 0.75rem;
    max-inline-size: 80px;
  }

  .field-icon {
    display: none;
  }

  .sort-priority {
    display: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .header-cell {
    border-width: 2px;
  }

  .header-cell--sorted {
    border: 2px solid rgb(var(--v-theme-primary));
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .header-cell,
  .sort-icon,
  .field-icon {
    transition: none;
  }

  .header-cell--sorted .sort-icon {
    animation: none;
  }
}

/* Dark theme adjustments */
@media (prefers-color-scheme: dark) {
  .data-table-header-molecule {
    background-color: rgb(var(--v-theme-surface-bright));
  }
}

/* Sticky header support */
.header-cell.sticky {
  position: sticky;
  z-index: 10;
  background-color: inherit;
  inset-block-start: 0;
}
</style>
