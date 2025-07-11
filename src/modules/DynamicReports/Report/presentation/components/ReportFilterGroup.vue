<script setup lang="ts">
import ReportFilterInput from './ReportFilterInput.vue'

const props = defineProps({
  group: { type: Object, required: true },
  appliedFiltersMap: { type: Object, required: true },
  applyFilter: { type: Function, required: true },
})
</script>

<template>
  <div class="filter-group-visual mb-2 ps-2">
    <div class="d-flex align-center mb-1">
      <VIcon
        icon="tabler-category"
        size="18"
        class="me-1"
      />
      <span class="text-subtitle-2 font-weight-medium">{{ group.alias || 'Grupo de filtros' }}</span>
    </div>
    <div class="d-flex flex-column gap-2 ms-4">
      <template
        v-for="child in group.children"
        :key="child.id"
      >
        <ReportFilterGroup
          v-if="child.type === 'group'"
          :group="child"
          :applied-filters-map="appliedFiltersMap"
          :apply-filter="applyFilter"
        />
        <ReportFilterInput
          v-else-if="child.type === 'filter'"
          v-model="appliedFiltersMap[child.field]"
          :filter="child"
          @apply="applyFilter(child, $event)"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.filter-group-visual {
  border-inline-start: 2px solid #e0e0e0;
  margin-block-end: 12px;
  padding-inline-start: 12px;
}
</style>
