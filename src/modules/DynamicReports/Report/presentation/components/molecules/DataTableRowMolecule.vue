<!-- DataTableRowMolecule.vue -->
<script setup lang="ts">
import { computed } from 'vue'

interface FieldConfig {
  field: string
  alias: string
  type: string
  align?: 'left' | 'center' | 'right'
  format?: string
  width?: number
}

interface Props {
  row: Record<string, any>
  fields: FieldConfig[]
  rowIndex: number
  getColumnStyle: (field: FieldConfig) => Record<string, any>
  formatCellValue: (value: any, field: FieldConfig) => string
  selectable?: boolean
  selected?: boolean
  hoverable?: boolean
  clickable?: boolean
}

interface Emits {
  rowClick: [row: Record<string, any>, index: number]
  rowSelect: [selected: boolean, row: Record<string, any>, index: number]
  cellClick: [value: any, field: FieldConfig, row: Record<string, any>]
}

const props = withDefaults(defineProps<Props>(), {
  selectable: false,
  selected: false,
  hoverable: true,
  clickable: false,
})

const emit = defineEmits<Emits>()

const rowClass = computed(() => [
  'data-table-row-molecule',
  {
    'row--selectable': props.selectable,
    'row--selected': props.selected,
    'row--hoverable': props.hoverable,
    'row--clickable': props.clickable,
    'row--even': props.rowIndex % 2 === 0,
    'row--odd': props.rowIndex % 2 === 1,
  },
])

const handleRowClick = (): void => {
  if (props.clickable)
    emit('rowClick', props.row, props.rowIndex)
}

const handleRowSelect = (selected: boolean): void => {
  emit('rowSelect', selected, props.row, props.rowIndex)
}

const handleCellClick = (field: FieldConfig): void => {
  const value = props.row[field.field]

  emit('cellClick', value, field, props.row)
}

const getCellClass = (field: FieldConfig): string[] => {
  return [
    'table-cell',
    `cell--${field.type}`,
    field.align ? `text-${field.align}` : 'text-left',
  ]
}

const getCellValue = (field: FieldConfig): any => {
  return props.row[field.field]
}

const getFormattedValue = (field: FieldConfig): string => {
  const value = getCellValue(field)

  return props.formatCellValue(value, field)
}

const getCellIcon = (field: FieldConfig): string | null => {
  const value = getCellValue(field)

  switch (field.type) {
    case 'boolean':
      return value ? 'tabler-check' : 'tabler-x'
    case 'date':
    case 'datetime':
      return value ? 'tabler-calendar' : null
    default:
      return null
  }
}

const getCellColor = (field: FieldConfig): string | undefined => {
  const value = getCellValue(field)

  switch (field.type) {
    case 'boolean':
      return value ? 'success' : 'error'
    default:
      return undefined
  }
}

const isCellEmpty = (field: FieldConfig): boolean => {
  const value = getCellValue(field)

  return value === null || value === undefined || value === ''
}

const isCellNumeric = (field: FieldConfig): boolean => {
  return ['number', 'integer', 'double', 'currency'].includes(field.type)
}
</script>

<template>
  <tr
    :class="rowClass"
    :tabindex="clickable ? 0 : -1"
    @click="handleRowClick"
    @keydown.enter="handleRowClick"
    @keydown.space.prevent="handleRowClick"
  >
    <!-- Selection Checkbox -->
    <td
      v-if="selectable"
      class="table-cell cell--selection"
      @click.stop
    >
      <VCheckbox
        :model-value="selected"
        hide-details
        density="compact"
        color="primary"
        @update:model-value="handleRowSelect"
      />
    </td>

    <!-- Data Cells -->
    <td
      v-for="field in fields"
      :key="field.field"
      :style="getColumnStyle(field)"
      :class="getCellClass(field)"
      @click="handleCellClick(field)"
    >
      <div class="cell-content d-flex align-center">
        <!-- Cell Icon -->
        <VIcon
          v-if="getCellIcon(field)"
          :icon="getCellIcon(field)!"
          :color="getCellColor(field)"
          size="16"
          class="me-2 cell-icon"
        />

        <!-- Cell Value -->
        <span
          class="cell-value"
          :class="[
            {
              'cell-value--empty': isCellEmpty(field),
              'cell-value--numeric': isCellNumeric(field),
              'font-weight-medium': field.type === 'boolean',
            },
          ]"
        >
          {{ getFormattedValue(field) }}
        </span>

        <!-- Special Indicators -->
        <div
          v-if="field.type === 'currency' && !isCellEmpty(field)"
          class="ms-auto"
        >
          <VIcon
            icon="tabler-currency-dollar"
            size="12"
            color="success"
            class="currency-indicator"
          />
        </div>
      </div>
    </td>
  </tr>
</template>

<style scoped>
.data-table-row-molecule {
  border-block-end: 1px solid rgb(var(--v-theme-outline-variant));
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Row states */
.row--hoverable:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.row--selected {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.row--clickable {
  cursor: pointer;
}

.row--clickable:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.08);
}

/* Zebra striping */
.row--even {
  background-color: rgba(var(--v-theme-on-surface), 0.02);
}

/* Cell styles */
.table-cell {
  border-inline-end: 1px solid rgb(var(--v-theme-outline-variant));
  padding-block: 12px;
  padding-inline: 16px;
  transition: background-color 0.2s ease;
  vertical-align: middle;
}

.table-cell:last-child {
  border-inline-end: none;
}

.cell--selection {
  padding: 8px;
  inline-size: 48px;
}

.cell-content {
  max-inline-size: 100%;
  min-block-size: 20px;
}

.cell-value {
  overflow: hidden;
  flex: 1;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-value--empty {
  color: rgb(var(--v-theme-on-surface-variant));
  font-style: italic;
}

.cell-value--numeric {
  font-family: "Roboto Mono", monospace;
  font-variant-numeric: tabular-nums;
}

/* Type-specific styling */
.cell--number,
.cell--integer,
.cell--double,
.cell--currency {
  text-align: end;
}

.cell--boolean {
  text-align: center;
}

.cell--date,
.cell--datetime {
  font-variant-numeric: tabular-nums;
}

/* Icons */
.cell-icon {
  flex-shrink: 0;
  opacity: 0.8;
}

.currency-indicator {
  opacity: 0.6;
}

/* Focus styles for accessibility */
.row--clickable:focus-visible {
  background-color: rgba(var(--v-theme-primary), 0.04);
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

/* Interactive cell highlighting */
.table-cell:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.02);
}

/* Loading skeleton animation */
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }

  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.cell-value--loading {
  border-radius: 4px;
  animation: shimmer 1.5s infinite;
  background: linear-gradient(90deg, transparent, rgba(var(--v-theme-on-surface), 0.1), transparent);
  background-size: 200px 100%;
  block-size: 16px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .table-cell {
    font-size: 0.875rem;
    padding-block: 8px;
    padding-inline: 4px;
  }

  .cell-content {
    min-block-size: 16px;
  }

  .cell-icon {
    display: none;
  }

  .currency-indicator {
    display: none;
  }

  .cell-value {
    max-inline-size: 80px;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .data-table-row-molecule {
    border-block-end-width: 2px;
  }

  .row--selected {
    border: 2px solid rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.2);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .data-table-row-molecule,
  .table-cell,
  .cell-icon {
    transition: none;
  }

  .cell-value--loading {
    animation: none;
  }
}

/* Print styles */
@media print {
  .data-table-row-molecule {
    break-inside: avoid;
  }

  .cell--selection {
    display: none;
  }

  .row--selected {
    border: 1px solid black;
    background-color: transparent;
  }
}
</style>
