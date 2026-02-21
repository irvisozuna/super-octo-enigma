<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  showApply?: boolean
  showClear?: boolean
}>(), {
  title: 'Filtros',
  showApply: true,
  showClear: true,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'apply'): void
  (event: 'clear'): void
}>()

const drawerOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const closeDrawer = () => {
  drawerOpen.value = false
}

const applyFilters = () => {
  emit('apply')
}

const clearFilters = () => {
  emit('clear')
}
</script>

<template>
  <VNavigationDrawer
    v-model="drawerOpen"
    temporary
    location="right"
    width="360"
    class="filter-drawer"
  >
    <div class="filter-drawer__header">
      <div class="filter-drawer__title">
        {{ title }}
      </div>
      <VBtn
        icon="tabler-x"
        variant="text"
        @click="closeDrawer"
      />
    </div>

    <VDivider />

    <div class="filter-drawer__body">
      <slot />
    </div>

    <VDivider />

    <div class="filter-drawer__footer">
      <VBtn
        v-if="showClear"
        variant="text"
        color="secondary"
        @click="clearFilters"
      >
        Limpiar
      </VBtn>
      <VSpacer />
      <VBtn
        v-if="showApply"
        color="primary"
        variant="tonal"
        @click="applyFilters"
      >
        Aplicar
      </VBtn>
    </div>
  </VNavigationDrawer>
</template>

<style scoped lang="scss">
.filter-drawer {
  display: flex;
  flex-direction: column;
}

.filter-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 12px;
}

.filter-drawer__title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}

.filter-drawer__body {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-drawer__footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px 16px;
}
</style>
