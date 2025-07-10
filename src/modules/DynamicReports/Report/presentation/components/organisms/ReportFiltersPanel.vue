<script setup lang="ts">
import { computed } from 'vue'
import ReportFiltersPreview from '../molecules/ReportFiltersPreview.vue'

const props = defineProps<{
  modelValue: boolean
  appliedFilters: any[]
  reportConfig: any
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'remove-filter', field: string): void
  (e: 'update:filters', filters: any[]): void
  (e: 'apply-filters'): void
  (e: 'clear-filters'): void
}>()

const drawerValue = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

function getFieldConfig(fieldName: string) {
  return props.reportConfig?.selectedFields?.find((f: any) => f.field === fieldName)
}
</script>

<template>
  <VNavigationDrawer
    v-model="drawerValue"
    :width="360"
    location="left"
    temporary
    class="filter-panel"
  >
    <VCard
      class="mb-0"
      variant="outlined"
    >
      <VCardText>
        <VRow>
          <VCol cols="12">
            <div class="d-flex align-center justify-space-between mb-2">
              <h6 class="text-h6 font-weight-medium mb-0">
                <VIcon
                  icon="tabler-filter"
                  start
                  class="me-1"
                />
                Filtros disponibles
              </h6>
              <VChip
                v-if="appliedFilters.length"
                size="small"
                variant="tonal"
                color="primary"
              >
                <VIcon
                  icon="tabler-check"
                  size="16"
                  start
                />
                {{ appliedFilters.length }} activos
              </VChip>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Refina los resultados del reporte usando los filtros configurados.
            </p>
          </VCol>
        </VRow>
        <!-- Chips de filtros activos -->
        <div
          v-if="appliedFilters.length > 0"
          class="mb-4"
        >
          <VChip
            v-for="filter in appliedFilters"
            :key="filter.field"
            closable
            size="small"
            class="ma-1"
            color="primary"
            variant="elevated"
            @click:close="$emit('remove-filter', filter.field)"
          >
            <VIcon
              icon="tabler-filter"
              start
              size="16"
            />
            {{ getFieldConfig(filter.field)?.alias || filter.field }}: {{ filter.value }}
          </VChip>
        </div>
        <!-- Filtros disponibles usando el componente reutilizable -->
        <ReportFiltersPreview
          v-if="reportConfig?.filters"
          :filters="reportConfig.filters"
          :readonly="false"
          :loading="loading"
          @update:filters="$emit('update:filters', $event)"
          @apply-filters="$emit('apply-filters')"
          @clear-filters="$emit('clear-filters')"
        />
        <VAlert
          v-else
          type="info"
          variant="tonal"
          density="compact"
        >
          <template #prepend>
            <VIcon icon="tabler-info-circle" />
          </template>
          <div>
            <strong>Sin filtros configurados</strong>
            <p class="mb-0 mt-1">
              Este reporte no tiene filtros configurados. Se mostrarán todos los datos disponibles.
            </p>
          </div>
        </VAlert>
      </VCardText>
    </VCard>
  </VNavigationDrawer>
</template>
