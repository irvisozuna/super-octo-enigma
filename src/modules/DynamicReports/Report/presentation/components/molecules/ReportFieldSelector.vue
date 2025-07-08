<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useReportValidation } from '@/modules/DynamicReports/Report/presentation/composables/useReportValidation'

// Props
interface Props {
  modelValue: Array<{
    field: string
    alias: string
    format: 'text' | 'number' | 'currency' | 'date' | 'datetime'
    width: number
    aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX'
    sortable: boolean
    filterable: boolean
    order: number
  }>
  availableFields: Array<{
    name: string
    label?: string
    type: string
  }>
  dataSourceId?: string
  loading: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: Props['modelValue']]
  validation: [isValid: boolean]
  next: []
  prev: []
  validate: []
}>()

// Composables
const { t } = useI18n()
const { validateFields, validationErrors } = useReportValidation()

// Estado local
const draggedField = ref<any>(null)
const draggedIndex = ref<number>(-1)

// Computed
const formatOptions = [
  { value: 'text', title: t('DynamicReports.report.format.text') },
  { value: 'number', title: t('DynamicReports.report.format.number') },
  { value: 'currency', title: t('DynamicReports.report.format.currency') },
  { value: 'date', title: t('DynamicReports.report.format.date') },
  { value: 'datetime', title: t('DynamicReports.report.format.datetime') },
]

const aggregationOptions = [
  { value: 'SUM', title: t('DynamicReports.report.aggregation.sum') },
  { value: 'COUNT', title: t('DynamicReports.report.aggregation.count') },
  { value: 'AVG', title: t('DynamicReports.report.aggregation.avg') },
  { value: 'MIN', title: t('DynamicReports.report.aggregation.min') },
  { value: 'MAX', title: t('DynamicReports.report.aggregation.max') },
]

// Métodos
const getFieldIcon = (type: string) => {
  const icons = {
    text: 'tabler-text',
    number: 'tabler-number',
    currency: 'tabler-currency-dollar',
    date: 'tabler-calendar',
    datetime: 'tabler-clock',
    select: 'tabler-list',
    boolean: 'tabler-toggle-right',
  }

  return icons[type as keyof typeof icons] || 'tabler-question'
}

const getFieldColor = (type: string) => {
  const colors = {
    text: 'primary',
    number: 'success',
    currency: 'warning',
    date: 'info',
    datetime: 'info',
    select: 'secondary',
    boolean: 'error',
  }

  return colors[type as keyof typeof colors] || 'grey'
}

const addField = (field: any) => {
  const newField = {
    field: field.name,
    alias: field.label || field.name,
    format: field.type === 'number' ? 'number' : 'text',
    width: 150,
    sortable: true,
    filterable: true,
    order: props.modelValue.length,
  }

  const updatedFields = [...props.modelValue, newField]

  emit('update:modelValue', updatedFields)
  validateFieldsLocal(updatedFields)
}

const removeField = (index: number) => {
  const updatedFields = props.modelValue.filter((_, i) => i !== index)

  // Reordenar
  updatedFields.forEach((field, idx) => {
    field.order = idx
  })
  emit('update:modelValue', updatedFields)
  validateFieldsLocal(updatedFields)
}

const onDragStart = (event: DragEvent, field: any, index?: number) => {
  draggedField.value = field
  draggedIndex.value = index ?? -1
  if (event.dataTransfer)
    event.dataTransfer.effectAllowed = 'move'
}

const onDrop = (event: DragEvent, targetIndex?: number) => {
  event.preventDefault()

  if (!draggedField.value)
    return

  if (draggedIndex.value >= 0) {
    // Reordenar campos seleccionados
    const updatedFields = [...props.modelValue]
    const [removed] = updatedFields.splice(draggedIndex.value, 1)
    const insertIndex = targetIndex ?? updatedFields.length

    updatedFields.splice(insertIndex, 0, removed)

    // Actualizar orden
    updatedFields.forEach((field, idx) => {
      field.order = idx
    })

    emit('update:modelValue', updatedFields)
  }
  else {
    // Agregar nuevo campo
    addField(draggedField.value)
  }

  draggedField.value = null
  draggedIndex.value = -1
}

const validateFieldsLocal = async (fields = props.modelValue) => {
  const errors = await validateFields(fields)
  const isValid = errors.length === 0

  emit('validation', isValid)
}

// Observar cambios en el modelo
watch(() => props.modelValue, validateFieldsLocal, { deep: true })

// Validación inicial
onMounted(() => {
  validateFieldsLocal()
})
</script>

<template>
  <div class="report-field-selector">
    <VSkeletonLoader
      v-if="loading"
      type="table"
    />
    <div v-else>
      <div class="mb-4">
        <h4>Selecciona los campos para el reporte</h4>
        <p>Arrastra para ordenar. Haz clic para agregar.</p>
      </div>
      <VRow>
        <VCol
          cols="12"
          md="6"
        >
          <VList>
            <VListItem
              v-for="field in availableFields"
              :key="field.name"
              @click="addField(field)"
            >
              <VListItemTitle>{{ field.label || field.name }}</VListItemTitle>
              <VListItemSubtitle>{{ field.type }}</VListItemSubtitle>
            </VListItem>
          </VList>
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <h5>Campos seleccionados</h5>
          <VList>
            <VListItem
              v-for="(field, idx) in modelValue"
              :key="field.field"
              @click="removeField(idx)"
            >
              <VListItemTitle>{{ field.alias }}</VListItemTitle>
              <VListItemSubtitle>{{ field.format }}</VListItemSubtitle>
            </VListItem>
          </VList>
        </VCol>
      </VRow>
      <div class="d-flex justify-between mt-4">
        <VBtn
          variant="tonal"
          @click="$emit('prev')"
        >
          Anterior
        </VBtn>
        <VBtn
          color="primary"
          @click="$emit('next')"
        >
          Siguiente
        </VBtn>
      </div>
    </div>

    <!-- Validation Messages -->
    <VAlert
      v-if="validationErrors.length > 0"
      type="warning"
      variant="tonal"
      class="mt-4"
    >
      <template #prepend>
        <VIcon icon="tabler-alert-triangle" />
      </template>
      <div>
        <p class="font-weight-medium mb-2">
          {{ t('validation.fields_errors') }}
        </p>
        <ul class="mb-0">
          <li
            v-for="error in validationErrors"
            :key="error.field"
            class="text-caption"
          >
            {{ error.message }}
          </li>
        </ul>
      </div>
    </VAlert>
  </div>
</template>

<style scoped>
.report-field-selector {
  inline-size: 100%;
}

.available-fields,
.selected-fields {
  padding: 16px;
  border: 2px dashed rgb(var(--v-border-color));
  border-radius: 8px;
  min-block-size: 200px;
  transition: border-color 0.2s ease;
}

.available-fields:hover,
.selected-fields:hover {
  border-color: rgb(var(--v-theme-primary));
}

.field-item {
  display: flex;
  align-items: center;
  border: 1px solid rgb(var(--v-border-color));
  border-radius: 6px;
  background: rgb(var(--v-theme-surface));
  cursor: grab;
  margin-block-end: 8px;
  padding-block: 8px;
  padding-inline: 12px;
  transition: all 0.2s ease;
}

.field-item:hover {
  border-color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-primary-container));
}

.field-item:active {
  cursor: grabbing;
}

.selected-field-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border: 1px solid rgb(var(--v-border-color));
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
  cursor: grab;
  margin-block-end: 16px;
  transition: all 0.2s ease;
}

.selected-field-item:hover {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 10%);
}

.field-info {
  flex: 1;
  margin-inline-end: 16px;
}

.field-actions {
  display: flex;
  align-items: center;
}

.drag-handle {
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.field-name {
  color: rgb(var(--v-theme-on-surface));
  font-weight: 500;
}
</style>
