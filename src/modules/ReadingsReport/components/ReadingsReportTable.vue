<!-- src/modules/ReadingsReport/components/ReadingsReportTable.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import {
  getAnomalyStyle,
  getContractTypeStyle,
  getStatusStyle,
} from '@/modules/ReadingsReport/config/readingsReport.config'

const props = defineProps<{
  headers: any[]
  items: any[]
  total: number
  page: number
  itemsPerPage: number
  loading: boolean
  selection: any[]
}>()

const emits = defineEmits<{
  (e: 'update:page', value: number): void
  (e: 'update:items-per-page', value: number): void
  (e: 'update:selection', value: any[]): void
  (e: 'update:items-update-option', value: any): void
  (e: 'view', item: any): void
  (e: 'edit', item: any): void
  (e: 'delete', item: any): void
}>()

// Adaptadores para VDataTableServer (Vuetify 3)
const pageSync = computed({
  get: () => props.page,
  set: val => emits('update:page', val),
})

const itemsPerPageSync = computed({
  get: () => props.itemsPerPage,
  set: val => emits('update:items-per-page', val),
})

// Cuando cambia el sort / opciones de la tabla
function onOptionsChange(options: any) {
  // options = { page, itemsPerPage, sortBy, ... }
  emits('update:items-update-option', options)
}

// Helpers para chips
function getRow(rawOrSlotItem: any) {
  // En v-data-table-server de Vuetify 3, el slot item viene como { raw, ... }
  if (rawOrSlotItem?.raw)
    return rawOrSlotItem.raw

  return rawOrSlotItem
}

function getStatusChipProps(slotItem: any) {
  const row = getRow(slotItem)
  const style = getStatusStyle(row.status)

  return {
    color: style.color,
    variant: style.variant ?? 'flat',
    class: 'text-caption',
  }
}

function getContractTypeChipProps(slotItem: any) {
  const row = getRow(slotItem)
  const style = getContractTypeStyle(row.contract_type_name)

  return {
    color: style.color,
    variant: style.variant ?? 'flat',
    class: 'text-caption',
  }
}

function getAnomalyChipProps(slotItem: any) {
  const row = getRow(slotItem)
  const style = getAnomalyStyle(row.anomaly_name)

  return {
    color: style.color,
    variant: style.variant ?? 'flat',
    class: 'text-caption',
  }
}

function onSelectChange(selection: any[]) {
  emits('update:selection', selection)
}
</script>

<template>
  <VDataTableServer
    v-model:page="pageSync"
    v-model:items-per-page="itemsPerPageSync"
    :headers="headers"
    :items="items"
    :items-length="total"
    :loading="loading"
    item-key="id"
    show-select
    @update:options="onOptionsChange"
    @update:model-value="onSelectChange"
  >
    <!-- Columna: Estatus -->
    <template #item.status_label="{ item }">
      <VChip
        v-bind="getStatusChipProps(item)"
        size="small"
      >
        {{ getRow(item).status_label }}
      </VChip>
    </template>

    <!-- Columna: Tipo de contrato -->
    <template #item.contract_type_name="{ item }">
      <VChip
        v-bind="getContractTypeChipProps(item)"
        size="small"
      >
        {{ getRow(item).contract_type_name }}
      </VChip>
    </template>

    <!-- Columna: Anomalia -->
    <template #item.anomaly_name="{ item }">
      <VChip
        v-bind="getAnomalyChipProps(item)"
        size="small"
      >
        {{ getRow(item).anomaly_name }}
      </VChip>
    </template>

    <!--
      Si luego quieres acciones:
      <template #item.actions="{ item }">
      <VBtn
      icon="tabler-eye"
      size="small"
      variant="text"
      @click="$emit('view', getRow(item))"
      />
      <VBtn
      icon="tabler-pencil"
      size="small"
      variant="text"
      @click="$emit('edit', getRow(item))"
      />
      <VBtn
      icon="tabler-trash"
      size="small"
      variant="text"
      color="error"
      @click="$emit('delete', getRow(item))"
      />
      </template>
    -->
  </VDataTableServer>
</template>
