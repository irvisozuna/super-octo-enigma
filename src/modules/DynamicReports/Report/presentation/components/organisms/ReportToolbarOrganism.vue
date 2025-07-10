<!-- ReportToolbarOrganism.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

// Molecules
import TabsHeaderMolecule from '../molecules/TabsHeaderMolecule.vue'
import SearchFieldMolecule from '../molecules/SearchFieldMolecule.vue'
import DensityToggleMolecule from '../molecules/DensityToggleMolecule.vue'
import ColumnConfigMolecule from '../molecules/ColumnConfigMolecule.vue'

// Atoms
import IconButtonAtom from '../atoms/IconButtonAtom.vue'

import type { DensityType, FieldConfigDTO, ViewModeType } from '../../Application/DTOs/ReportDTOs'

interface Props {
  viewMode: ViewModeType
  density: DensityType
  showFilters: boolean
  quickSearch: string
  visibleColumns: string[]
  availableColumns: FieldConfigDTO[]
  frozenColumns: string[]
}

interface Emits {
  'update:viewMode': [mode: ViewModeType]
  'update:density': [density: DensityType]
  'update:showFilters': [show: boolean]
  'update:quickSearch': [query: string]
  viewModeChange: [mode: ViewModeType]
  densityChange: [density: DensityType]
  quickSearchUpdate: [query: string]
  columnVisibilityUpdate: [columns: string[]]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const viewTabs = computed(() => [
  {
    value: 'table' as ViewModeType,
    label: t('reports.viewModes.table'),
    icon: 'tabler-table',
  },
  {
    value: 'card' as ViewModeType,
    label: t('reports.viewModes.card'),
    icon: 'tabler-cards',
  },
  {
    value: 'chart' as ViewModeType,
    label: t('reports.viewModes.chart'),
    icon: 'tabler-chart-bar',
  },
])

const densityOptions = computed(() => [
  {
    value: 'comfortable' as DensityType,
    icon: 'tabler-line-height',
    tooltip: t('reports.density.comfortable'),
  },
  {
    value: 'default' as DensityType,
    icon: 'tabler-menu-2',
    tooltip: t('reports.density.default'),
  },
  {
    value: 'compact' as DensityType,
    icon: 'tabler-list',
    tooltip: t('reports.density.compact'),
  },
])

const handleViewModeChange = (mode: ViewModeType): void => {
  emit('update:viewMode', mode)
  emit('viewModeChange', mode)
}

const handleDensityChange = (density: DensityType): void => {
  emit('update:density', density)
  emit('densityChange', density)
}

const handleSearchChange = (query: string): void => {
  emit('update:quickSearch', query)
  emit('quickSearchUpdate', query)
}

const handleFiltersToggle = (): void => {
  emit('update:showFilters', !props.showFilters)
}

const handleColumnVisibilityChange = (columns: string[]): void => {
  emit('columnVisibilityUpdate', columns)
}
</script>

<template>
  <VCard
    class="report-toolbar mb-4"
    elevation="0"
    variant="outlined"
  >
    <VCardText class="pa-0">
      <VContainer
        fluid
        class="py-2"
      >
        <VRow
          align="center"
          no-gutters
        >
          <!-- View Mode Tabs -->
          <VCol
            cols="auto"
            class="me-4"
          >
            <TabsHeaderMolecule
              :model-value="viewMode"
              :tabs="viewTabs"
              density="compact"
              @update:model-value="handleViewModeChange"
            />
          </VCol>

          <!-- Density Toggle -->
          <VCol
            cols="auto"
            class="me-4"
          >
            <DensityToggleMolecule
              :model-value="density"
              :options="densityOptions"
              @update:model-value="handleDensityChange"
            />
          </VCol>

          <VDivider
            vertical
            class="mx-3"
            style="block-size: 32px;"
          />

          <!-- Filter Toggle -->
          <VCol
            cols="auto"
            class="me-3"
          >
            <IconButtonAtom
              icon="tabler-filter"
              :tooltip="showFilters
                ? t('reports.actions.hideFilters')
                : t('reports.actions.showFilters')"
              :color="showFilters ? 'primary' : undefined"
              @click="handleFiltersToggle"
            />
          </VCol>

          <!-- Quick Search -->
          <VCol
            cols="auto"
            class="me-3"
            style=" max-inline-size: 300px;min-inline-size: 200px;"
          >
            <SearchFieldMolecule
              :model-value="quickSearch"
              :placeholder="t('reports.search.placeholder')"
              density="compact"
              @update:model-value="handleSearchChange"
            />
          </VCol>

          <!-- Column Configuration -->
          <VCol cols="auto">
            <ColumnConfigMolecule
              :visible-columns="visibleColumns"
              :available-columns="availableColumns"
              :frozen-columns="frozenColumns"
              @column-visibility-update="handleColumnVisibilityChange"
            />
          </VCol>
        </VRow>
      </VContainer>
    </VCardText>
  </VCard>
</template>

<style scoped>
.report-toolbar {
  border: 1px solid rgb(var(--v-theme-outline-variant));
  background-color: rgb(var(--v-theme-surface-variant));
}

@media (max-width: 968px) {
  .report-toolbar .v-row {
    flex-direction: column;
    gap: 8px;
  }

  .report-toolbar .v-col {
    inline-size: 100%;
    max-inline-size: none !important;
    min-inline-size: unset !important;
  }
}
</style>
