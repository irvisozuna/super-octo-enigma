<script setup lang="ts">
import { computed, defineEmits, defineProps, ref, watch } from 'vue'
import type { Role } from '@/types/types'

// Props
const props = defineProps({
  headers: { type: Array, required: true },
  items: { type: Array, required: true },
  total: { type: Number, required: true },
  page: { type: Number, required: true },
  itemsPerPage: { type: Number, required: true },
  loading: { type: Boolean, required: true },
  itemsPerPageOptions: { type: Array, default: () => [10, 25, 50, 100] },
  selection: { type: Array, default: () => [] }, // Lista seleccionada
  module: { type: String, required: true, default: 'paymentmandate' },
})

// Emits
const emits = defineEmits(['update:items-update-option', 'update:page', 'update:items-per-page', 'update:selection', 'view', 'edit', 'delete'])

// Local refs para paginación
const localPage = ref(props.page)
const localItemsPerPage = ref(props.itemsPerPage)

// Computed para el v-model de selección
const internalSelection = computed({
  get: () => props.selection,
  set: val => emits('update:selection', val),
})

// Watchers para sincronizar cambios locales con los props
watch(
  () => props.page,
  newPage => (localPage.value = newPage),
)

watch(
  () => props.itemsPerPage,
  newItemsPerPage => (localItemsPerPage.value = newItemsPerPage),
)

// Métodos
function updatePage(newPage: number) {
  emits('update:page', newPage)
}

function updateItemsPerPage(newItemsPerPage: number) {
  emits('update:items-per-page', newItemsPerPage)
}

function updateOptions(newOptions: any) {
  emits('update:items-update-option', newOptions)
}

function downloadFile(url: string) {
  window.open(url, '_blank')
}
</script>

<template>
  <VDataTableServer
    v-model="internalSelection"
    :headers="headers"
    :items="items"
    :items-length="total"
    :page="localPage"
    item-value="id"
    return-object
    :items-per-page="localItemsPerPage"
    :loading="loading"
    show-select
    :items-per-page-options="itemsPerPageOptions"
    @update:page="updatePage"
    @update:items-per-page="updateItemsPerPage"
  >
    <template #item.consecutive_number="{ item }">
      Lote {{ item.consecutive_number }}
    </template>
    <template #item.status="{ item }">
      <VChip
        :color="item.status === 'pending' ? 'warning' : 'success'"
        size="small"
      >
        {{ $t(`${module}.${item.status}`) }}
      </VChip>
    </template>
    <!-- agregar boton para descargar el archivo de file_path -->
    <template #item.file_path="{ item }">
      <VBtn
        icon="tabler-download"
        rounded
        variant="text"
        @click="downloadFile(item.file_path)"
      />
    </template>
    <template #item.actions="{ item }">
      <VBtn
        icon="tabler-eye"
        rounded
        variant="text"
        @click="$emit('view', item)"
      />
    </template>
  </VDataTableServer>
</template>
