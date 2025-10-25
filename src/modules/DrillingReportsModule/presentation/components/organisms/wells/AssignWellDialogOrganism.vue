<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import * as yup from 'yup'
import { DrillingReportApiService } from '../../../../infrastructure/api/services/DrillingReportApiService'
import { validateWellData, wellValidationSchema } from '../../../schemas'
import { useWellOptions } from '../../../composables/useWellOptions'
import { useNotification } from '@/helpers/notificationHelper'
import { useErrorTranslation } from '@/helpers/errorTranslationHelper'

export interface WellDialogProps {
  modelValue: boolean
  projectId: string
  projectStatus?: string
  well?: any
  loading?: boolean
}

const props = withDefaults(defineProps<WellDialogProps>(), {
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'create': [data: any]
  'update': [wellId: string, data: any]
  'delete': [wellId: string]
}>()

const formRef = ref()
const isEditing = computed(() => !!props.well)

const isDeletable = computed(() => {
  if (!props.well || !props.projectStatus)
    return false

  return props.projectStatus === 'planned' && props.well.status === 'planned'
})

const isEditable = computed(() => {
  if (!props.well)
    return true

  return props.well.status === 'planned'
})

// Composables
const { showSuccess, showError } = useNotification()
const { translateError } = useErrorTranslation()
const { statusOptions, drillingTypeOptions } = useWellOptions()

const localDialog = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const formData = ref({
  well_name: '',
  well_code: '',
  location: '',
  surface_coordinates: {
    latitude: null as number | null,
    longitude: null as number | null,
  },
  planned_depth_meters: null as number | null,
  hole_diameter_inches: null as number | null,
  current_depth_meters: 0,
  status: 'planned',
  drilling_type: null as string | null,
  spud_date: '',
  expected_end_date: '',
  notes: '',
})

// Options are now provided by the composable

// Helper function to create Vuetify rules from Yup schema
const createVuetifyRule = (yupSchema: any) => {
  return (value: any) => {
    try {
      yupSchema.validateSync(value)

      return true
    }
    catch (error) {
      if (error instanceof yup.ValidationError)
        return error.message

      return 'Error de validación'
    }
  }
}

// Validation rules for Vuetify (generated from Yup schema)
const rules = {
  required: (v: any) => {
    if (!v)
      return 'Este campo es requerido'
    if (typeof v === 'string' && v.trim() === '')
      return 'Este campo no puede estar vacío'

    return true
  },
  wellName: createVuetifyRule(wellValidationSchema.fields.well_name),
  wellCode: createVuetifyRule(wellValidationSchema.fields.well_code),
  location: createVuetifyRule(wellValidationSchema.fields.location),
  latitude: createVuetifyRule(wellValidationSchema.fields.surface_coordinates.fields.latitude),
  longitude: createVuetifyRule(wellValidationSchema.fields.surface_coordinates.fields.longitude),
  plannedDepth: createVuetifyRule(wellValidationSchema.fields.planned_depth_meters),
  holeDiameter: createVuetifyRule(wellValidationSchema.fields.hole_diameter_inches),
  currentDepth: createVuetifyRule(wellValidationSchema.fields.current_depth_meters),
  status: createVuetifyRule(wellValidationSchema.fields.status),
  drillingType: createVuetifyRule(wellValidationSchema.fields.drilling_type),
  spudDate: createVuetifyRule(wellValidationSchema.fields.spud_date),
  expectedEndDate: createVuetifyRule(wellValidationSchema.fields.expected_end_date),
  notes: createVuetifyRule(wellValidationSchema.fields.notes),
}

// Load well data when editing
const loadWellData = () => {
  if (props.well) {
    formData.value = {
      well_name: props.well.wellName || '',
      well_code: props.well.wellCode || '',
      location: props.well.location || '',
      surface_coordinates: {
        latitude: props.well.surfaceCoordinates?.latitude || null,
        longitude: props.well.surfaceCoordinates?.longitude || null,
      },
      planned_depth_meters: props.well.plannedDepthMeters || null,
      hole_diameter_inches: props.well.holeDiameterInches || null,
      current_depth_meters: props.well.currentDepthMeters || 0,
      status: props.well.status || 'planned',
      drilling_type: props.well.drillingType || null,
      spud_date: props.well.spudDate || '',
      expected_end_date: props.well.expectedEndDate || '',
      notes: props.well.notes || '',
    }
  }
}

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid)
    return

  try {
    const payload = {
      ...formData.value,
      project_id: props.projectId,
    }

    // Validate with Yup using helper function
    const validationResult = await validateWellData(payload)

    if (!validationResult.success) {
      console.error('Validation errors:', validationResult.errors)

      return
    }

    const validatedData = validationResult.data

    if (isEditing.value) {
      // Update existing well
      emit('update', props.well!.id, validatedData)
      showSuccess('DrillingReportsModule.wells.updated_successfully', 'DrillingReportsModule.wells.well_updated')
    }
    else {
      // Create new well
      emit('create', validatedData)
      showSuccess('DrillingReportsModule.wells.created_successfully', 'DrillingReportsModule.wells.well_created')
    }
  }
  catch (error: any) {
    console.error('Error saving well:', error)

    const errorMessage = isEditing.value
      ? 'DrillingReportsModule.wells.update_error'
      : 'DrillingReportsModule.wells.save_error'

    const errorTitle = 'DrillingReportsModule.wells.well_error'

    if (error?.response?.data?.error?.message) {
      const translatedMessage = translateError(error.response.data.error.message, 'well')

      showError(translatedMessage, errorTitle)
    }
    else if (error?.response?.data?.message) {
      const translatedMessage = translateError(error.response.data.message, 'well')

      showError(translatedMessage, errorTitle)
    }
    else if (error?.message) {
      showError(error.message, errorTitle)
    }
    else {
      showError(errorMessage, errorTitle)
    }
  }
}

const handleDelete = async () => {
  if (!props.well?.id)
    return

  try {
    emit('delete', props.well.id)
    showSuccess('DrillingReportsModule.wells.deleted_successfully', 'DrillingReportsModule.wells.well_deleted')
    localDialog.value = false
  }
  catch (error: any) {
    console.error('Error deleting well:', error)
    showError('DrillingReportsModule.wells.delete_error', 'DrillingReportsModule.wells.well_error')
  }
}

const handleCancel = () => {
  formRef.value?.reset()
  localDialog.value = false
}

// Load well data when dialog opens
watch(() => props.modelValue, newValue => {
  if (newValue)
    loadWellData()
})

// Watch for well changes
watch(() => props.well, () => {
  if (props.modelValue)
    loadWellData()
}, { deep: true })
</script>

<template>
  <VDialog
    v-model="localDialog"
    max-width="800"
    persistent
    scrollable
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between sticky-header pa-4">
        <div class="d-flex align-center gap-2">
          <VIcon
            icon="tabler-droplet"
            color="primary"
            size="20"
          />
          <span class="text-h6">
            {{ isEditing ? 'Editar Pozo' : 'Crear Nuevo Pozo' }}
          </span>
        </div>
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          @click="handleCancel"
        />
      </VCardTitle>

      <VDivider />

      <VCardText
        class="pa-4"
        style="max-block-size: 60vh; overflow-y: auto;"
      >
        <!-- Info message for non-editable wells -->
        <VAlert
          v-if="isEditing && !isEditable"
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          <template #prepend>
            <VIcon icon="tabler-alert-triangle" />
          </template>
          <VAlertTitle>Pozo en Progreso</VAlertTitle>
          <div class="text-body-2">
            Este pozo ya ha sido iniciado y no puede ser editado. Solo se puede eliminar si el proyecto está en estado "Planeado" y el pozo no ha sido iniciado.
          </div>
        </VAlert>

        <!-- Well Form -->
        <VForm
          ref="formRef"
          class="compact-form"
          @submit.prevent="handleSubmit"
        >
          <VRow dense>
            <!-- Well Name -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.well_name"
                label="Nombre del Pozo *"
                prepend-inner-icon="tabler-droplet"
                :rules="[rules.wellName]"
                :disabled="isEditing && !isEditable"
                counter="200"
                required
              />
            </VCol>

            <!-- Well Code -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.well_code"
                label="Código del Pozo"
                prepend-inner-icon="tabler-hash"
                :rules="[rules.wellCode]"
                :disabled="isEditing && !isEditable"
                counter="100"
              />
            </VCol>

            <!-- Location -->
            <VCol cols="12">
              <VTextField
                v-model="formData.location"
                label="Ubicación *"
                prepend-inner-icon="tabler-map-pin"
                :rules="[rules.location]"
                :disabled="isEditing && !isEditable"
                counter="300"
                required
              />
            </VCol>

            <!-- Coordinates -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="formData.surface_coordinates.latitude"
                label="Latitud *"
                type="number"
                step="0.000001"
                prepend-inner-icon="tabler-compass"
                :rules="[rules.latitude]"
                :disabled="isEditing && !isEditable"
                placeholder="-90 a 90"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="formData.surface_coordinates.longitude"
                label="Longitud *"
                type="number"
                step="0.000001"
                prepend-inner-icon="tabler-compass"
                :rules="[rules.longitude]"
                :disabled="isEditing && !isEditable"
                placeholder="-180 a 180"
                required
              />
            </VCol>

            <!-- Planned Depth -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="formData.planned_depth_meters"
                label="Profundidad Planificada *"
                type="number"
                step="0.01"
                min="0"
                prepend-inner-icon="tabler-ruler"
                suffix="m"
                :rules="[rules.plannedDepth]"
                :disabled="isEditing && !isEditable"
                required
              />
            </VCol>

            <!-- Hole Diameter -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="formData.hole_diameter_inches"
                label="Diámetro del Hoyo *"
                type="number"
                step="0.125"
                min="0"
                prepend-inner-icon="tabler-circle"
                suffix="in"
                :rules="[rules.holeDiameter]"
                :disabled="isEditing && !isEditable"
                required
              />
            </VCol>

            <!-- Current Depth -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="formData.current_depth_meters"
                label="Profundidad Actual"
                type="number"
                step="0.01"
                min="0"
                prepend-inner-icon="tabler-arrow-down"
                suffix="m"
                :rules="[rules.currentDepth]"
                :disabled="isEditing && !isEditable"
              />
            </VCol>

            <!-- Status -->
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="formData.status"
                label="Estado *"
                :items="statusOptions"
                prepend-inner-icon="tabler-status-change"
                :rules="[rules.status]"
                :disabled="isEditing && !isEditable"
                required
              />
            </VCol>

            <!-- Drilling Type -->
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="formData.drilling_type"
                label="Tipo de Perforación"
                :items="drillingTypeOptions"
                prepend-inner-icon="tabler-tool"
                :rules="[rules.drillingType]"
                :disabled="isEditing && !isEditable"
              />
            </VCol>

            <!-- Spud Date -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.spud_date"
                label="Fecha de Inicio (Spud Date) *"
                type="date"
                prepend-inner-icon="tabler-calendar"
                :rules="[rules.spudDate]"
                :disabled="isEditing && !isEditable"
                required
              />
            </VCol>

            <!-- Expected End Date -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.expected_end_date"
                label="Fecha Esperada de Fin"
                type="date"
                prepend-inner-icon="tabler-calendar-check"
                :rules="[rules.expectedEndDate]"
                :disabled="isEditing && !isEditable"
              />
            </VCol>

            <!-- Notes -->
            <VCol cols="12">
              <VTextarea
                v-model="formData.notes"
                label="Notas"
                rows="3"
                counter="1000"
                :rules="[rules.notes]"
                :disabled="isEditing && !isEditable"
                prepend-inner-icon="tabler-note"
              />
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VSpacer />

        <!-- Delete button (only if editing and deletable) -->
        <VBtn
          v-if="isEditing && isDeletable"
          color="error"
          variant="outlined"
          @click="handleDelete"
        >
          <VIcon
            start
            icon="tabler-trash"
          />
          Eliminar
        </VBtn>

        <VBtn
          variant="text"
          @click="handleCancel"
        >
          Cancelar
        </VBtn>

        <VBtn
          color="primary"
          :loading="loading"
          :disabled="isEditing && !isEditable"
          @click="handleSubmit"
        >
          <VIcon
            start
            :icon="isEditing ? 'tabler-device-floppy' : 'tabler-plus'"
          />
          {{ isEditing ? 'Actualizar' : 'Crear' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped lang="scss">
.sticky-header {
  position: sticky;
  z-index: 10;
  background: rgb(var(--v-theme-surface));
  inset-block-start: 0;
}

.compact-form {
  :deep(.v-field) {
    --v-field-padding-top: 8px;
    --v-field-padding-bottom: 8px;
  }

  :deep(.v-input) {
    font-size: 0.875rem;
  }

  :deep(.v-text-field .v-field__input) {
    min-block-size: 36px;
    padding-block: 4px;
  }
}
</style>
