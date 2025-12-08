<script setup lang="ts">
import { defineEmits, defineProps, ref, watch } from 'vue'

interface Filters {
  search?: string
  role?: string | string[]
  status?: string | null
}

const props = defineProps<{
  initialFilters: Filters
}>()

const emits = defineEmits<{
  'update:filters': [Filters]
}>()

// Estado local de filtros
const filters = ref<Filters>({ ...props.initialFilters })

// Si el padre resetea filtros, se sincroniza aquí
watch(
  () => props.initialFilters,
  newVal => {
    filters.value = { ...newVal }
  },
  { deep: true },
)

// Emite siempre una copia limpia
function emitFilters() {
  emits('update:filters', { ...filters.value })
}
</script>

<template>
  <VCardItem class="pb-4">
    <VCardTitle>
      {{ $t?.('filters') ?? 'Filtros' }}
    </VCardTitle>
  </VCardItem>

  <VCardText>
    <VRow class="gap-y-2">
      <!--
        Slot extra por si el módulo quiere más filtros
        (sector, ruta, lectorista, etc.)
      -->
      <slot
        name="extra"
        :filters="filters"
        :emit-filters="emitFilters"
      />
    </VRow>
  </VCardText>
</template>
