<!-- // src/modules/users/components/UserTable.vue -->
<template>
  <VDataTableServer
    :headers="headers"
    :items="items"
    :items-length="total"
    :page="localPage"
    :items-per-page="localItemsPerPage"
    :loading="loading"
    show-select
    :items-per-page-options="itemsPerPageOptions"
    @update:page="updatePage"
    @update:items-per-page="updateItemsPerPage"
  >
    <template #item.actions="{ item }">
      <VBtn icon="tabler-eye" rounded @click="$emit('view', item)"  variant="text"></VBtn>
      <VBtn icon="tabler-pencil" rounded @click="$emit('edit', item)"  variant="text"></VBtn>
      <VBtn icon="tabler-trash" rounded  @click="$emit('delete', item)" color="error" variant="text"></VBtn>
    </template>
  </VDataTableServer>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, ref, watch } from 'vue';

// Define props
const props = defineProps({
  headers: { type: Array, default: () => [] },
  items: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  itemsPerPage: { type: Number, default: 10 },
  loading: { type: Boolean, default: false },
  itemsPerPageOptions: { type: Array, default: () => [10, 25, 50, 100] },
});

// Define emits
const emits = defineEmits(['update:page', 'update:itemsPerPage', 'view', 'edit', 'delete']);

// Local state
const localPage = ref(props.page);
const localItemsPerPage = ref(props.itemsPerPage);

// Watchers para sincronizar cambios locales con los props
watch(
  () => props.page,
  (newPage) => {
    localPage.value = newPage;
  }
);

watch(
  () => props.itemsPerPage,
  (newItemsPerPage) => {
    localItemsPerPage.value = newItemsPerPage;
  }
);

// Emitir eventos para propagar cambios al padre
function updatePage(newPage: number) {
  localPage.value = newPage;
  emits('update:page', newPage);
}

function updateItemsPerPage(newItemsPerPage: number) {
  localItemsPerPage.value = newItemsPerPage;
  emits('update:itemsPerPage', newItemsPerPage);
}
</script>
