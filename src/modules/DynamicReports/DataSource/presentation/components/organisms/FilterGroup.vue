<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { VAutocomplete, VBtn, VCard, VCardText, VCardTitle, VCol, VExpansionPanel, VExpansionPanelText, VExpansionPanelTitle, VExpansionPanels, VIcon, VRow, VSpacer, VTextField } from 'vuetify/components'
import Draggable from 'vuedraggable'

const props = defineProps<{
  modelValue: any[] // [{ field, operator, value }, { group: [], logic: 'AND' }]
  availableFields: { name: string; displayName: string }[]
  operators?: { value: string; label: string }[]
  depth?: number
}>()

const emit = defineEmits(['update:modelValue'])

// Fallback simple id generator
let fallbackId = 1
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID)
    return crypto.randomUUID()

  return `fgroup-${fallbackId++}`
}

const { t } = useI18n()

const localGroup = computed({
  get: () => {
    return props.modelValue || []
  },
  set: value => {
    emit('update:modelValue', value)
  },
})

const logic = ref('AND')

onMounted(() => {
  const depth = props.depth || 0
  if (depth > 0 && Array.isArray(props.modelValue)) {
    // Buscar la lógica en el primer elemento que tenga la propiedad logic
    const itemWithLogic = props.modelValue.find(item => item && typeof item === 'object' && 'logic' in item)
    if (itemWithLogic?.logic)
      logic.value = itemWithLogic.logic
  }
})

watch(logic, val => {
  const depth = props.depth || 0
  if (depth > 0 && Array.isArray(props.modelValue)) {
    // Crear una copia del array y agregar la lógica al primer elemento
    const newValue = [...localGroup.value]
    if (newValue.length > 0)
      newValue[0] = { ...newValue[0], logic: val }

    emit('update:modelValue', newValue)
  }
})

const operatorOptions = computed(() => props.operators || [
  { value: '=', label: 'Igual a' },
  { value: '!=', label: 'Diferente a' },
  { value: '>', label: 'Mayor que' },
  { value: '<', label: 'Menor que' },
  { value: '>=', label: 'Mayor o igual que' },
  { value: '<=', label: 'Menor o igual que' },
  { value: 'LIKE', label: 'Contiene' },
  { value: 'IN', label: 'Está en lista' },
])

function addFilter() {
  const newGroup = [...localGroup.value]
  const filter = { id: generateId(), field: '', operator: '=', value: '' }
  if (newGroup.length === 0)
    newGroup.push(filter)
  else
    newGroup.push({ ...filter, logic: 'AND' })
  localGroup.value = newGroup
}

function removeFilter(idx: number) {
  const newGroup = [...localGroup.value]

  newGroup.splice(idx, 1)
  localGroup.value = newGroup
}

function addGroup() {
  const newGroup = [...localGroup.value]
  const group = { id: generateId(), group: [], logic: undefined }
  if (newGroup.length === 0)
    newGroup.push(group)
  else
    newGroup.push({ ...group, logic: 'AND' })
  localGroup.value = newGroup
}

function removeGroup(idx: number) {
  const newGroup = [...localGroup.value]

  newGroup.splice(idx, 1)
  localGroup.value = newGroup
}

function moveItem(idx: number, direction: 'up' | 'down') {
  const newGroup = [...localGroup.value]
  if (direction === 'up' && idx > 0)
    [newGroup[idx - 1], newGroup[idx]] = [newGroup[idx], newGroup[idx - 1]]
  else if (direction === 'down' && idx < newGroup.length - 1)
    [newGroup[idx + 1], newGroup[idx]] = [newGroup[idx], newGroup[idx + 1]]
  localGroup.value = newGroup
}

function updateFilter(idx: number, field: string, value: any) {
  const newGroup = [...localGroup.value]
  if (field === 'operator' && (value === 'IS NULL' || value === 'IS NOT NULL'))
    newGroup[idx] = { ...newGroup[idx], [field]: value, value: '' }
  else
    newGroup[idx] = { ...newGroup[idx], [field]: value }
  localGroup.value = newGroup
}

function updateFilterLogic(idx: number, value: string) {
  const newGroup = [...localGroup.value]

  newGroup[idx].logic = value
  localGroup.value = newGroup
}
</script>

<template>
  <VCard
    :variant="(props.depth || 0) === 0 ? 'outlined' : 'tonal'"
    class="mb-2"
    :style="(props.depth || 0) > 0 ? `background: var(--v-theme-primary-lighten4, #e3e8fd); margin-left: ${(props.depth || 0) * 24}px; border: 1.5px solid var(--v-theme-primary);` : ''"
  >
    <VCardTitle
      v-if="(props.depth || 0) === 0"
      class="text-h6 d-flex align-center"
    >
      <VIcon
        icon="tabler-folder"
        class="me-2"
      />
      Grupo principal
    </VCardTitle>
    <VCardText>
      <VRow
        align="center"
        class="mb-2"
      >
        <VCol cols="auto">
          <VBtn
            size="small"
            variant="outlined"
            prepend-icon="tabler-plus"
            @click="addFilter"
          >
            Filtro
          </VBtn>
        </VCol>
        <VCol
          v-if="((props.depth || 0)) < 2"
          cols="auto"
        >
          <VBtn
            size="small"
            variant="outlined"
            prepend-icon="tabler-plus"
            @click="addGroup"
          >
            Grupo
          </VBtn>
        </VCol>
      </VRow>
      <Draggable
        v-model="localGroup"
        item-key="id"
        handle=".drag-handle"
        ghost-class="ghost-item"
        chosen-class="chosen-item"
        class="filter-items-container"
      >
        <template #item="{ element, index }">
          <VExpansionPanels
            v-model="element._expanded"
            multiple
            class="mb-2"
            style=" padding: 0; border: none; margin: 0;background: transparent; box-shadow: none;"
          >
            <VExpansionPanel :value="0">
              <VExpansionPanelTitle class="d-flex align-center">
                <VIcon
                  icon="tabler-drag-drop"
                  class="drag-handle me-2"
                  color="grey"
                  style="cursor: grab;"
                />
                <VIcon
                  :icon="element.group ? 'tabler-folder' : 'tabler-filter'"
                  class="me-2"
                  color="primary"
                />
                <span class="font-weight-medium me-2">{{ element.group ? 'Grupo' : 'Filtro' }}</span>
                <VSpacer />
                <VBtn
                  icon="tabler-arrow-up"
                  size="x-small"
                  variant="text"
                  :disabled="index === 0"
                  @click.stop="moveItem(index, 'up')"
                />
                <VBtn
                  icon="tabler-arrow-down"
                  size="x-small"
                  variant="text"
                  :disabled="index === localGroup.length - 1"
                  @click.stop="moveItem(index, 'down')"
                />
                <VBtn
                  icon="tabler-trash"
                  color="error"
                  size="x-small"
                  variant="text"
                  class="ms-1"
                  @click.stop="element.group ? removeGroup(index) : removeFilter(index)"
                />
              </VExpansionPanelTitle>
              <VExpansionPanelText>
                <template v-if="element.group">
                  <FilterGroup
                    v-model="element.group"
                    :available-fields="availableFields"
                    :operators="operatorOptions"
                    :depth="((props.depth || 0)) + 1"
                  />
                </template>
                <template v-else>
                  <VRow align="center">
                    <VCol
                      v-if="index > 0"
                      cols="2"
                    >
                      <VAutocomplete
                        :model-value="element.logic || 'AND'"
                        :items="[
                          { value: 'AND', label: t('logic.and') },
                          { value: 'OR', label: t('logic.or') },
                        ]"
                        item-title="label"
                        item-value="value"
                        label="Lógica"
                        density="compact"
                        @update:model-value="val => updateFilterLogic(index, val)"
                      />
                    </VCol>
                    <VCol :cols="index > 0 ? 2 : 3">
                      <VAutocomplete
                        :model-value="element.field"
                        :items="availableFields"
                        item-title="displayName"
                        item-value="name"
                        label="Campo"
                        density="compact"
                        @update:model-value="(val) => updateFilter(index, 'field', val)"
                      />
                    </VCol>
                    <VCol cols="2">
                      <VAutocomplete
                        :model-value="element.operator"
                        :items="operatorOptions"
                        item-title="label"
                        item-value="value"
                        label="Operador"
                        density="compact"
                        @update:model-value="(val) => updateFilter(index, 'operator', val)"
                      />
                    </VCol>
                    <VCol cols="4">
                      <!-- BETWEEN: dos campos en horizontal -->
                      <template v-if="element.operator === 'BETWEEN'">
                        <VRow
                          dense
                          no-gutters
                        >
                          <VCol cols="6">
                            <VTextField
                              :model-value="Array.isArray(element.value) ? element.value[0] : ''"
                              label="Valor mínimo"
                              density="compact"
                              @update:model-value="val => {
                                const arr = Array.isArray(element.value) ? [...element.value] : ['', ''];
                                arr[0] = val;
                                updateFilter(index, 'value', arr);
                              }"
                            />
                          </VCol>
                          <VCol cols="6">
                            <VTextField
                              :model-value="Array.isArray(element.value) ? element.value[1] : ''"
                              label="Valor máximo"
                              density="compact"
                              @update:model-value="val => {
                                const arr = Array.isArray(element.value) ? [...element.value] : ['', ''];
                                arr[1] = val;
                                updateFilter(index, 'value', arr);
                              }"
                            />
                          </VCol>
                        </VRow>
                      </template>
                      <!-- Otros operadores: un solo campo -->
                      <VTextField
                        v-else-if="element.operator !== 'IS NULL' && element.operator !== 'IS NOT NULL'"
                        :model-value="element.value"
                        label="Valor"
                        density="compact"
                        @update:model-value="(val) => updateFilter(index, 'value', val)"
                      />
                    </VCol>
                  </VRow>
                </template>
              </VExpansionPanelText>
            </VExpansionPanel>
          </VExpansionPanels>
        </template>
      </Draggable>
    </VCardText>
  </VCard>
</template>

<style scoped>
.font-weight-medium {
  font-weight: 500;
}

.filter-items-container {
  min-block-size: 50px;
}

.filter-item {
  transition: all 0.2s ease;
}

.drag-handle {
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
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
