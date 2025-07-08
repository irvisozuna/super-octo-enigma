<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useReportValidation } from '@/modules/DynamicReports/Report/presentation/composables/useReportValidation'

// Props
interface Props {
  modelValue: {
    primary: { field: string; direction: 'ASC' | 'DESC' }
    secondary?: { field: string; direction: 'ASC' | 'DESC' }
    tertiary?: { field: string; direction: 'ASC' | 'DESC' }
  }
  availableFields: Array<{
    field: string
    alias: string
    format: string
    sortable: boolean
  }>
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: Props['modelValue']]
  validation: [isValid: boolean]
}>()

// Composables
const { t } = useI18n()
const { validateSorting, validationErrors } = useReportValidation()

// Estado local
const nullsHandling = ref('LAST')
const caseSensitive = ref(false)

// Computed
const sortableFields = computed(() => {
  return props.availableFields.filter(field => field.sortable)
})

const availableSecondaryFields = computed(() => {
  return sortableFields.value.filter(field =>
    field.field !== props.modelValue.primary.field
    && field.field !== props.modelValue.tertiary?.field,
  )
})

const availableTertiaryFields = computed(() => {
  return sortableFields.value.filter(field =>
    field.field !== props.modelValue.primary.field
    && field.field !== props.modelValue.secondary?.field,
  )
})

const directionOptions = [
  { value: 'ASC', title: t('DynamicReports.report.sorting.ascending') },
  { value: 'DESC', title: t('DynamicReports.report.sorting.descending') },
]

const nullsHandlingOptions = [
  { value: 'FIRST', title: t('DynamicReports.report.sorting.nulls_first') },
  { value: 'LAST', title: t('DynamicReports.report.sorting.nulls_last') },
  { value: 'IGNORE', title: t('DynamicReports.report.sorting.nulls_ignore') },
]

// Métodos
const getFieldName = (fieldName: string) => {
  const field = props.availableFields.find(f => f.field === fieldName)

  return field?.alias || fieldName
}

const getDirectionLabel = (direction: 'ASC' | 'DESC') => {
  return direction === 'ASC'
    ? t('DynamicReports.report.sorting.ascending')
    : t('DynamicReports.report.sorting.descending')
}

const updateSecondarySort = (field: string) => {
  const updated = { ...props.modelValue }
  if (field) {
    updated.secondary = { ...(updated.secondary || {}), field }
    if (!updated.secondary.direction) updated.secondary.direction = 'ASC'
  } else {
    updated.secondary = undefined
  }
  emit('update:modelValue', updated)
  validateSortingLocal()
}

const updateSecondaryDirection = (direction: 'ASC' | 'DESC') => {
  const updated = { ...props.modelValue }
  if (updated.secondary) {
    updated.secondary = { ...updated.secondary, direction }
    emit('update:modelValue', updated)
    validateSortingLocal()
  }
}

const updateTertiarySort = (field: string) => {
  const updated = { ...props.modelValue }
  if (field) {
    updated.tertiary = { ...(updated.tertiary || {}), field }
    if (!updated.tertiary.direction) updated.tertiary.direction = 'ASC'
  } else {
    updated.tertiary = undefined
  }
  emit('update:modelValue', updated)
  validateSortingLocal()
}

const updateTertiaryDirection = (direction: 'ASC' | 'DESC') => {
  const updated = { ...props.modelValue }
  if (updated.tertiary) {
    updated.tertiary = { ...updated.tertiary, direction }
    emit('update:modelValue', updated)
    validateSortingLocal()
  }
}

const updateNullsHandling = (value: string) => {
  nullsHandling.value = value

  // Aquí se podría emitir un evento para actualizar la configuración
}

const updateCaseSensitive = (value: boolean) => {
  caseSensitive.value = value

  // Aquí se podría emitir un evento para actualizar la configuración
}

const validateSortingLocal = async () => {
  const errors = await validateSorting(props.modelValue)
  const isValid = errors.length === 0

  emit('validation', isValid)
}

// Observar cambios en el modelo
watch(() => props.modelValue, validateSortingLocal, { deep: true })

// Validación inicial
onMounted(() => {
  validateSortingLocal()
})
</script>

<template>
  <div class="report-sort-config">
    <!-- Header -->
    <div class="d-flex align-center mb-4">
      <VIcon
        icon="tabler-sort-ascending"
        color="primary"
        size="24"
        class="mr-3"
      />
      <div>
        <h5 class="text-h6 font-weight-medium">
          {{ t('DynamicReports.report.sorting.title') }}
        </h5>
        <p class="text-body-2 text-medium-emphasis">
          {{ t('DynamicReports.report.sorting.description') }}
        </p>
      </div>
    </div>

    <!-- Configuración de Ordenamiento -->
    <VCard class="mb-4">
      <VCardTitle class="d-flex align-center">
        <VIcon
          icon="tabler-sort-1"
          color="primary"
          size="20"
          class="mr-2"
        />
        {{ t('DynamicReports.report.sorting.primary_sort') }}
        <VChip
          color="primary"
          size="small"
          class="ml-2"
        >
          {{ t('DynamicReports.report.sorting.required') }}
        </VChip>
      </VCardTitle>

      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="8"
          >
            <VSelect
              v-model="modelValue.primary.field"
              :label="t('DynamicReports.report.sorting.field')"
              variant="outlined"
              :items="sortableFields"
              item-title="alias"
              item-value="field"
              :rules="[v => !!v || t('validations.required', { field: t('DynamicReports.report.sorting.field') })]"
              @update:model-value="validateSortingLocal"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VSelect
              v-model="modelValue.primary.direction"
              :label="t('DynamicReports.report.sorting.direction')"
              variant="outlined"
              :items="directionOptions"
              @update:model-value="validateSortingLocal"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Ordenamiento Secundario -->
    <VCard class="mb-4">
      <VCardTitle class="d-flex align-center">
        <VIcon
          icon="tabler-sort-2"
          color="secondary"
          size="20"
          class="mr-2"
        />
        {{ t('DynamicReports.report.sorting.secondary_sort') }}
        <VChip
          color="secondary"
          size="small"
          class="ml-2"
        >
          {{ t('DynamicReports.report.sorting.optional') }}
        </VChip>
      </VCardTitle>

      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="8"
          >
            <VSelect
              :model-value="modelValue.secondary?.field"
              :label="t('DynamicReports.report.sorting.field')"
              variant="outlined"
              :items="availableSecondaryFields"
              item-title="alias"
              item-value="field"
              clearable
              @update:model-value="updateSecondarySort"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VSelect
              :model-value="modelValue.secondary?.direction"
              :label="t('DynamicReports.report.sorting.direction')"
              variant="outlined"
              :items="directionOptions"
              :disabled="!modelValue.secondary?.field"
              @update:model-value="updateSecondaryDirection"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Ordenamiento Terciario -->
    <VCard class="mb-4">
      <VCardTitle class="d-flex align-center">
        <VIcon
          icon="tabler-sort-3"
          color="info"
          size="20"
          class="mr-2"
        />
        {{ t('DynamicReports.report.sorting.tertiary_sort') }}
        <VChip
          color="info"
          size="small"
          class="ml-2"
        >
          {{ t('DynamicReports.report.sorting.optional') }}
        </VChip>
      </VCardTitle>

      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="8"
          >
            <VSelect
              :model-value="modelValue.tertiary?.field"
              :label="t('DynamicReports.report.sorting.field')"
              variant="outlined"
              :items="availableTertiaryFields"
              item-title="alias"
              item-value="field"
              clearable
              @update:model-value="updateTertiarySort"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VSelect
              :model-value="modelValue.tertiary?.direction"
              :label="t('DynamicReports.report.sorting.direction')"
              variant="outlined"
              :items="directionOptions"
              :disabled="!modelValue.tertiary?.field"
              @update:model-value="updateTertiaryDirection"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Preview del Ordenamiento -->
    <VCard
      class="mt-4"
      variant="tonal"
    >
      <VCardTitle class="d-flex align-center">
        <VIcon
          icon="tabler-eye"
          size="20"
          class="mr-2"
        />
        {{ t('DynamicReports.report.sorting.preview') }}
      </VCardTitle>

      <VCardText>
        <div class="sorting-preview">
          <div
            v-if="modelValue.primary.field"
            class="sort-item primary"
          >
            <VIcon
              icon="tabler-sort-1"
              color="primary"
              size="16"
              class="mr-2"
            />
            <span class="sort-field">
              {{ getFieldName(modelValue.primary.field) }}
            </span>
            <VChip
              size="x-small"
              :color="modelValue.primary.direction === 'ASC' ? 'success' : 'warning'"
              variant="tonal"
              class="ml-2"
            >
              {{ getDirectionLabel(modelValue.primary.direction) }}
            </VChip>
          </div>

          <div
            v-if="modelValue.secondary?.field"
            class="sort-item secondary"
          >
            <VIcon
              icon="tabler-sort-2"
              color="secondary"
              size="16"
              class="mr-2"
            />
            <span class="sort-field">
              {{ getFieldName(modelValue.secondary.field) }}
            </span>
            <VChip
              size="x-small"
              :color="modelValue.secondary.direction === 'ASC' ? 'success' : 'warning'"
              variant="tonal"
              class="ml-2"
            >
              {{ getDirectionLabel(modelValue.secondary.direction) }}
            </VChip>
          </div>

          <div
            v-if="modelValue.tertiary?.field"
            class="sort-item tertiary"
          >
            <VIcon
              icon="tabler-sort-3"
              color="info"
              size="16"
              class="mr-2"
            />
            <span class="sort-field">
              {{ getFieldName(modelValue.tertiary.field) }}
            </span>
            <VChip
              size="x-small"
              :color="modelValue.tertiary.direction === 'ASC' ? 'success' : 'warning'"
              variant="tonal"
              class="ml-2"
            >
              {{ getDirectionLabel(modelValue.tertiary.direction) }}
            </VChip>
          </div>

          <div
            v-if="!modelValue.primary.field"
            class="text-center py-4"
          >
            <VIcon
              icon="tabler-sort-ascending"
              size="32"
              color="grey"
              class="mb-2"
            />
            <p class="text-body-2 text-medium-emphasis">
              {{ t('DynamicReports.report.sorting.no_sorting_configured') }}
            </p>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Opciones Avanzadas -->
    <VCard class="mt-4">
      <VCardTitle class="d-flex align-center">
        <VIcon
          icon="tabler-settings"
          size="20"
          class="mr-2"
        />
        {{ t('DynamicReports.report.sorting.advanced_options') }}
      </VCardTitle>

      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              v-model="nullsHandling"
              :label="t('DynamicReports.report.sorting.nulls_handling')"
              variant="outlined"
              :items="nullsHandlingOptions"
              @update:model-value="updateNullsHandling"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VSwitch
              v-model="caseSensitive"
              :label="t('DynamicReports.report.sorting.case_sensitive')"
              color="primary"
              hide-details
              @update:model-value="updateCaseSensitive"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

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
          {{ t('validation.sorting_errors') }}
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
.report-sort-config {
  inline-size: 100%;
}

.sorting-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sort-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid rgb(var(--v-border-color));
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
  transition: all 0.2s ease;
}

.sort-item.primary {
  border-inline-start: 4px solid rgb(var(--v-theme-primary));
}

.sort-item.secondary {
  border-inline-start: 4px solid rgb(var(--v-theme-secondary));
}

.sort-item.tertiary {
  border-inline-start: 4px solid rgb(var(--v-theme-info));
}

.sort-field {
  color: rgb(var(--v-theme-on-surface));
  font-weight: 500;
}

:deep(.v-card) {
  transition: all 0.2s ease;
}

:deep(.v-card:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 10%);
}
</style>
