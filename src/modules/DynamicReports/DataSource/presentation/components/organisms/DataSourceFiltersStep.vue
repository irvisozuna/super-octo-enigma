<script setup lang="ts">
import { computed, watch } from 'vue'
import { useWizardPreviewStore } from '@/stores/wizardPreview.store'
import Draggable from 'vuedraggable'
import { useSqlExpressionPreview } from '@/composables/useSqlExpressionPreview'
import FilterGroup from './FilterGroup.vue'
import type { Filter, GroupBy, Sorting, TableColumn, WizardData } from '@/modules/DynamicReports/domain/wizardData'

const emit = defineEmits(['next', 'back'])

const wizardPreviewStore = useWizardPreviewStore()

// Simple id generator for sorting items
let sortingId = 1
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID)
    return crypto.randomUUID()

  return `sort-${sortingId++}`
}

// Filtros y sorting: el store es la única fuente de la verdad
const filters = computed<Filter[]>({
  get: () => wizardPreviewStore.wizardData.filters || [],
  set: val => wizardPreviewStore.updateWizardData({ filters: val }),
})

const sorting = computed<Sorting[]>({
  get: () => wizardPreviewStore.wizardData.sorting || [],
  set: val => wizardPreviewStore.updateWizardData({ sorting: [...val.map(s => ({ ...s, id: s.id || generateId() }))] }),
})

const groupBy = computed<GroupBy[]>({
  get: () => wizardPreviewStore.wizardData.groupBy || [],
  set: val => wizardPreviewStore.updateWizardData({ groupBy: val }),
})

const { buildWhereClause, buildOrderByClause, buildGroupByClause } = useSqlExpressionPreview()

// Computed para acceder al wizardData en el template
const wizardData = computed<WizardData>(() => wizardPreviewStore.wizardData)

// Función para generar alias de tabla
function generateTableAlias(tableName: string, index: number = 0): string {
  const words = tableName.split('_')
  const alias = words.map(word => word.substring(0, 3)).join('').toLowerCase()

  return index === 0 ? alias : `${alias}${index}`
}

// Campos disponibles para filtros y ordenamiento
const availableFields = computed<TableColumn[]>(() => {
  const wd = wizardData.value
  if (wd.type === 'table') {
    let fields: TableColumn[] = [...(wd.tableColumns || [])]
    const mainTableAlias = generateTableAlias(wd.table)

    fields = fields.map(col => ({
      ...col,
      displayName: typeof col.displayName === 'string' && col.displayName.length > 0
        ? col.displayName
        : `${mainTableAlias}.${col.name}`,
      name: `${mainTableAlias}.${col.name}`,
    }))
    if (wd.joins && wd.joins.length > 0) {
      wd.joins.forEach(join => {
        if (join.table && wd.joinColumns && wd.joinColumns[join.table]) {
          const joinAlias = join.alias || generateTableAlias(join.table)

          const joinFields = wd.joinColumns[join.table].map((col: TableColumn) => ({
            ...col,
            name: `${joinAlias}.${col.name}`,
            displayName: `${joinAlias}.${col.name}`,
          }))

          fields = [...fields, ...joinFields]
        }
      })
    }

    return fields
  }

  return []
})

// Campos disponibles para GROUP BY (solo campos no agregados)
const availableGroupByFields = computed<TableColumn[]>(() => {
  const wd = wizardData.value
  if (wd.type === 'table' && wd.selectedFields) {
    // Solo campos que no tienen agregación
    return wd.selectedFields
      .filter(field => !field.aggregation)
      .map(field => ({
        name: field.field,
        displayName: field.alias || field.field,
      }))
  }

  return []
})

const operators = [
  { value: '=', label: 'Igual a' },
  { value: '!=', label: 'Diferente a' },
  { value: '>', label: 'Mayor que' },
  { value: '<', label: 'Menor que' },
  { value: '>=', label: 'Mayor o igual que' },
  { value: '<=', label: 'Menor o igual que' },
  { value: 'LIKE', label: 'Contiene' },
  { value: 'NOT LIKE', label: 'No contiene' },
  { value: 'IN', label: 'Está en lista' },
  { value: 'NOT IN', label: 'No está en lista' },
  { value: 'BETWEEN', label: 'Entre' },
  { value: 'IS NULL', label: 'Es nulo' },
  { value: 'IS NOT NULL', label: 'No es nulo' },
]

const sortDirections = [
  { value: 'ASC', label: 'Ascendente' },
  { value: 'DESC', label: 'Descendente' },
]

function addSorting() {
  const firstField = availableFields.value[0]?.name || ''

  sorting.value = [
    ...sorting.value,
    { id: generateId(), field: firstField, direction: 'ASC' },
  ]
}

function removeSorting(index: number) {
  sorting.value = sorting.value.filter((_, i) => i !== index)
}

function moveSorting(idx: number, direction: 'up' | 'down') {
  const arr = [...sorting.value]
  if (direction === 'up' && idx > 0)
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
  else if (direction === 'down' && idx < arr.length - 1)
    [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]]
  sorting.value = arr
}

function addGroupBy() {
  const firstField = availableGroupByFields.value[0]?.name || ''

  groupBy.value = [
    ...groupBy.value,
    { id: generateId(), field: firstField },
  ]
}

function removeGroupBy(index: number) {
  groupBy.value = groupBy.value.filter((_, i) => i !== index)
}

function moveGroupBy(idx: number, direction: 'up' | 'down') {
  const arr = [...groupBy.value]
  if (direction === 'up' && idx > 0)
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
  else if (direction === 'down' && idx < arr.length - 1)
    [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]]
  groupBy.value = arr
}

function nextStep() {
  emit('next')
}

function backStep() {
  emit('back')
}

watch(availableFields, fields => {
  const cleaned = sorting.value.map(s => {
    if (s.field && !fields.some(f => f.name === s.field))
      return { ...s, field: '' }

    return s
  })

  // Solo actualiza si hay cambios reales
  const changed = cleaned.some((s, i) => s.field !== sorting.value[i].field)
  if (changed)
    sorting.value = cleaned
})

watch(availableGroupByFields, fields => {
  const cleaned = groupBy.value.map(g => {
    if (g.field && !fields.some(f => f.name === g.field))
      return { ...g, field: '' }

    return g
  })

  // Solo actualiza si hay cambios reales
  const changed = cleaned.some((g, i) => g.field !== groupBy.value[i].field)
  if (changed)
    groupBy.value = cleaned
})
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12">
        <VCard
          variant="outlined"
          class="mb-4"
        >
          <VCardTitle class="text-h6">
            <VIcon
              icon="mdi-database"
              class="me-2"
            />
            Resumen de Conexión
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol cols="6">
                <div class="text-caption">
                  Conexión:
                </div>
                <div class="text-body-1">
                  {{ wizardData.connection_name }}
                </div>
              </VCol>
              <VCol cols="6">
                <div class="text-caption">
                  Campos seleccionados:
                </div>
                <div class="text-body-1">
                  {{ wizardData.selectedFields?.length || 0 }} campos
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Filtros Avanzados con Paneles Expansibles -->
      <VCol cols="12">
        <VCard
          variant="outlined"
          class="mb-4"
        >
          <VCardTitle class="text-h6 d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <VIcon
                icon="mdi-filter-variant"
                class="me-2"
              />
              Filtros y Condiciones
            </div>
          </VCardTitle>
          <VCardText>
            <FilterGroup
              v-model="filters"
              :available-fields="availableFields"
              :operators="operators"
              :depth="0"
            />
            <div
              v-if="!filters || filters.length === 0"
              class="text-center pa-4 text-grey"
            >
              <VIcon
                icon="mdi-filter-off"
                size="large"
                class="mb-2"
              />
              <div>No hay filtros configurados</div>
              <div class="text-caption">
                Agrega filtros o grupos para definir las condiciones de búsqueda
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Preview WHERE generado -->
      <VCol cols="12">
        <div
          v-if="filters && filters.length"
          style=" padding: 16px; border-radius: 6px;background: #f8f9fa; font-family: monospace; font-size: 1rem; margin-block-end: 16px;"
        >
          <span style="color: #888;">WHERE</span>
          <br>
          <span style="white-space: pre-line;">{{ buildWhereClause(filters) }}</span>
        </div>
        <div
          v-else
          style="color: #aaa; font-style: italic; margin-block-end: 16px;"
        >
          No hay condiciones configuradas.
        </div>
      </VCol>

      <!-- Ordenamiento -->
      <VCol cols="12">
        <VCard
          variant="outlined"
          class="mt-4"
        >
          <VCardTitle class="text-h6">
            <VIcon
              icon="mdi-sort"
              class="me-2"
            />
            Ordenamiento
          </VCardTitle>
          <VCardText>
            <Draggable
              v-model="sorting"
              :item-key="(item: Sorting) => item.id"
              handle=".drag-handle"
              ghost-class="ghost-item"
              chosen-class="chosen-item"
              class="sorting-list"
            >
              <template #item="{ element: sort, index: idx }">
                <div
                  class="mb-2 sorting-item d-flex align-center pa-2"
                  style=" border: 1px solid #eee; border-radius: 8px;background: #fff;"
                >
                  <VIcon
                    icon="tabler-drag-drop"
                    class="drag-handle me-2"
                    color="grey"
                    style="cursor: grab;"
                  />
                  <VRow
                    align="center"
                    class="flex-grow-1"
                  >
                    <VCol cols="5">
                      <VAutocomplete
                        v-model="sort.field"
                        :items="availableFields"
                        item-title="displayName"
                        item-value="name"
                        label="Campo"
                      />
                    </VCol>
                    <VCol cols="5">
                      <VSelect
                        v-model="sort.direction"
                        :items="sortDirections"
                        item-title="label"
                        item-value="value"
                        label="Dirección"
                      />
                    </VCol>
                    <VCol
                      cols="2"
                      class="d-flex align-center"
                    >
                      <VBtn
                        icon="tabler-arrow-up"
                        size="x-small"
                        variant="text"
                        :disabled="idx === 0"
                        @click="moveSorting(idx, 'up')"
                      />
                      <VBtn
                        icon="tabler-arrow-down"
                        size="x-small"
                        variant="text"
                        :disabled="idx === sorting.length - 1"
                        @click="moveSorting(idx, 'down')"
                      />
                      <VBtn
                        icon="tabler-trash"
                        color="error"
                        variant="text"
                        @click="removeSorting(idx)"
                      />
                    </VCol>
                  </VRow>
                </div>
              </template>
            </Draggable>
            <VBtn
              prepend-icon="mdi-plus"
              variant="outlined"
              @click="addSorting"
            >
              Agregar Ordenamiento
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Preview ORDER BY generado -->
      <VCol cols="12">
        <div
          v-if="sorting && sorting.length"
          style=" padding: 16px; border-radius: 6px;background: #f8f9fa; font-family: monospace; font-size: 1rem; margin-block-end: 16px;"
        >
          <span style="color: #888;">ORDER BY</span>
          <br>
          <span style="white-space: pre-line;">{{ buildOrderByClause(sorting) }}</span>
        </div>
        <div
          v-else
          style="color: #aaa; font-style: italic; margin-block-end: 16px;"
        >
          No hay orden configurado.
        </div>
      </VCol>

      <!-- Agrupación -->
      <VCol cols="12">
        <VCard
          variant="outlined"
          class="mt-4"
        >
          <VCardTitle class="text-h6">
            <VIcon
              icon="mdi-group"
              class="me-2"
            />
            Agrupación (GROUP BY)
          </VCardTitle>
          <VCardText>
            <VAlert
              v-if="availableGroupByFields.length === 0"
              type="info"
              variant="tonal"
              class="mb-4"
            >
              <VIcon
                icon="mdi-information"
                class="me-2"
              />
              No hay campos disponibles para agrupar. Los campos con agregaciones (SUM, COUNT, etc.) no pueden ser agrupados.
            </VAlert>
            <Draggable
              v-model="groupBy"
              :item-key="(item: GroupBy) => item.id"
              handle=".drag-handle"
              ghost-class="ghost-item"
              chosen-class="chosen-item"
              class="groupby-list"
            >
              <template #item="{ element: group, index: idx }">
                <div
                  class="mb-2 groupby-item d-flex align-center pa-2"
                  style=" border: 1px solid #eee; border-radius: 8px;background: #fff;"
                >
                  <VIcon
                    icon="tabler-drag-drop"
                    class="drag-handle me-2"
                    color="grey"
                    style="cursor: grab;"
                  />
                  <VRow
                    align="center"
                    class="flex-grow-1"
                  >
                    <VCol cols="10">
                      <VAutocomplete
                        v-model="group.field"
                        :items="availableGroupByFields"
                        item-title="displayName"
                        item-value="name"
                        label="Campo para agrupar"
                        hint="Solo campos sin agregaciones"
                        persistent-hint
                      />
                    </VCol>
                    <VCol
                      cols="2"
                      class="d-flex align-center"
                    >
                      <VBtn
                        icon="tabler-arrow-up"
                        size="x-small"
                        variant="text"
                        :disabled="idx === 0"
                        @click="moveGroupBy(idx, 'up')"
                      />
                      <VBtn
                        icon="tabler-arrow-down"
                        size="x-small"
                        variant="text"
                        :disabled="idx === groupBy.length - 1"
                        @click="moveGroupBy(idx, 'down')"
                      />
                      <VBtn
                        icon="tabler-trash"
                        color="error"
                        variant="text"
                        @click="removeGroupBy(idx)"
                      />
                    </VCol>
                  </VRow>
                </div>
              </template>
            </Draggable>
            <VBtn
              v-if="availableGroupByFields.length > 0"
              prepend-icon="mdi-plus"
              variant="outlined"
              @click="addGroupBy"
            >
              Agregar Campo para Agrupar
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Preview GROUP BY generado -->
      <VCol cols="12">
        <div
          v-if="groupBy && groupBy.length"
          style=" padding: 16px; border-radius: 6px;background: #f8f9fa; font-family: monospace; font-size: 1rem; margin-block-end: 16px;"
        >
          <span style="color: #888;">GROUP BY</span>
          <br>
          <span style="white-space: pre-line;">{{ buildGroupByClause(groupBy) }}</span>
        </div>
        <div
          v-else
          style="color: #aaa; font-style: italic; margin-block-end: 16px;"
        >
          No hay agrupación configurada.
        </div>
      </VCol>
    </VRow>
    <div class="d-flex justify-space-between mt-6">
      <VBtn
        variant="outlined"
        @click="backStep"
      >
        <VIcon
          icon="tabler-arrow-left"
          class="me-2"
        />
        Anterior
      </VBtn>
      <VBtn
        color="primary"
        @click="nextStep"
      >
        Siguiente
        <VIcon
          icon="tabler-arrow-right"
          class="ms-2"
        />
      </VBtn>
    </div>
  </div>
</template>

<style scoped>
.sorting-list,
.groupby-list {
  min-block-size: 50px;
}

.sorting-item,
.groupby-item {
  transition: all 0.2s ease;
}

.ghost-item {
  border: 2px dashed var(--v-theme-primary) !important;
  background: var(--v-theme-primary-lighten4) !important;
  opacity: 0.5;
}

.chosen-item {
  background: var(--v-theme-primary-lighten3) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 15%) !important;
}
</style>
