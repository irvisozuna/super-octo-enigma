<!-- DataTableRowMolecule.vue -->
<script setup lang="ts">
import { computed } from 'vue'

interface FieldConfigDTO {
  field: string
  label: string
  type: string
  width?: number
  format?: string
  decimals?: number
  thousandsSeparator?: boolean
}

interface Props {
  row: Record<string, any>
  fields: FieldConfigDTO[]
  rowIndex: number
  getColumnStyle: (field: FieldConfigDTO) => Record<string, any>
  formatCellValue: (value: any, field: FieldConfigDTO) => string
}

const props = defineProps<Props>()

const isEvenRow = computed(() => props.rowIndex % 2 === 0)

const rowClass = computed(() => ({
  'even-row': isEvenRow.value,
  'odd-row': !isEvenRow.value,
}))
</script>

<template>
  <tr
    :class="rowClass"
    class="data-table-row"
  >
    <td
      v-for="field in fields"
      :key="field.field"
      :style="getColumnStyle(field)"
      class="text-left text-body-2"
    >
      {{ formatCellValue(row[field.field], field) }}
    </td>
  </tr>
</template>

<style scoped>
.data-table-row {
  transition: background-color 0.2s ease;
}

.data-table-row:hover {
  background-color: rgb(var(--v-theme-surface-variant));
}

.even-row {
  background-color: rgb(var(--v-theme-surface));
}

.odd-row {
  background-color: rgb(var(--v-theme-background));
}

td {
  border-block-end: 1px solid rgb(var(--v-theme-outline-variant));
  padding-block: 8px;
  padding-inline: 16px;
  vertical-align: middle;
}
</style>
