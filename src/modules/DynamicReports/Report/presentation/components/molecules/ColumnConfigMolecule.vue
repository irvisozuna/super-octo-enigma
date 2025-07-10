<!-- ColumnConfigMolecule.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

// Atoms
import IconButtonAtom from '../atoms/IconButtonAtom.vue'

interface FieldConfig {
  field: string
  alias: string
  type: string
  visible?: boolean
  width?: number
  align?: 'left' | 'center' | 'right'
}

interface Props {
  visibleColumns: string[]
  availableColumns: FieldConfig[]
  frozenColumns: string[]
}

interface Emits {
  columnVisibilityUpdate: [columns: string[]]
  columnFreeze: [field: string]
  columnResize: [field: string, width: number]
  columnReorder: [fromIndex: number, toIndex: number]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const showMenu = ref(false)
const searchQuery = ref('')

const filteredColumns = computed(() => {
  if (!searchQuery.value)
    return props.availableColumns

  const query = searchQuery.value.toLowerCase()

  return props.availableColumns.filter(column =>
    column.alias.toLowerCase().includes(query)
    || column.field.toLowerCase().includes(query),
  )
})

const visibleColumnsSet = computed(() => new Set(props.visibleColumns))
const frozenColumnsSet = computed(() => new Set(props.frozenColumns))

const toggleColumnVisibility = (field: string): void => {
  const newVisible = visibleColumnsSet.value.has(field)
    ? props.visibleColumns.filter(col => col !== field)
    : [...props.visibleColumns, field]

  emit('columnVisibilityUpdate', newVisible)
}

const toggleColumnFreeze = (field: string): void => {
  emit('columnFreeze', field)
}

const handleSelectAll = (): void => {
  const allFields = props.availableColumns.map(col => col.field)

  emit('columnVisibilityUpdate', allFields)
}

const handleSelectNone = (): void => {
  emit('columnVisibilityUpdate', [])
}

const getColumnIcon = (column: FieldConfig): string => {
  switch (column.type) {
    case 'number':
    case 'integer':
    case 'double':
      return 'tabler-123'
    case 'date':
    case 'datetime':
      return 'tabler-calendar'
    case 'boolean':
      return 'tabler-toggle-left'
    case 'text':
    case 'varchar':
      return 'tabler-abc'
    default:
      return 'tabler-column'
  }
}
</script>

<template>
  <div class="column-config-molecule">
    <VMenu
      v-model="showMenu"
      :close-on-content-click="false"
      location="bottom end"
      min-width="320"
      max-width="400"
    >
      <template #activator="{ props: menuProps }">
        <IconButtonAtom
          icon="tabler-columns"
          :tooltip="t('reports.columns.configure')"
          v-bind="menuProps"
        />
      </template>

      <VCard class="column-config-card">
        <!-- Header -->
        <VCardTitle class="d-flex align-center justify-space-between pa-3 pb-2">
          <span class="text-subtitle-1 font-weight-medium">
            {{ t('reports.columns.title') }}
          </span>
          <IconButtonAtom
            icon="tabler-x"
            size="small"
            variant="text"
            @click="showMenu = false"
          />
        </VCardTitle>

        <!-- Search -->
        <VCardText class="pa-3 pt-0">
          <VTextField
            v-model="searchQuery"
            :placeholder="t('reports.columns.search')"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          >
            <template #prepend-inner>
              <VIcon
                icon="tabler-search"
                size="16"
              />
            </template>
          </VTextField>
        </VCardText>

        <!-- Quick Actions -->
        <VCardText class="pa-3 pt-0">
          <div class="d-flex gap-2">
            <VBtn
              size="small"
              variant="text"
              @click="handleSelectAll"
            >
              {{ t('reports.columns.selectAll') }}
            </VBtn>
            <VBtn
              size="small"
              variant="text"
              @click="handleSelectNone"
            >
              {{ t('reports.columns.selectNone') }}
            </VBtn>
          </div>
        </VCardText>

        <!-- Columns List -->
        <VCardText class="pa-0">
          <VList
            density="compact"
            class="column-list"
            max-height="300"
            style="overflow-y: auto;"
          >
            <VListItem
              v-for="column in filteredColumns"
              :key="column.field"
              class="column-item"
            >
              <!-- Visibility Checkbox -->
              <template #prepend>
                <VCheckbox
                  :model-value="visibleColumnsSet.has(column.field)"
                  hide-details
                  density="compact"
                  color="primary"
                  @update:model-value="toggleColumnVisibility(column.field)"
                />
              </template>

              <!-- Column Info -->
              <VListItemTitle class="d-flex align-center">
                <VIcon
                  :icon="getColumnIcon(column)"
                  size="16"
                  class="me-2"
                  :color="visibleColumnsSet.has(column.field) ? 'primary' : 'disabled'"
                />

                <div class="flex-grow-1">
                  <div class="text-body-2 font-weight-medium">
                    {{ column.alias }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ column.field }} • {{ column.type }}
                  </div>
                </div>
              </VListItemTitle>

              <!-- Actions -->
              <template #append>
                <div class="d-flex align-center gap-1">
                  <!-- Freeze Toggle -->
                  <IconButtonAtom
                    :icon="frozenColumnsSet.has(column.field) ? 'tabler-pin-filled' : 'tabler-pin'"
                    :color="frozenColumnsSet.has(column.field) ? 'primary' : undefined"
                    :tooltip="frozenColumnsSet.has(column.field)
                      ? t('reports.columns.unfreeze')
                      : t('reports.columns.freeze')"
                    size="small"
                    variant="text"
                    @click="toggleColumnFreeze(column.field)"
                  />

                  <!-- Drag Handle -->
                  <VIcon
                    icon="tabler-grip-vertical"
                    size="16"
                    color="disabled"
                    class="drag-handle"
                  />
                </div>
              </template>
            </VListItem>

            <!-- Empty State -->
            <VListItem v-if="filteredColumns.length === 0">
              <VListItemTitle class="text-center text-medium-emphasis">
                {{ t('reports.columns.noResults') }}
              </VListItemTitle>
            </VListItem>
          </VList>
        </VCardText>

        <!-- Footer -->
        <VCardActions class="pa-3 pt-0">
          <div class="text-caption text-medium-emphasis">
            {{ t('reports.columns.selected', {
              count: props.visibleColumns.length,
              total: props.availableColumns.length,
            }) }}
          </div>
          <VSpacer />
          <VBtn
            size="small"
            variant="text"
            @click="showMenu = false"
          >
            {{ t('common.done') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VMenu>
  </div>
</template>

<style scoped>
.column-config-molecule {
  display: inline-flex;
}

.column-config-card {
  border: 1px solid rgb(var(--v-theme-outline-variant));
  box-shadow: 0 8px 24px rgba(0, 0, 0, 12%);
}

.column-list {
  border-block-start: 1px solid rgb(var(--v-theme-outline-variant));
}

.column-item {
  border-block-end: 1px solid rgba(var(--v-theme-outline-variant), 0.5);
  transition: background-color 0.2s ease;
}

.column-item:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.column-item:last-child {
  border-block-end: none;
}

.drag-handle {
  cursor: grab;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.drag-handle:hover {
  opacity: 0.8;
}

.drag-handle:active {
  cursor: grabbing;
}

/* Checkbox styling */
.column-item :deep(.v-checkbox) {
  margin-inline-end: 8px;
}

/* Smooth transitions */
.column-item * {
  transition: color 0.2s ease;
}

/* Focus management */
.column-item:focus-within {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .column-config-card {
    max-inline-size: 90vw;
  }

  .column-item .text-caption {
    display: none;
  }
}
</style>
