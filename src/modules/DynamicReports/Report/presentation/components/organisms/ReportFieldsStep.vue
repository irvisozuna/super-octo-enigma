<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Draggable from 'vuedraggable'

interface Field {
  field: string
  alias: string
  format: 'text' | 'number' | 'currency' | 'date' | 'datetime'
  width: number
  aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX'
  sortable: boolean
  filterable: boolean
  order: number
}

interface Available {
  name: string
  label: string
  type: string
  display_format?: string
  default_width?: number
  sortable?: boolean
}

const props = withDefaults(defineProps<{ modelValue: Field[]; availableFields: Available[] }>(), {
  modelValue: () => [],
  availableFields: () => [],
})

const emit = defineEmits<{ 'update:modelValue': [Field[]] }>()

const { t } = useI18n()
const selectedList = ref<Field[]>([...props.modelValue])

console.log('Montando Paso: ReportFieldsStep')

watch(() => props.modelValue, v => {
  if (JSON.stringify(selectedList.value) !== JSON.stringify(v))
    selectedList.value = [...v]
})
watch(selectedList, v => {
  if (JSON.stringify(v) !== JSON.stringify(props.modelValue))
    emit('update:modelValue', v)
}, { deep: true })

const availableList = computed(() =>
  props.availableFields.filter(
    f => !selectedList.value.some(sel => sel.field === f.name),
  ),
)

function makeField(f: Available): Field {
  return {
    field: f.name,
    alias: f.label || f.name,
    format: (f.display_format as Field['format']) || 'text',
    width: f.default_width || 150,
    aggregation: undefined,
    sortable: f.sortable ?? true,
    filterable: true,
    order: selectedList.value.length,
  }
}

function addFieldToSelected(f: Available) {
  if (!selectedList.value.some(sel => sel.field === f.name))
    selectedList.value = [...selectedList.value, makeField(f)]
}

function removeFieldFromSelected(index: number) {
  selectedList.value = selectedList.value.filter((_, i) => i !== index)
}

const getFieldIcon = (type: string) => {
  switch (type) {
    case 'number':
    case 'decimal':
    case 'int':
    case 'float':
    case 'double':
      return 'tabler-hash'
    case 'currency':
      return 'tabler-currency-dollar'
    case 'date':
    case 'datetime':
      return 'tabler-calendar'
    case 'boolean':
      return 'tabler-check'
    default:
      return 'tabler-letter-a'
  }
}
</script>

<template>
  <div class="dual-list-container">
    <!-- Campos disponibles -->
    <div class="list-card">
      <h3 class="text-h5 font-weight-bold mb-4">
        {{ t('DynamicReports.report.fields.available_fields') }}
      </h3>
      <div class="list">
        <div
          v-for="field in availableList"
          :key="field.name"
          class="list-item available d-flex align-center justify-space-between"
        >
          <div class="d-flex align-center">
            <VIcon
              :icon="getFieldIcon(field.type)"
              size="24"
              color="#888"
              class="me-3"
            />
            <span class="field-label text-body-1">{{ field.label || field.name }}</span>
            <span class="field-name text-caption ms-2">[{{ field.name }}]</span>
          </div>
          <VBtn
            icon="tabler-arrow-right"
            color="primary"
            variant="text"
            @click="addFieldToSelected(field)"
          />
        </div>
      </div>
    </div>
    <!-- Campos seleccionados -->
    <div class="list-card">
      <h3 class="text-h5 font-weight-bold mb-4">
        {{ t('DynamicReports.report.fields.selected_fields') }}
      </h3>
      <Draggable
        v-model="selectedList"
        :group="{ name: 'selected-fields', pull: false, put: false }"
        item-key="field"
        class="list"
        ghost-class="ghost-item"
        chosen-class="chosen-item"
      >
        <template #item="{ element, index }">
          <div class="list-item selected d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <VIcon
                icon="tabler-drag-drop"
                size="24"
                color="#b0b0b0"
                class="me-3 drag-handle"
              />
              <span class="field-label text-body-1">{{ element.alias }}</span>
              <span class="field-name text-caption ms-2">[{{ element.field }}]</span>
            </div>
            <VBtn
              icon="tabler-arrow-left"
              color="secondary"
              variant="text"
              @click="removeFieldFromSelected(index)"
            />
          </div>
        </template>
      </Draggable>
    </div>
  </div>
</template>

<style scoped>
.dual-list-container {
  display: flex;
  gap: 24px;
}

.list-card {
  flex: 1;
  padding: 16px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 10%);
}

.list {
  display: flex;
  flex-direction: column;
  padding: 4px;
  gap: 8px;
  max-block-size: 60vh;
  overflow-y: auto;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  background: #f9f9f9;
  cursor: grab;
  transition: background 0.2s;
}

.list-item:hover {
  background: #e3f2fd;
}

.list-item.selected {
  /* background: #e8f5e9; */
  cursor: default;
}

.ghost-item {
  border: 2px dashed var(--v-theme-primary) !important;
  opacity: 0.5 !important;
}

.chosen-item {
  background: var(--v-theme-primary-lighten3) !important;
}

h3 {
  margin-block-end: 8px;
}
</style>
