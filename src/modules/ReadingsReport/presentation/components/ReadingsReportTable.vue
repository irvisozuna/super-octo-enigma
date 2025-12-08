<script setup lang="ts">
import { computed } from 'vue'
import {
  DEFAULT_TAG_STYLE,
  getAnomalyStyle,
  getContractTypeStyle,
  getStatusStyle,
} from '@/modules/ReadingsReport/config/readingsReport.config'
import type { TagStyle } from '@/modules/ReadingsReport/config/readingsReport.config'

const props = defineProps<{
  headers: any[]
  items: any[]
  total: number
  page: number
  itemsPerPage: number
  loading: boolean
  selection: any[]
  itemKey?: string
  statusStyles?: Record<string, TagStyle>
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

const pageSync = computed({
  get: () => props.page,
  set: val => emits('update:page', val),
})

const itemsPerPageSync = computed({
  get: () => props.itemsPerPage,
  set: val => emits('update:items-per-page', val),
})

function onOptionsChange(options: any) {
  emits('update:items-update-option', options)
}

function getRow(rawOrSlotItem: any) {
  if (rawOrSlotItem?.raw)
    return rawOrSlotItem.raw

  return rawOrSlotItem
}

function getStatusChipProps(slotItem: any) {
  const row = getRow(slotItem)
  const statusKey = String(row.status ?? row.status_label ?? '').toLowerCase()

  const style = props.statusStyles
    ? props.statusStyles[statusKey] ?? DEFAULT_TAG_STYLE
    : getStatusStyle(statusKey)

  const isHex = typeof style.color === 'string' && style.color.startsWith('#')

  const chipStyle = {
    ...(style.color ? { '--status-bg': style.color, backgroundColor: style.color } : {}),
    ...(style.textColor ? { '--status-fg': style.textColor, color: style.textColor } : {}),
  }

  return {
    color: isHex ? undefined : style.color,
    variant: isHex ? 'flat' : style.variant ?? 'tonal',
    class: 'text-caption status-chip',
    style: chipStyle,
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

function formatDate(val: string | null | undefined) {
  if (!val)
    return '-'
  const date = new Date(val)
  if (Number.isNaN(date.getTime()))
    return val

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
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
    :item-key="itemKey || 'id'"
    show-select
    @update:options="onOptionsChange"
    @update:model-value="onSelectChange"
  >
    <template #item.taken_readings="{ item }">
      <span>{{ getRow(item).taken_readings }} / {{ getRow(item).total_readings }}</span>
    </template>

    <template #item.progress_percent="{ item }">
      <div
        class="d-flex align-center gap-2"
        style="min-inline-size: 140px;"
      >
        <span style="inline-size: 44px;">{{ Number(getRow(item).progress_percent || 0).toFixed(2) }}%</span>
        <VProgressLinear
          :model-value="Number(getRow(item).progress_percent || 0)"
          height="8"
          rounded
          color="#2563eb"
        />
      </div>
    </template>

    <template #item.downloaded_at="{ item }">
      <span>{{ formatDate(getRow(item).downloaded_at) }}</span>
    </template>

    <template #item.status_label="{ item }">
      <VChip
        v-bind="getStatusChipProps(item)"
        size="small"
      >
        {{ getRow(item).status_label }}
      </VChip>
    </template>

    <template #item.status="{ item }">
      <VChip
        v-bind="getStatusChipProps(item)"
        size="small"
      >
        {{ getRow(item).status }}
      </VChip>
    </template>

    <template #item.contract_type_name="{ item }">
      <VChip
        v-bind="getContractTypeChipProps(item)"
        size="small"
      >
        {{ getRow(item).contract_type_name }}
      </VChip>
    </template>

    <template #item.anomaly_name="{ item }">
      <VChip
        v-bind="getAnomalyChipProps(item)"
        size="small"
      >
        {{ getRow(item).anomaly_name }}
      </VChip>
    </template>
  </VDataTableServer>
</template>

<style scoped>
.status-chip {
  --v-theme-surface: transparent;
  --v-theme-on-surface: inherit;
  background-color: var(--status-bg) !important;
  color: var(--status-fg, #fff) !important;
  border-color: transparent !important;
}
</style>
