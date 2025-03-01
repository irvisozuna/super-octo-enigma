<template>
  <VDataTableServer :headers="headers" :items="items" :items-length="total" :page="localPage" item-value="id"
    return-object :items-per-page="localItemsPerPage" :loading="loading" show-select
    :items-per-page-options="itemsPerPageOptions" v-model="internalSelection" @update:page="updatePage"
    @update:items-per-page="updateItemsPerPage">
    <template #item.id="{ item }">{{ item.id }}</template>
    <template #item.name="{ item }">{{ item.name }}</template>
    <template #item.email="{ item }">{{ item.email }}</template>
    <template #item.role="{ item }">
      {{ item.roles ? item.roles.map((role: Role) => role.name).join(', ') : '' }}
    </template>
    <template #item.actions="{ item }">
      <VBtn icon="tabler-user" rounded @click="$emit('view', item)" variant="text">
        <VIcon icon="tabler-user" />
        <VTooltip activator="parent" location="top">
          {{ $t('show_profile') }}
        </VTooltip>
      </VBtn>
      <VBtn icon="tabler-pencil" rounded @click="$emit('edit', item)" variant="text"></VBtn>
      <VBtn icon="tabler-trash" rounded @click="$emit('delete', item)" color="error" variant="text"></VBtn>
    </template>
  </VDataTableServer>
</template>

<script setup lang="ts">
import { Role } from '@/types/types';
import { computed, defineEmits, defineProps, ref, watch } from 'vue';

// Props
const props = defineProps({
  headers: { type: Array, required: true },
  items: { type: Array, required: true },
  total: { type: Number, required: true },
  page: { type: Number, required: true },
  itemsPerPage: { type: Number, required: true },
  loading: { type: Boolean, required: true },
  itemsPerPageOptions: { type: Array, default: () => [5, 10, 25, 50, 100] },
  selection: { type: Array, default: () => [] }, // Lista seleccionada
});

// Emits
const emits = defineEmits(['update:page', 'update:items-per-page', 'update:selection', 'view', 'edit', 'delete']);

// Local refs para paginación
const localPage = ref(props.page);
const localItemsPerPage = ref(props.itemsPerPage);

// Computed para el v-model de selección
const internalSelection = computed({
  get: () => props.selection,
  set: (val) => emits('update:selection', val),
});

// Watchers para sincronizar cambios locales con los props
watch(
  () => props.page,
  (newPage) => (localPage.value = newPage)
);

watch(
  () => props.itemsPerPage,
  (newItemsPerPage) => (localItemsPerPage.value = newItemsPerPage)
);

// Métodos
function updatePage(newPage: number) {
  emits('update:page', newPage);
}

function updateItemsPerPage(newItemsPerPage: number) {
  emits('update:items-per-page', newItemsPerPage);
}
</script>
