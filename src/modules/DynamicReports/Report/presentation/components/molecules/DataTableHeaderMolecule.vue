<!-- DataTableHeaderMolecule.vue -->
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

interface SortingRuleDTO {
  field: string
  direction: 'ASC' | 'DESC'
}

interface Props {
  fields: FieldConfigDTO[]
  sorting: SortingRuleDTO[]
  getColumnStyle: (field: FieldConfigDTO) => Record<string, any>
  getSortState: (field: string) => 'ASC' | 'DESC' | null
}

interface Emits {
  sort: [field: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleSort = (field: string): void => {
  emit('sort', field)
}

const getSortIcon = (field: string): string => {
  const sortState = props.getSortState(field)

  if (sortState === 'ASC')
    return 'tabler-chevron-up'
  if (sortState === 'DESC')
    return 'tabler-chevron-down'

  return 'tabler-chevron-up-down'
}
</script>

<template>
  <thead>
    <tr>
      <th
        v-for="field in fields"
        :key="field.field"
        :style="getColumnStyle(field)"
        class="text-left font-weight-medium text-body-2"
        @click="handleSort(field.field)"
      >
        <div class="d-flex align-center justify-space-between">
          <span>{{ field.label }}</span>
          <VIcon
            :icon="getSortIcon(field.field)"
            size="small"
            class="ms-1"
            :class="{
              'text-primary': getSortState(field.field) !== null,
            }"
          />
        </div>
      </th>
    </tr>
  </thead>
</template>

<style scoped>
th {
  border-block-end: 1px solid rgb(var(--v-theme-outline-variant));
  cursor: pointer;
  padding-block: 12px;
  padding-inline: 16px;
  transition: background-color 0.2s ease;
  user-select: none;
}

th:hover {
  background-color: rgb(var(--v-theme-surface-variant));
}
</style>
